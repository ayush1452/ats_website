import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { FaqList } from "@/components/marketing/faq-list";
import { FeatureInstrument } from "@/components/marketing/feature-instrument";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import type { Feature } from "@/content/features";

export function FeaturePage({ feature }: { feature: Feature }) {
  const Icon = feature.icon;

  return (
    <main id="main-content">
      <section className="overflow-hidden border-b border-[var(--border)] bg-white">
        <div className="container-shell grid min-h-[680px] items-center gap-14 py-16 lg:grid-cols-[.78fr_1.22fr] lg:py-20">
          <div>
            <span className="grid size-12 place-items-center rounded-[15px] bg-[var(--success-soft)] text-[var(--primary)]">
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <p className="eyebrow mt-7">{feature.eyebrow}</p>
            <h1 className="mt-4 text-balance text-5xl font-semibold leading-[.98] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
              {feature.headline}
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
              {feature.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/scan">
                  Scan my resume <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/app/scans/demo">Open sample report</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">
              Demo analysis uses deterministic sample data and is labeled throughout.
            </p>
          </div>
          <div className="lg:-mr-20 xl:-mr-28">
            <FeatureInstrument slug={feature.slug} />
          </div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="eyebrow">The problem</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              A score without context cannot tell you what to trust.
            </h2>
            <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]">{feature.problem}</p>
          </div>
          <div className="border-l-2 border-[var(--primary)] pl-6 sm:pl-8">
            <p className="eyebrow">What you receive</p>
            <p className="mt-4 text-balance text-2xl font-semibold leading-9 tracking-[-0.03em]">
              {feature.outcome}
            </p>
            <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-[var(--text-secondary)]">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--primary)]" />
              {productConfig.name} uses supported checks and transparent heuristics. It does not promise
              compatibility with every ATS or a hiring outcome.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--background-secondary)] py-20 sm:py-28">
        <div className="container-shell">
          <SectionHeading
            description="The analysis keeps its method, confidence, evidence, and practical next step visible."
            eyebrow="How it works"
            title={`A clear path through ${feature.shortName.toLowerCase()}.`}
          />
          <ol className="mt-12 grid gap-px overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--border)] lg:grid-cols-3">
            {feature.steps.map((step, index) => (
              <li className="bg-white p-7 sm:p-8" key={step.title}>
                <span className="font-mono text-xs font-bold text-[var(--primary)]">0{index + 1}</span>
                <h3 className="mt-7 text-xl font-semibold tracking-[-0.03em]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <SectionHeading
          description="Focused enough to act on, detailed enough to verify."
          eyebrow="Capabilities"
          title="Each signal has a practical job."
        />
        <div className="mt-12 grid border-y border-[var(--border)] md:grid-cols-2">
          {feature.capabilities.map((capability, index) => (
            <div
              className="border-b border-[var(--border)] py-8 md:px-8 md:[&:nth-child(odd)]:border-r md:[&:nth-last-child(-n+2)]:border-b-0 md:[&:nth-child(odd)]:pl-0"
              key={capability.title}
            >
              <div className="flex items-start gap-4">
                <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--primary)]">
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.025em]">{capability.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                    {capability.description}
                  </p>
                  <span className="mt-3 block font-mono text-[10px] text-[var(--text-muted)]">
                    SIGNAL {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden bg-[#10291f] py-20 text-white sm:py-28">
        <div className="container-shell grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#73d3a2]">
              Practical example
            </p>
            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              {feature.example.label}
            </h2>
            <p className="mt-5 text-sm leading-7 text-white/62">{feature.example.note}</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[20px] border border-white/12 bg-white/12 sm:grid-cols-2">
            <div className="bg-[#18372b] p-6 sm:p-8">
              <Badge className="bg-white/10 text-white/65" tone="neutral">Before</Badge>
              <p className="mt-7 whitespace-pre-line font-serif text-lg leading-8 text-white/72">
                {feature.example.before}
              </p>
            </div>
            <div className="bg-[#e7f6ee] p-6 text-[var(--primary-dark)] sm:p-8">
              <Badge tone="success">Revised example</Badge>
              <p className="mt-7 whitespace-pre-line font-serif text-lg leading-8">
                {feature.example.after}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[.65fr_1.35fr]">
          <SectionHeading
            description={`What to know before using ${feature.shortName.toLowerCase()}.`}
            eyebrow="Feature FAQ"
            title="The useful boundaries."
          />
          <FaqList items={feature.faq} />
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-white py-20 sm:py-24">
        <div className="container-shell flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">{feature.shortName}</p>
            <h2 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              See the finding, the evidence, and the next step together.
            </h2>
          </div>
          <Button asChild className="shrink-0" size="lg">
            <Link href="/scan">
              Start a scan <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
