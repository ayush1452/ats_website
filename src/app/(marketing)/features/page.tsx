import type { Metadata } from "next";
import { ArrowRight, Check, Layers3 } from "lucide-react";
import Link from "next/link";

import { ProductReportPreview } from "@/components/marketing/product-report-preview";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import { features } from "@/content/features";

export const metadata: Metadata = {
  title: "Features",
  description:
    `Explore ${productConfig.name}’s parsing, job-match, keyword, impact, rewrite, and version-comparison workspaces.`,
  alternates: { canonical: "/features" },
  openGraph: {
    title: "Resume analysis features with connected evidence",
    description:
      "Six focused workspaces for parseability, role alignment, impact, and resume improvement.",
    url: "/features",
  },
};

export default function FeaturesPage() {
  return (
    <main id="main-content">
      <section className="border-b border-[var(--border)] bg-white py-20 sm:py-28">
        <div className="container-shell text-center">
          <Badge tone="success">Six connected workspaces</Badge>
          <h1 className="mx-auto mt-6 max-w-5xl text-balance text-5xl font-semibold leading-[.98] tracking-[-0.065em] sm:text-7xl">
            Every finding should lead back to evidence.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
            Inspect the document from six practical angles without losing the resume text,
            role requirement, or version that produced the result.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/scan">Scan my resume <ArrowRight aria-hidden="true" className="size-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/app/scans/demo">View sample report</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <ProductReportPreview />
      </section>

      <section className="bg-[var(--background-secondary)] py-20 sm:py-28">
        <div className="container-shell">
          <SectionHeading
            description="Use one workspace for a focused question or move across the same evidence without rebuilding context."
            eyebrow="The toolkit"
            title="Six lenses. One source of truth."
          />
          <div className="mt-12 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article
                  className="grid gap-7 py-9 lg:grid-cols-[80px_1fr_1fr_auto] lg:items-center"
                  key={feature.slug}
                >
                  <span className="grid size-12 place-items-center rounded-[15px] bg-white text-[var(--primary)] shadow-[var(--shadow-sm)]">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="font-mono text-[10px] text-[var(--text-muted)]">0{index + 1}</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">{feature.shortName}</h2>
                  </div>
                  <p className="text-sm leading-7 text-[var(--text-secondary)]">{feature.description}</p>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/features/${feature.slug}`}>Explore <ArrowRight aria-hidden="true" className="size-3.5" /></Link>
                  </Button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
          <div>
            <Layers3 aria-hidden="true" className="size-8 text-[var(--primary)]" />
            <h2 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Shared evidence makes the report coherent.
            </h2>
            <p className="mt-5 text-base leading-7 text-[var(--text-secondary)]">
              One finding and annotation model connects the analytics workspace to the document
              preview in both directions.
            </p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
            {[
              "A selected finding opens the relevant resume text.",
              "A selected annotation opens the associated explanation.",
              "Report tabs remain addressable in the URL.",
              "Applied suggestions create a new immutable version.",
            ].map((item) => (
              <li className="flex gap-3 bg-white p-6 text-sm leading-6" key={item}>
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[var(--primary-dark)] py-20 text-white sm:py-24">
        <div className="container-shell text-center">
          <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Begin with a document, not a dashboard.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/65">
            Run the deterministic demo analysis and inspect how the product explains each result.
          </p>
          <Button asChild className="mt-8 bg-white text-[var(--primary-dark)] shadow-none hover:bg-white/90" size="lg">
            <Link href="/scan">Start a scan</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
