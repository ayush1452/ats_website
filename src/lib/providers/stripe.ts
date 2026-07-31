import Stripe from "stripe";

import type { BillingService } from "@/types/domain";

type PaidPlanId = "pro" | "career" | "teams";

const PRICE_ENV: Record<
  PaidPlanId,
  Record<"monthly" | "annual", string | undefined>
> = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
  },
  career: {
    monthly: process.env.STRIPE_PRICE_CAREER_MONTHLY,
    annual: process.env.STRIPE_PRICE_CAREER_ANNUAL,
  },
  teams: {
    monthly: process.env.STRIPE_PRICE_TEAMS_MONTHLY,
    annual: process.env.STRIPE_PRICE_TEAMS_ANNUAL,
  },
};

export class StripeBillingService implements BillingService {
  private readonly stripe: Stripe;

  constructor(
    apiKey: string,
    private readonly options: {
      customerId: string;
      userId: string;
      appUrl: string;
    },
  ) {
    if (typeof window !== "undefined") {
      throw new Error("The billing service is server-only.");
    }
    this.stripe = new Stripe(apiKey);
  }

  async createCheckout(
    planId: string,
    billingPeriod: "monthly" | "annual",
    idempotencyKey?: string,
  ): Promise<{ url: string }> {
    if (!["pro", "career", "teams"].includes(planId)) {
      throw new Error("A paid plan is required for checkout.");
    }
    const priceId = PRICE_ENV[planId as PaidPlanId][billingPeriod];
    if (!priceId) {
      throw new Error("Billing is not configured for this plan.");
    }

    const session = await this.stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: this.options.customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${this.options.appUrl}/app/billing?checkout=success`,
        cancel_url: `${this.options.appUrl}/pricing?checkout=cancelled`,
        client_reference_id: this.options.userId,
        metadata: {
          user_id: this.options.userId,
          plan_id: planId,
          billing_period: billingPeriod,
        },
        subscription_data: {
          metadata: {
            user_id: this.options.userId,
            plan_id: planId,
          },
        },
        allow_promotion_codes: true,
      },
      {
        idempotencyKey,
      },
    );
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { url: session.url };
  }

  async createPortal(idempotencyKey?: string): Promise<{ url: string }> {
    const session = await this.stripe.billingPortal.sessions.create(
      {
        customer: this.options.customerId,
        return_url: `${this.options.appUrl}/app/billing`,
      },
      { idempotencyKey },
    );
    return { url: session.url };
  }
}

export function createOptionalStripeService(input: {
  customerId: string;
  userId: string;
}): StripeBillingService | null {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!apiKey || !appUrl) return null;
  return new StripeBillingService(apiKey, { ...input, appUrl });
}
