"use client";

import { Check, ChevronDown, Minus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { plans } from "@/config/plans";
import { productConfig } from "@/config/product";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "annual";

const comparisonRows: Array<{
  label: string;
  values: Record<(typeof plans)[number]["id"], string | boolean>;
}> = [
  {
    label: "Scans per month",
    values: { free: "3", pro: "30", career: "100", teams: "250" },
  },
  {
    label: "Saved resumes",
    values: { free: "1", pro: "10", career: "Unlimited", teams: "Unlimited" },
  },
  {
    label: "Complete job-match analysis",
    values: { free: false, pro: true, career: true, teams: true },
  },
  {
    label: "AI-assisted rewrites",
    values: { free: false, pro: true, career: true, teams: true },
  },
  {
    label: "Version comparison",
    values: { free: "Sample", pro: true, career: true, teams: true },
  },
  {
    label: "PDF report export",
    values: { free: false, pro: true, career: true, teams: true },
  },
  {
    label: "Shared workspace",
    values: { free: false, pro: false, career: false, teams: true },
  },
  {
    label: "Included seats",
    values: { free: "1", pro: "1", career: "1", teams: "5" },
  },
];

function PlanValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--primary-dark)]">
        <Check aria-label="Included" className="size-4" />
        <span className="sr-only">Included</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="text-[var(--text-muted)]">
        <Minus aria-label="Not included" className="size-4" />
        <span className="sr-only">Not included</span>
      </span>
    );
  }
  return <span>{value}</span>;
}

export function PricingExplorer() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  return (
    <>
      <div className="mx-auto mt-10 flex w-fit items-center rounded-full border border-[var(--border)] bg-white p-1 shadow-[var(--shadow-sm)]">
        {(["monthly", "annual"] as BillingCycle[]).map((cycle) => (
          <button
            aria-pressed={billingCycle === cycle}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
              billingCycle === cycle
                ? "bg-[var(--primary-dark)] text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text)]",
            )}
            key={cycle}
            onClick={() => setBillingCycle(cycle)}
            type="button"
          >
            {cycle === "monthly" ? "Monthly" : "Annual"}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
        Annual prices are shown as a full-year total. No time-limited discount.
      </p>

      <div className="mt-10 grid gap-px overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--border)] shadow-[var(--shadow-sm)] md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
          const destination =
            plan.id === "teams" ? "/contact?topic=teams" : `/signup?plan=${plan.id}&billing=${billingCycle}`;

          return (
            <article
              className={cn(
                "relative flex min-h-full flex-col bg-white p-6 sm:p-7",
                plan.recommended && "bg-[#f8fcf9]",
              )}
              key={plan.id}
            >
              <div className="min-h-7">
                {plan.recommended ? <Badge tone="success">Most useful for active searches</Badge> : null}
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em]">{plan.name}</h2>
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-[var(--text-secondary)]">
                {plan.description}
              </p>
              <div className="mt-7">
                <span className="text-4xl font-semibold tracking-[-0.055em]">${price}</span>
                <span className="ml-1 text-sm text-[var(--text-muted)]">
                  {price === 0 ? "forever" : billingCycle === "monthly" ? "/ month" : "/ year"}
                </span>
              </div>
              {billingCycle === "annual" && price > 0 ? (
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  About ${Math.round(price / 12)} per month, billed annually
                </p>
              ) : (
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {plan.scans} completed scans per month
                </p>
              )}
              <Button
                asChild
                className="mt-7 w-full"
                variant={plan.recommended ? "primary" : "secondary"}
              >
                <Link href={destination}>
                  {plan.id === "free" ? "Start free" : plan.id === "teams" ? "Talk to us" : `Choose ${plan.name}`}
                </Link>
              </Button>
              <ul className="mt-7 space-y-3 border-t border-[var(--border)] pt-6">
                {plan.features.map((feature) => (
                  <li className="flex gap-2.5 text-sm leading-5" key={feature}>
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-7 text-xs leading-5 text-[var(--text-muted)]">
                {plan.resumes === "unlimited" ? "Unlimited" : plan.resumes} saved resume
                {plan.resumes === 1 ? "" : "s"} · {plan.seats} seat{plan.seats === 1 ? "" : "s"}
              </p>
            </article>
          );
        })}
      </div>

      <details className="group mt-12 overflow-hidden rounded-[20px] border border-[var(--border)] bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)] [&::-webkit-details-marker]:hidden sm:p-6">
          Compare every plan feature
          <ChevronDown
            aria-hidden="true"
            className="size-5 text-[var(--text-muted)] transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="overflow-x-auto border-t border-[var(--border)]">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <caption className="sr-only">{productConfig.name} plan feature comparison</caption>
            <thead>
              <tr className="bg-[var(--surface-muted)]">
                <th className="px-5 py-4 font-semibold" scope="col">Feature</th>
                {plans.map((plan) => (
                  <th className="px-5 py-4 font-semibold" key={plan.id} scope="col">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr className="border-t border-[var(--border)]" key={row.label}>
                  <th className="px-5 py-4 font-semibold" scope="row">{row.label}</th>
                  {plans.map((plan) => (
                    <td className="px-5 py-4 text-[var(--text-secondary)]" key={plan.id}>
                      <PlanValue value={row.values[plan.id]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="mt-8 flex flex-col gap-3 rounded-[18px] bg-[var(--success-soft)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-3 text-sm leading-6 text-[var(--primary-dark)]">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Billing is only enabled when a payment provider is configured. Demo mode never invents
          charges, invoices, or checkout success.
        </p>
        <Link className="shrink-0 text-sm font-bold text-[var(--primary)] hover:underline" href="/faq">
          Read plan FAQ
        </Link>
      </div>
    </>
  );
}
