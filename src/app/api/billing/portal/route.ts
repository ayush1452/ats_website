import { NextResponse } from "next/server";

import { StripeBillingService } from "@/lib/providers";

import { requireUser } from "../../_lib/auth";
import {
  ApiError,
  assertSameOrigin,
  checkMemoryRateLimit,
  errorResponse,
} from "../../_lib/security";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    checkMemoryRateLimit(request, {
      namespace: "billing-portal",
      limit: 10,
      windowMs: 10 * 60 * 1_000,
    });
    const secret = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!secret || !appUrl) {
      throw new ApiError(
        "Billing management is not configured on this deployment.",
        503,
        "BILLING_NOT_CONFIGURED",
      );
    }

    const { user, client } = await requireUser();
    if (user.is_anonymous || !user.email || !user.email_confirmed_at) {
      throw new ApiError(
        "Verify your email before managing billing.",
        403,
        "VERIFIED_ACCOUNT_REQUIRED",
      );
    }
    const { data, error } = await client
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      throw new ApiError(
        "Billing status could not be loaded.",
        503,
        "BILLING_UNAVAILABLE",
      );
    }
    if (!data?.stripe_customer_id) {
      throw new ApiError(
        "There is no live billing account to manage.",
        400,
        "NO_BILLING_ACCOUNT",
      );
    }

    const service = new StripeBillingService(secret, {
      customerId: String(data.stripe_customer_id),
      userId: user.id,
      appUrl,
    });
    const supplied = request.headers.get("idempotency-key")?.trim();
    const portal = await service.createPortal(
      supplied && /^[a-zA-Z0-9_.:-]{8,128}$/u.test(supplied)
        ? `portal:${supplied}`
        : undefined,
    );
    return NextResponse.json(
      { ok: true, url: portal.url },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
