import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createSupabaseAdminClient,
  requireUser,
} from "../../../_lib/auth";
import {
  ApiError,
  assertSameOrigin,
  checkMemoryRateLimit,
  errorResponse,
} from "../../../_lib/security";

const acceptanceSchema = z
  .object({
    token: z.string().regex(/^[A-Za-z0-9_-]{40,64}$/u),
  })
  .strict();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    checkMemoryRateLimit(request, {
      namespace: "team-invitation-accept",
      limit: 12,
      windowMs: 10 * 60 * 1_000,
    });
    const input = acceptanceSchema.parse(await request.json());
    const { user } = await requireUser();
    if (user.is_anonymous || !user.email || !user.email_confirmed_at) {
      throw new ApiError(
        "Log in with the verified email address that received this invitation.",
        403,
        "VERIFIED_ACCOUNT_REQUIRED",
      );
    }
    const tokenHash = createHash("sha256")
      .update(input.token)
      .digest("hex");
    const admin = createSupabaseAdminClient();
    const { data: teamId, error } = await admin.rpc(
      "accept_team_invitation",
      {
        p_token_hash: tokenHash,
        p_user_id: user.id,
        p_user_email: user.email,
      },
    );
    if (error || !teamId) {
      throw new ApiError(
        "This invitation is invalid, expired, revoked, or belongs to another email address.",
        410,
        "INVITATION_UNAVAILABLE",
      );
    }
    return NextResponse.json(
      { ok: true, teamId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
