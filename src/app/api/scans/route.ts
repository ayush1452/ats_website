import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { plans } from "@/config/plans";
import { DeterministicAnalysisService, STAGE_MESSAGES } from "@/lib/analysis";
import { createOptionalOpenAIProvider } from "@/lib/providers";
import { SupabaseRepository } from "@/lib/repositories";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AnalysisInput,
  AnalysisResult,
  CanonicalResumeDocument,
  ScanSummary,
} from "@/types/domain";

import { parseScanRequest } from "../_lib/scan-request";
import { createSupabaseAdminClient } from "../_lib/auth";
import {
  ApiError,
  assertSameOrigin,
  checkMemoryRateLimit,
  errorResponse,
  requestFingerprintHash,
  safeError,
  verifyCaptchaIfConfigured,
} from "../_lib/security";

export const runtime = "nodejs";
export const maxDuration = 60;

interface LiveScanContext {
  repository: SupabaseRepository;
  client: SupabaseClient;
  userId: string;
  demoSession: boolean;
  idempotencyKey?: string;
  existing?: {
    id: string;
    result: AnalysisResult;
    document: CanonicalResumeDocument;
  };
}

function readIdempotencyKey(request: Request): string | undefined {
  const value = request.headers.get("idempotency-key")?.trim();
  if (!value) return undefined;
  if (!/^[a-zA-Z0-9_.:-]{8,128}$/u.test(value)) {
    throw new ApiError(
      "The idempotency key is invalid.",
      400,
      "INVALID_IDEMPOTENCY_KEY",
    );
  }
  return value;
}

async function reserveLiveQuota(
  scanId: string,
  fingerprintHash: string,
  input: AnalysisInput,
  idempotencyKey?: string,
): Promise<LiveScanContext | null> {
  const authClient = await createServerSupabaseClient();
  if (!authClient) return null;

  let {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    const { data, error } = await authClient.auth.signInAnonymously();
    if (error || !data.user) {
      throw new ApiError(
        "Anonymous scanning is unavailable. Sign in to continue.",
        401,
        "ANONYMOUS_AUTH_UNAVAILABLE",
      );
    }
    user = data.user;
  }

  const client = createSupabaseAdminClient();
  const repository = new SupabaseRepository(client, user.id);
  if (idempotencyKey) {
    const { data: existingScan, error: existingError } = await client
      .from("scans")
      .select("id,status")
      .eq("user_id", user.id)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existingError) {
      throw new ApiError(
        "The request state could not be verified.",
        503,
        "IDEMPOTENCY_UNAVAILABLE",
      );
    }
    if (existingScan) {
      const existing = await repository.getScanBundle(String(existingScan.id));
      if (existing) {
        return {
          repository,
          client,
          userId: user.id,
          demoSession: user.user_metadata?.demo_session === true,
          idempotencyKey,
          existing: {
            id: String(existingScan.id),
            result: existing.result,
            document: existing.document,
          },
        };
      }
      throw new ApiError(
        "A scan with this idempotency key is already processing.",
        409,
        "SCAN_IN_PROGRESS",
      );
    }
  }

  const { data: rateAllowed, error: rateError } = await client.rpc(
    "reserve_rate_limit",
    {
      p_namespace: "scan",
      p_key_hash: fingerprintHash,
      p_limit: 8,
      p_window_seconds: 600,
    },
  );
  if (rateError || !rateAllowed) {
    throw new ApiError(
      "Too many scan requests. Please wait and try again.",
      429,
      "RATE_LIMITED",
    );
  }

  const { data: reserved, error } = await client.rpc("reserve_scan_quota", {
    p_scan_id: scanId,
  });
  if (error) {
    throw new ApiError(
      "Scan quota could not be verified.",
      503,
      "QUOTA_UNAVAILABLE",
    );
  }
  if (!reserved) {
    throw new ApiError(
      "Your scan allowance has been reached for this period.",
      429,
      "SCAN_QUOTA_REACHED",
    );
  }

  if (idempotencyKey) {
    const { error: placeholderError } = await client.from("scans").insert({
      id: scanId,
      user_id: user.id,
      target_role: input.targetRole,
      company: input.company ?? null,
      status: "processing",
      analysis_mode:
        user.user_metadata?.demo_session === true
          ? "demo"
          : "deterministic",
      idempotency_key: idempotencyKey,
    });
    if (placeholderError) {
      await client.rpc("release_scan_quota", { p_scan_id: scanId });
      if (placeholderError.code === "23505") {
        throw new ApiError(
          "A scan with this idempotency key is already processing.",
          409,
          "SCAN_IN_PROGRESS",
        );
      }
      throw new ApiError(
        "The scan could not be initialized.",
        503,
        "SCAN_INITIALIZATION_FAILED",
      );
    }
  }

  return {
    repository,
    client,
    userId: user.id,
    demoSession: user.user_metadata?.demo_session === true,
    idempotencyKey,
  };
}

function cachedResultResponse(
  existing: {
    id: string;
    result: AnalysisResult;
    document: CanonicalResumeDocument;
  },
): Response {
  return new Response(
    `${JSON.stringify({
      type: "stage",
      stage: "complete",
      message: "Returning the completed idempotent scan",
    })}\n${JSON.stringify({
      type: "result",
      id: existing.id,
      result: existing.result,
      document: existing.document,
    })}\n`,
    {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

async function persistLiveScan(
  live: LiveScanContext,
  input: AnalysisInput,
  sourceFile: File | undefined,
  requestedResumeId: string | undefined,
  scanId: string,
  summary: ScanSummary,
  result: AnalysisResult,
): Promise<void> {
  const resumeId = requestedResumeId ?? crypto.randomUUID();
  const versionId = crypto.randomUUID();
  let jobDescriptionId: string | null = null;
  let storagePath: string | null = null;
  let createdResume = false;
  let createdVersion = false;

  try {
    let versionNumber = 1;
    if (requestedResumeId) {
      const { data: existingResume, error: existingResumeError } =
        await live.client
          .from("resumes")
          .select("id")
          .eq("id", requestedResumeId)
          .eq("user_id", live.userId)
          .is("deleted_at", null)
          .maybeSingle();
      if (existingResumeError || !existingResume) {
        throw new ApiError(
          "The selected resume could not be found.",
          404,
          "RESUME_NOT_FOUND",
        );
      }
      const { data: latestVersion, error: latestVersionError } =
        await live.client
          .from("resume_versions")
          .select("version_number")
          .eq("resume_id", requestedResumeId)
          .eq("user_id", live.userId)
          .order("version_number", { ascending: false })
          .limit(1)
          .maybeSingle();
      if (latestVersionError) {
        throw new ApiError(
          "The resume version history could not be loaded.",
          503,
          "VERSION_HISTORY_UNAVAILABLE",
        );
      }
      versionNumber = Number(latestVersion?.version_number ?? 0) + 1;
    } else {
      const [
        { data: subscription, error: subscriptionError },
        { count, error: countError },
      ] =
        await Promise.all([
          live.client
            .from("subscriptions")
            .select("plan,status")
            .eq("user_id", live.userId)
            .maybeSingle(),
          live.client
            .from("resumes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", live.userId)
            .is("deleted_at", null),
        ]);
      if (subscriptionError || countError) {
        throw new ApiError(
          "The resume allowance could not be verified.",
          503,
          "RESUME_LIMIT_UNAVAILABLE",
        );
      }
      const configuredPlan =
        plans.find((plan) => plan.id === subscription?.plan) ?? plans[0]!;
      const activePlan =
        subscription &&
        ["active", "trialing"].includes(String(subscription.status))
          ? configuredPlan
          : plans[0]!;
      if (
        activePlan.resumes !== "unlimited" &&
        (count ?? 0) >= activePlan.resumes
      ) {
        throw new ApiError(
          `The ${activePlan.name} plan includes ${activePlan.resumes} saved resume${activePlan.resumes === 1 ? "" : "s"}. Scan an existing resume version or change plans.`,
          429,
          "RESUME_LIMIT_REACHED",
        );
      }
    }

    const { data: privacy } = await live.client
      .from("privacy_settings")
      .select("auto_delete_uploads")
      .eq("user_id", live.userId)
      .maybeSingle();
    if (sourceFile && !requestedResumeId && !privacy?.auto_delete_uploads) {
      const extension = input.document.filename.match(/\.[a-z0-9]+$/iu)?.[0] ?? "";
      storagePath = `${live.userId}/${resumeId}/${crypto.randomUUID()}${extension}`;
      const { error } = await live.client.storage
        .from("resumes")
        .upload(storagePath, sourceFile, {
          contentType: sourceFile.type,
          upsert: false,
        });
      if (error) throw new Error("The private resume upload could not be stored.");
    }

    if (!requestedResumeId) {
      const { error: resumeError } = await live.client.from("resumes").insert({
        id: resumeId,
        user_id: live.userId,
        name: input.document.filename,
        original_filename: input.document.filename,
        storage_path: storagePath,
        extracted_text: input.document.normalizedText,
      });
      if (resumeError) throw new Error("The resume record could not be saved.");
      createdResume = true;
    }

    const { error: versionError } = await live.client
      .from("resume_versions")
      .insert({
        id: versionId,
        resume_id: resumeId,
        user_id: live.userId,
        version_number: versionNumber,
        name:
          versionNumber === 1
            ? "Original scan input"
            : `Scanned resume version ${versionNumber}`,
        content: input.document.normalizedText,
        source: sourceFile ? "upload" : "paste",
        change_summary: "Resume captured when this scan was created",
        score: result.overallScore,
      });
    if (versionError) throw new Error("The resume version could not be saved.");
    createdVersion = true;

    const { error: currentVersionError } = await live.client
      .from("resumes")
      .update({ current_version_id: versionId })
      .eq("id", resumeId)
      .eq("user_id", live.userId);
    if (currentVersionError) {
      throw new Error("The current resume version could not be linked.");
    }

    if (input.jobDescription) {
      const { data: job, error: jobError } = await live.client
        .from("job_descriptions")
        .insert({
          user_id: live.userId,
          title: input.jobTitle || input.targetRole,
          company: input.company ?? null,
          content: input.jobDescription,
          detected_seniority: input.seniority,
          detected_industry: input.industry,
        })
        .select("id")
        .single();
      if (jobError || !job) {
        throw new Error("The job description could not be saved.");
      }
      jobDescriptionId = String(job.id);
    }

    await live.repository.saveScan(
      scanId,
      summary,
      result,
      input.document,
    );
    const { error: associationError } = await live.client
      .from("scans")
      .update({
        resume_id: resumeId,
        resume_version_id: versionId,
        job_description_id: jobDescriptionId,
      })
      .eq("id", scanId)
      .eq("user_id", live.userId);
    if (associationError) {
      throw new Error("The scan relationships could not be saved.");
    }
  } catch (error) {
    if (createdResume) {
      await live.client.from("resumes").delete().eq("id", resumeId);
    } else if (createdVersion) {
      await live.client
        .from("resume_versions")
        .delete()
        .eq("id", versionId)
        .eq("user_id", live.userId);
    }
    if (jobDescriptionId) {
      await live.client
        .from("job_descriptions")
        .delete()
        .eq("id", jobDescriptionId);
    }
    if (storagePath) {
      await live.client.storage.from("resumes").remove([storagePath]);
    }
    throw error;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    checkMemoryRateLimit(request, {
      namespace: "scan",
      limit: 8,
      windowMs: 10 * 60 * 1_000,
    });
    await verifyCaptchaIfConfigured(
      request,
      request.headers.get("x-captcha-token"),
    );

    const parsedRequest = await parseScanRequest(request);
    const { input, sourceFile } = parsedRequest;
    const scanId = crypto.randomUUID();
    const idempotencyKey = readIdempotencyKey(request);
    const live = await reserveLiveQuota(
      scanId,
      requestFingerprintHash(request),
      input,
      idempotencyKey,
    );
    if (live?.existing) {
      return cachedResultResponse(live.existing);
    }
    const demoAnalysis = !live || live.demoSession;
    const analysisService = new DeterministicAnalysisService(
      demoAnalysis ? undefined : createOptionalOpenAIProvider() ?? undefined,
      demoAnalysis ? "demo" : "deterministic",
    );
    const encoder = new TextEncoder();
    let cancelled = false;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (record: unknown) => {
          if (!request.signal.aborted && !cancelled) {
            controller.enqueue(encoder.encode(`${JSON.stringify(record)}\n`));
          }
        };

        void (async () => {
          let saved = false;
          try {
            const result = await analysisService.analyze(input, (stage) => {
              if (request.signal.aborted || cancelled) {
                throw new ApiError("Scan cancelled.", 499, "SCAN_CANCELLED");
              }
              const key = stage as keyof typeof STAGE_MESSAGES;
              send({
                type: "stage",
                stage,
                message: STAGE_MESSAGES[key] ?? "Analyzing resume",
              });
            });
            const summary: ScanSummary = {
              id: scanId,
              resumeName: input.document.filename,
              targetRole: input.targetRole,
              company: input.company,
              createdAt: result.completedAt,
              overallScore: result.overallScore,
              roleMatch: result.componentScores.roleMatch,
              atsParse: result.componentScores.atsParse,
              status: "complete",
              mode: result.mode,
            };
            if (live) {
              await persistLiveScan(
                live,
                input,
                sourceFile,
                parsedRequest.resumeId,
                scanId,
                summary,
                result,
              );
            }
            saved = true;
            send({
              type: "result",
              id: scanId,
              result,
              document: input.document,
            });
          } catch (error) {
            if (live && !saved) {
              await live.client.rpc("release_scan_quota", {
                p_scan_id: scanId,
              });
              await live.client
                .from("scans")
                .delete()
                .eq("id", scanId)
                .eq("user_id", live.userId);
            }
            const safe = safeError(error);
            send({ type: "error", error: safe.message, code: safe.code });
          } finally {
            if (!request.signal.aborted) controller.close();
          }
        })();
      },
      cancel() {
        cancelled = true;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export function GET(): NextResponse {
  return NextResponse.json(
    {
      error: "Submit a resume with POST.",
      code: "METHOD_NOT_ALLOWED",
    },
    { status: 405, headers: { Allow: "POST" } },
  );
}
