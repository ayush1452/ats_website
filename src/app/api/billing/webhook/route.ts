import Stripe from "stripe";
import { NextResponse } from "next/server";

import { plans, type PlanId } from "@/config/plans";

import { createSupabaseAdminClient } from "../../_lib/auth";

export const runtime = "nodejs";

function databaseStatus(
  status: Stripe.Subscription.Status,
): "active" | "trialing" | "past_due" | "canceled" | "incomplete" {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "canceled" || status === "incomplete_expired") return "canceled";
  if (status === "incomplete") return "incomplete";
  return "past_due";
}

function configuredPlan(planId: string | undefined) {
  return plans.find(
    (candidate) =>
      candidate.id === planId &&
      candidate.id !== "free",
  );
}

function timestamp(seconds: number | undefined): string | undefined {
  return seconds ? new Date(seconds * 1_000).toISOString() : undefined;
}

export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !webhookSecret || !signature) {
    return NextResponse.json(
      { error: "Billing webhook is not configured." },
      { status: 503 },
    );
  }

  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json(
      { error: "Webhook signature is invalid." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId =
        session.client_reference_id ?? session.metadata?.user_id;
      const plan = configuredPlan(session.metadata?.plan_id);
      const customerId =
        typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : null;
      if (userId && plan && customerId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const period = subscription.items.data[0];
        const { error } = await admin.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: plan.id,
            status: databaseStatus(subscription.status),
            scan_limit: plan.scans,
            current_period_start:
              timestamp(period?.current_period_start) ??
              new Date().toISOString(),
            current_period_end:
              timestamp(period?.current_period_end) ??
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000).toISOString(),
          },
          { onConflict: "user_id" },
        );
        if (error) throw new Error("Subscription update failed.");
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      const plan = configuredPlan(subscription.metadata.plan_id);
      let userId = subscription.metadata.user_id;
      if (!userId) {
        const { data } = await admin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        userId = typeof data?.user_id === "string" ? data.user_id : "";
      }
      if (userId) {
        const period = subscription.items.data[0];
        const resolvedPlanId: PlanId =
          event.type === "customer.subscription.deleted"
            ? "free"
            : plan?.id ?? "free";
        const resolvedPlan =
          plans.find((candidate) => candidate.id === resolvedPlanId) ??
          plans[0];
        const { error } = await admin.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            plan: resolvedPlanId,
            status:
              event.type === "customer.subscription.deleted"
                ? "canceled"
                : databaseStatus(subscription.status),
            scan_limit: resolvedPlan?.scans ?? 3,
            current_period_start:
              timestamp(period?.current_period_start) ??
              new Date().toISOString(),
            current_period_end:
              timestamp(period?.current_period_end) ??
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000).toISOString(),
          },
          { onConflict: "user_id" },
        );
        if (error) throw new Error("Subscription update failed.");
      }
    }
  } catch {
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
