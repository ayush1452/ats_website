import { NextResponse } from "next/server";
import { z } from "zod";

import type { ResumeVersion } from "@/types/domain";

import { requireUser } from "../../_lib/auth";
import {
  ApiError,
  assertSameOrigin,
  checkMemoryRateLimit,
  errorResponse,
} from "../../_lib/security";

const applySchema = z
  .object({
    scanId: z.string().uuid(),
    recommendationId: z.string().min(1).max(128),
    originalText: z.string().min(1).max(20_000),
    suggestedText: z.string().min(1).max(20_000),
    title: z.string().min(1).max(240),
  })
  .strict();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    checkMemoryRateLimit(request, {
      namespace: "apply-recommendation",
      limit: 30,
      windowMs: 10 * 60 * 1_000,
    });
    const input = applySchema.parse(await request.json());
    const { client } = await requireUser();
    const { data: versionId, error: applyError } = await client.rpc(
      "apply_recommendation_version",
      {
        p_scan_id: input.scanId,
        p_recommendation_external_id: input.recommendationId,
        p_original_text: input.originalText,
        p_suggested_text: input.suggestedText,
        p_title: input.title,
      },
    );
    if (applyError || typeof versionId !== "string") {
      throw new ApiError(
        "The recommendation is stale, unavailable, or outside your editable workspace.",
        409,
        "RECOMMENDATION_NOT_APPLIED",
      );
    }

    const { data: row, error: versionError } = await client
      .from("resume_versions")
      .select(
        "id,version_number,name,content,source,change_summary,created_at,score",
      )
      .eq("id", versionId)
      .maybeSingle();
    if (versionError || !row) {
      throw new ApiError(
        "The new version was created but could not be reloaded.",
        503,
        "VERSION_RELOAD_FAILED",
      );
    }
    const version: ResumeVersion = {
      id: String(row.id),
      version: Number(row.version_number),
      name: String(row.name),
      content: String(row.content),
      source: row.source as ResumeVersion["source"],
      changeSummary: String(row.change_summary),
      createdAt: String(row.created_at),
      score: row.score === null ? undefined : Number(row.score),
    };
    return NextResponse.json(
      { ok: true, version, scoreStale: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
