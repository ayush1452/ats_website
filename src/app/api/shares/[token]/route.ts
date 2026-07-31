import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { analysisResultSchema } from "@/lib/analysis";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { errorResponse } from "../../_lib/security";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  try {
    const { token } = await context.params;
    if (!/^[a-zA-Z0-9_-]{40,80}$/u.test(token)) {
      return NextResponse.json(
        { error: "Share not found.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    const client = await createServerSupabaseClient();
    if (!client) {
      return NextResponse.json(
        {
          error: "External sharing requires a configured backend.",
          code: "BACKEND_REQUIRED",
        },
        { status: 503 },
      );
    }

    const hash = createHash("sha256").update(token).digest("hex");
    const { data, error } = await client.rpc("get_shared_report", {
      p_token_hash: hash,
    });
    if (error || !data) {
      return NextResponse.json(
        { error: "Share not found or no longer available.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const payload: { result: unknown; expires_at?: unknown } =
      typeof data === "object" && data !== null && "result" in data
        ? (data as { result: unknown; expires_at?: unknown })
        : { result: data };
    const result = analysisResultSchema.parse(payload.result);
    const expiresAt =
      typeof payload.expires_at === "string" ? payload.expires_at : null;
    return NextResponse.json(
      { result, expiresAt },
      {
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
