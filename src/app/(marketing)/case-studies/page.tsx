import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { CaseStudyFilter } from "@/components/marketing/case-study-filter";
import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";

export const metadata: Metadata = {
  title: "Case studies",
  description:
    `Explore three clearly fictional ${productConfig.name} demonstrations for product, engineering, and marketing resumes.`,
  alternates: { canonical: "/case-studies" },
  openGraph: {
    title: "Resume improvement demonstrations",
    description: "Fictional, labeled examples showing how clearer evidence changes a report.",
    url: "/case-studies",
  },
};

export default function CaseStudiesPage() {
  return (
    <main id="main-content">
      <section className="border-b border-[var(--border)] bg-white py-20 sm:py-28">
        <div className="container-shell">
          <p className="eyebrow">Fictional demonstrations</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold leading-[.98] tracking-[-0.065em] sm:text-7xl">
            See how evidence changes the report.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
            These candidates, employers, metrics, and score changes are invented product
            demonstrations—not testimonials or verified hiring outcomes.
          </p>
        </div>
      </section>
      <section className="container-shell py-16 sm:py-24">
        <CaseStudyFilter />
      </section>
      <section className="bg-[var(--background-secondary)] py-20 text-center sm:py-24">
        <div className="container-shell">
          <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-[-0.05em]">
            Build an evidence map for your own resume.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
            Your results remain a transparent product heuristic, not a promise of an interview.
          </p>
          <Button asChild className="mt-8" size="lg">
            <Link href="/scan">Start a scan <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
