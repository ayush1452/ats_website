import Stripe from "stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

import { StripeBillingService } from "@/lib/providers";

import { createSupabaseAdminClient, requireUser } from "../../_lib/auth";
import {
  ApiError,
  assertSameOrigin,
  checkMemoryRateLimit,
  errorResponse,
} from "../../_lib/security";

const checkoutSchema = z
  .object({
    planId: z.enum(["pro", "career", "teams"]),
    billingPeriod: z.enum(["monthly", "annual"]),
  })
  .strict();

function idempotencyKey(request: Request): string {
  const supplied = request.headers.get("idempotency-key")?.trim();
  if (supplied && /^[a-zA-Z0-9_.:-]{8,128}$/u.test(supplied)) return supplied;
  return crypto.randomUUID();
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    checkMemoryRateLimit(request, {
      namespace: "billing-checkout",
      limit: 10,
      windowMs: 10 * 60 * 1_000,
    });
    const input = checkoutSchema.parse(await request.json());
    const secret = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!secret || !appUrl) {
      throw new ApiError(
        "Checkout is not configured on this deployment.",
        503,
        "BILLING_NOT_CONFIGURED",
      );
    }

    const { user, client } = await requireUser();
    if (user.is_anonymous || !user.email || !user.email_confirmed_at) {
      throw new ApiError(
        "Verify your email before starting a billing session.",
        403,
        "VERIFIED_ACCOUNT_REQUIRED",
      );
    }
    const { data: subscription, error: subscriptionError } = await client
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (subscriptionError) {
      throw new ApiError(
        "Billing status could not be loaded.",
        503,
        "BILLING_UNAVAILABLE",
      );
    }

    let customerId =
      typeof subscription?.stripe_customer_id === "string"
        ? subscription.stripe_customer_id
        : null;
    const requestKey = idempotencyKey(request);
    if (!customerId) {
      const stripe = new Stripe(secret);
      const customer = await stripe.customers.create(
        {
          email: user.email,
          metadata: { user_id: user.id },
        },
        { idempotencyKey: `customer:${user.id}` },
      );
      customerId = customer.id;
      const admin = createSupabaseAdminClient();
      const { error } = await admin.from("subscriptions").upsert(
        {
          user_id: user.id,
          stripe_customer_id: customerId,
        },
        { onConflict: "user_id" },
      );
      if (error) {
        throw new ApiError(
          "Billing profile could not be saved.",
          503,
          "BILLING_UNAVAILABLE",
        );
      }
    }

    const service = new StripeBillingService(secret, {
      customerId,
      userId: user.id,
      appUrl,
    });
    const checkout = await service.createCheckout(
      input.planId,
      input.billingPeriod,
      `checkout:${requestKey}`,
    );
    return NextResponse.json(
      { ok: true, url: checkout.url },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
