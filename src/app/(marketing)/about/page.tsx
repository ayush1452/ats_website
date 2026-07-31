import type { Metadata } from "next";
import {
  ArrowRight,
  Eye,
  FileQuestion,
  Gauge,
  Scale,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";

export const metadata: Metadata = {
  title: "About",
  description:
    `Learn why ${productConfig.name} is built around transparent resume evidence, honest product boundaries, and user-controlled revisions.`,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About ${productConfig.name}`,
    description: "Resume analysis should explain itself.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <main id="main-content">
      <section className="overflow-hidden bg-[var(--primary-dark)] py-20 text-white sm:py-28">
        <div className="container-shell">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#73d3a2]">About {productConfig.name}</p>
          <h1 className="mt-6 max-w-5xl text-balance text-5xl font-semibold leading-[.98] tracking-[-0.065em] sm:text-7xl">
            Resume analysis should explain itself.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
            {productConfig.name} is designed around a simple standard: if the product assigns a score or
            recommends a change, the user should be able to inspect the method, evidence, location,
            and practical tradeoff.
          </p>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[.75fr_1.25fr]">
          <SectionHeading
            description="Job seekers deserve useful structure without exaggerated certainty."
            eyebrow="Why we are building it"
            title="A calmer way to improve a high-stakes document."
          />
          <div className="space-y-6 text-base leading-8 text-[var(--text-secondary)]">
            <p>
              Resume advice often collapses into two extremes: vague encouragement or an opaque
              score presented as fact. Neither helps someone decide which edit is worth making.
            </p>
            <p>
              {productConfig.name} turns the document into an evidence map. Supported parsing signals,
              role requirements, keywords, impact, and formatting findings stay connected to the
              source text. Scores remain configurable heuristics, not hiring forecasts.
            </p>
            <p>
              The product serves individual job seekers as well as coaches, universities, and
              recruiting-support teams that need shared review with clear permissions.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--background-secondary)] py-20 sm:py-28">
        <div className="container-shell">
          <SectionHeading
            description="These principles shape the interface, analysis contracts, content, and operating modes."
            eyebrow="Product principles"
            title="Useful boundaries are part of the feature."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--border)] md:grid-cols-2 lg:grid-cols-3">
            {[
              [Eye, "Evidence before authority", "Show what produced a result and where it came from."],
              [Scale, "Heuristic, not verdict", "Never present a score as a guarantee of ATS acceptance or employment."],
              [ShieldCheck, "Privacy as product work", "Make storage, sharing, retention, export, and deletion understandable."],
              [FileQuestion, "Uncertainty stays visible", "Mark low-confidence and unsupported findings instead of forcing certainty."],
              [Gauge, "Deterministic where suitable", "Use explicit checks for measurable signals and AI only where semantics help."],
              [UsersRound, "The user decides", "No suggestion changes a resume without review and confirmation."],
            ].map(([Icon, title, copy]) => {
              const PrincipleIcon = Icon as typeof Eye;
              return (
                <article className="bg-white p-7" key={title as string}>
                  <PrincipleIcon aria-hidden="true" className="size-6 text-[var(--primary)]" />
                  <h2 className="mt-6 text-lg font-semibold tracking-[-0.025em]">{title as string}</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{copy as string}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="rounded-[22px] border border-[var(--border)] bg-white p-7 sm:p-9">
            <p className="eyebrow">What we measure</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">Supported signals in the document.</h2>
            <p className="mt-5 text-sm leading-7 text-[var(--text-secondary)]">
              Extraction, section structure, contact fields, dates, bullets, quantities,
              readability, keyword frequency, role evidence, and supported layout signals.
            </p>
          </div>
          <div className="rounded-[22px] border border-[var(--border)] bg-white p-7 sm:p-9">
            <p className="eyebrow">What we do not promise</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">A universal ATS or hiring outcome.</h2>
            <p className="mt-5 text-sm leading-7 text-[var(--text-secondary)]">
              {productConfig.name} does not claim access to every employer system, a proprietary dataset
              of millions of resumes, or a guarantee of interviews, compensation, or employment.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-white py-20 text-center sm:py-24">
        <div className="container-shell">
          <h2 className="text-4xl font-semibold tracking-[-0.05em]">Inspect the method in the product.</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg"><Link href="/scan">Start a scan <ArrowRight aria-hidden="true" className="size-4" /></Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/how-it-works">How it works</Link></Button>
          </div>
        </div>
      </section>
    </main>
  );
}
