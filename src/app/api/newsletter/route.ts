import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import { createSupabaseAdminClient } from "../_lib/auth";
import {
  assertSameOrigin,
  checkMemoryRateLimit,
  errorResponse,
  verifyCaptchaIfConfigured,
} from "../_lib/security";

const newsletterSchema = z
  .object({
    email: z.string().trim().email().max(254),
    captchaToken: z.string().max(4_000).optional(),
  })
  .strict();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    checkMemoryRateLimit(request, {
      namespace: "newsletter",
      limit: 5,
      windowMs: 60 * 60 * 1_000,
    });
    const input = newsletterSchema.parse(await request.json());
    await verifyCaptchaIfConfigured(request, input.captchaToken ?? null);

    const client = await createServerSupabaseClient();
    if (!client) {
      return NextResponse.json({
        ok: true,
        mode: "demo",
        persisted: false,
        message:
          "The address was validated in demo mode but was not subscribed. Configure Supabase to enable signups.",
      });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("newsletter_subscriptions").upsert(
      {
        email: input.email.toLocaleLowerCase(),
        status: "active",
      },
      { onConflict: "email" },
    );
    if (error) throw new Error("Newsletter persistence failed.");
    return NextResponse.json({ ok: true, mode: "live", persisted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
