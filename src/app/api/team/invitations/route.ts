import { createHash, randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { plans } from "@/config/plans";

import {
  createSupabaseAdminClient,
  requireUser,
} from "../../_lib/auth";
import {
  ApiError,
  assertSameOrigin,
  checkMemoryRateLimit,
  errorResponse,
} from "../../_lib/security";

const invitationSchema = z
  .object({
    teamId: z.string().uuid(),
    email: z.string().email().max(254),
    role: z.enum(["admin", "coach", "member", "viewer"]),
  })
  .strict();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    checkMemoryRateLimit(request, {
      namespace: "team-invitation",
      limit: 20,
      windowMs: 10 * 60 * 1_000,
    });
    const input = invitationSchema.parse(await request.json());
    const { user, client } = await requireUser();
    if (user.is_anonymous || !user.email_confirmed_at) {
      throw new ApiError(
        "Verify your account before inviting team members.",
        403,
        "VERIFIED_ACCOUNT_REQUIRED",
      );
    }

    const [{ data: team }, { data: membership }] = await Promise.all([
      client
        .from("teams")
        .select("id,owner_id")
        .eq("id", input.teamId)
        .maybeSingle(),
      client
        .from("team_members")
        .select("role,status")
        .eq("team_id", input.teamId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    const canInvite =
      team?.owner_id === user.id ||
      (membership?.status === "active" &&
        (membership.role === "owner" || membership.role === "admin"));
    if (!team || !canInvite) {
      throw new ApiError(
        "You do not have permission to invite members.",
        403,
        "TEAM_ADMIN_REQUIRED",
      );
    }

    const admin = createSupabaseAdminClient();
    const ownerId = String(team.owner_id);
    const [
      { data: subscription, error: subscriptionError },
      { count: memberCount, error: memberCountError },
      { count: invitationCount, error: invitationCountError },
    ] = await Promise.all([
      admin
        .from("subscriptions")
        .select("plan,status")
        .eq("user_id", ownerId)
        .maybeSingle(),
      admin
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("team_id", input.teamId)
        .eq("status", "active"),
      admin
        .from("team_invitations")
        .select("id", { count: "exact", head: true })
        .eq("team_id", input.teamId)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString()),
    ]);
    if (subscriptionError || memberCountError || invitationCountError) {
      throw new ApiError(
        "Team seat availability could not be verified.",
        503,
        "SEAT_LIMIT_UNAVAILABLE",
      );
    }
    if (
      subscription?.plan !== "teams" ||
      !["active", "trialing"].includes(String(subscription.status))
    ) {
      throw new ApiError(
        "A current Teams & Coaches plan is required to invite members.",
        403,
        "TEAM_PLAN_REQUIRED",
      );
    }
    const seatLimit =
      plans.find((plan) => plan.id === "teams")?.seats ?? 5;
    if ((memberCount ?? 0) + (invitationCount ?? 0) >= seatLimit) {
      throw new ApiError(
        `This workspace has reached its ${seatLimit}-seat limit.`,
        409,
        "SEAT_LIMIT_REACHED",
      );
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1_000,
    ).toISOString();
    const { data, error } = await client
      .from("team_invitations")
      .insert({
        team_id: input.teamId,
        invited_by: user.id,
        email: input.email.trim().toLowerCase(),
        role: input.role,
        token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .select("id,email,role")
      .single();
    if (error || !data) {
      throw new ApiError(
        "The invitation could not be saved.",
        503,
        "INVITATION_SAVE_FAILED",
      );
    }

    const inviteUrl = new URL(
      `/app/team/invitations/${token}`,
      new URL(request.url).origin,
    ).toString();
    return NextResponse.json(
      {
        ok: true,
        invitation: data,
        inviteUrl,
        expiresAt,
        delivery: "link_only",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
