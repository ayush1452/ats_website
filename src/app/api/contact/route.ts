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

const contactSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    company: z.string().trim().max(160).optional(),
    topic: z.string().trim().max(120).optional(),
    message: z.string().trim().min(20).max(5_000),
    captchaToken: z.string().max(4_000).optional(),
  })
  .strict();

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    checkMemoryRateLimit(request, {
      namespace: "contact",
      limit: 5,
      windowMs: 60 * 60 * 1_000,
    });
    const input = contactSchema.parse(await request.json());
    await verifyCaptchaIfConfigured(request, input.captchaToken ?? null);

    const client = await createServerSupabaseClient();
    if (!client) {
      return NextResponse.json({
        ok: true,
        mode: "demo",
        persisted: false,
        message:
          "Your form was validated in demo mode, but no message was sent. Configure Supabase to receive submissions.",
      });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("contact_messages").insert({
      name: input.name,
      email: input.email.toLocaleLowerCase(),
      company: input.company ?? null,
      topic: input.topic ?? null,
      message: input.message,
    });
    if (error) throw new Error("Contact persistence failed.");
    return NextResponse.json({ ok: true, mode: "live", persisted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
