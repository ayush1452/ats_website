import { NextResponse } from "next/server";

import { productConfig } from "@/config/product";
import { rewriteRequestSchema } from "@/lib/analysis";
import { createOptionalOpenAIProvider } from "@/lib/providers";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";
import type { Recommendation } from "@/types/domain";

import {
  createSupabaseAdminClient,
  requireUser,
} from "../_lib/auth";
import {
  ApiError,
  assertSameOrigin,
  checkMemoryRateLimit,
  errorResponse,
  requestFingerprintHash,
} from "../_lib/security";

export const runtime = "nodejs";
export const maxDuration = 30;

function deterministicRewrite(input: {
  source: string;
  instruction: string;
}): Recommendation {
  return {
    id: crypto.randomUUID(),
    findingId: "ad-hoc-rewrite",
    title: "Evidence-first rewrite template",
    originalText: input.source,
    suggestedText:
      "Led [specific action and scope], resulting in [verified outcome and measurement].",
    rationale:
      `No semantic provider is configured, so ${productConfig.name} provides a deterministic template without inventing facts.`,
    changes: [
      `Applies the requested direction: ${input.instruction.slice(0, 160)}`,
      "Uses a direct action verb",
      "Leaves facts as verification placeholders",
    ],
    requiresVerification: true,
    status: "pending",
  };
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    checkMemoryRateLimit(request, {
      namespace: "rewrite",
      limit: 20,
      windowMs: 10 * 60 * 1_000,
    });
    const input = rewriteRequestSchema.parse(await request.json());
    let provider = null;
    let responseMode: "demo" | "deterministic" | "hybrid" = "demo";
    if (isSupabaseServerConfigured()) {
      const { user } = await requireUser();
      const demoSession = user.user_metadata?.demo_session === true;
      provider = demoSession ? null : createOptionalOpenAIProvider();
      responseMode = provider
        ? "hybrid"
        : demoSession
          ? "demo"
          : "deterministic";

      if (provider) {
        const admin = createSupabaseAdminClient();
        const { data: allowed, error } = await admin.rpc(
          "reserve_rate_limit",
          {
            p_namespace: "rewrite",
            p_key_hash: requestFingerprintHash(request),
            p_limit: 20,
            p_window_seconds: 600,
          },
        );
        if (error || !allowed) {
          throw new ApiError(
            "Too many rewrite requests. Please wait and try again.",
            429,
            "RATE_LIMITED",
          );
        }
      }
    }
    const recommendation = provider
      ? await provider.rewrite(input)
      : deterministicRewrite(input);

    return NextResponse.json(
      {
        ok: true,
        mode: responseMode,
        recommendation,
        disclaimer:
          "Verify every factual detail before applying a suggested rewrite.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
