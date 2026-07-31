import type { Metadata } from "next";
import { ArrowRight, Gauge, LockKeyhole, RefreshCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { FaqList } from "@/components/marketing/faq-list";
import { PricingExplorer } from "@/components/marketing/pricing-explorer";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import { faqs } from "@/content/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    `Compare ${productConfig.name} Free, Pro, Career Plus, and Teams & Coaches plans, limits, and capabilities.`,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: `${productConfig.name} plans and pricing`,
    description: "Clear monthly and annual pricing with editable limits and no invented urgency.",
    url: "/pricing",
  },
};

export default function PricingPage() {
  return (
    <main id="main-content">
      <section className="border-b border-[var(--border)] bg-white py-20 sm:py-28">
        <div className="container-shell text-center">
          <p className="eyebrow">Plans that scale with the work</p>
          <h1 className="mx-auto mt-5 max-w-5xl text-balance text-5xl font-semibold leading-[.98] tracking-[-0.065em] sm:text-7xl">
            Start with the finding. Add depth when you need it.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
            Transparent limits, annual totals shown upfront, and no fabricated countdowns or
            checkout states.
          </p>
          <PricingExplorer />
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <SectionHeading
          align="center"
          description="Limits protect predictable analysis capacity while keeping saved reports and comparisons useful."
          eyebrow="How usage works"
          title="A scan is one completed analysis."
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-px overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
          {[
            [Gauge, "Counts as usage", "Completing an analysis of one resume version uses one scan."],
            [RefreshCcw, "Does not count", "Opening, exporting, sharing, or comparing an existing report does not use a scan."],
            [ShieldCheck, "Atomic reservation", "Live mode reserves quota once and releases it safely if processing fails."],
          ].map(([Icon, title, copy]) => {
            const UsageIcon = Icon as typeof Gauge;
            return (
              <div className="bg-white p-7" key={title as string}>
                <UsageIcon aria-hidden="true" className="size-6 text-[var(--primary)]" />
                <h2 className="mt-6 font-semibold">{title as string}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-[var(--background-secondary)] py-20 sm:py-28">
        <div className="container-shell grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
          <SectionHeading
            description="Plan changes, payment configuration, usage, and team access in plain language."
            eyebrow="Pricing FAQ"
            title="Before you choose."
          />
          <FaqList items={faqs.filter((faq) => faq.category === "Plans")} />
        </div>
      </section>

      <section className="container-shell py-20 sm:py-24">
        <div className="grid gap-8 rounded-[24px] bg-[var(--primary-dark)] p-8 text-white sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <LockKeyhole aria-hidden="true" className="size-6 text-[#73d3a2]" />
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
              Need a shared coaching or career-team workspace?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">
              Talk through seats, permissions, candidate privacy, and billing configuration with a person.
            </p>
          </div>
          <Button asChild className="bg-white text-[var(--primary-dark)] shadow-none hover:bg-white/90" size="lg">
            <Link href="/contact?topic=teams">Contact us <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
