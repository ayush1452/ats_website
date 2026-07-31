import { createHash, randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { SupabaseRepository } from "@/lib/repositories";

import { requireUser } from "../_lib/auth";
import {
  assertSameOrigin,
  checkMemoryRateLimit,
  errorResponse,
} from "../_lib/security";

const createShareSchema = z
  .object({
    scanId: z.string().min(1).max(128),
    expiresInDays: z.number().int().min(1).max(30).default(7),
  })
  .strict();

const revokeShareSchema = z
  .object({
    shareId: z.string().uuid(),
  })
  .strict();

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    checkMemoryRateLimit(request, {
      namespace: "share",
      limit: 20,
      windowMs: 60 * 60 * 1_000,
    });
    const input = createShareSchema.parse(await request.json());
    const { user, client } = await requireUser();
    const repository = new SupabaseRepository(client);
    const report = await repository.getScan(input.scanId);
    if (!report) {
      return NextResponse.json(
        { error: "Report not found.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(
      Date.now() + input.expiresInDays * 24 * 60 * 60 * 1_000,
    ).toISOString();
    const { data, error } = await client
      .from("report_shares")
      .insert({
        scan_id: input.scanId,
        user_id: user.id,
        token_hash: tokenHash(token),
        expires_at: expiresAt,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error("Share creation failed.");

    return NextResponse.json(
      {
        ok: true,
        shareId: data.id,
        url: new URL(`/share/${token}`, request.url).toString(),
        expiresAt,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const input = revokeShareSchema.parse(await request.json());
    const { user, client } = await requireUser();
    const { data, error } = await client
      .from("report_shares")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", input.shareId)
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw new Error("Share revocation failed.");
    if (!data) {
      return NextResponse.json(
        { error: "Share not found.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
