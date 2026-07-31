import type { Metadata } from "next";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileInput,
  FileSearch,
  ListChecks,
  LockKeyhole,
  RefreshCw,
  ScanText,
  ShieldQuestion,
} from "lucide-react";
import Link from "next/link";

import { ProductReportPreview } from "@/components/marketing/product-report-preview";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import { workflowSteps } from "@/content/site";

export const metadata: Metadata = {
  title: "How it works",
  description:
    `Follow ${productConfig.name} from secure resume input through extraction, deterministic checks, optional semantic analysis, evidence review, and version comparison.`,
  alternates: { canonical: "/how-it-works" },
  openGraph: {
    title: `How ${productConfig.name} analyzes a resume`,
    description: "A transparent workflow from source document to evidence-led improvements.",
    url: "/how-it-works",
  },
};

const stages = [
  { icon: FileInput, title: "Extracting resume text", method: "Deterministic" },
  { icon: ScanText, title: "Identifying sections", method: "Deterministic" },
  { icon: FileSearch, title: "Checking ATS structure", method: "Deterministic" },
  { icon: ListChecks, title: "Mapping job requirements", method: "Mixed" },
  { icon: ShieldQuestion, title: "Evaluating skills and keywords", method: "Mixed" },
  { icon: RefreshCw, title: "Assessing achievements and impact", method: "Mixed" },
] as const;

export default function HowItWorksPage() {
  return (
    <main id="main-content">
      <section className="border-b border-[var(--border)] bg-white py-20 sm:py-28">
        <div className="container-shell grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <Badge tone="success">Transparent by design</Badge>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-[.98] tracking-[-0.065em] sm:text-7xl">
              From resume file to evidence map.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
              {productConfig.name} separates extraction, deterministic checks, optional semantic analysis,
              scoring, and recommendations so you can see what happened at each stage.
            </p>
            <Button asChild className="mt-8" size="lg">
              <Link href="/scan">Start a scan <ArrowRight aria-hidden="true" className="size-4" /></Link>
            </Button>
          </div>
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--background-secondary)] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--primary)]">
              Analysis pipeline
            </p>
            <ol className="mt-6 space-y-1">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                return (
                  <li className="flex items-center gap-4 rounded-[14px] bg-white p-3.5" key={stage.title}>
                    <span className="grid size-9 place-items-center rounded-[11px] bg-[var(--success-soft)] text-[var(--primary)]">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold">{stage.title}</span>
                    <span className="hidden text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)] sm:block">
                      {stage.method}
                    </span>
                    <CheckCircle2 aria-label={`Stage ${index + 1}`} className="size-4 text-[var(--success)]" />
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">
              Progress reflects actual completed pipeline stages rather than an intentionally slow timer.
            </p>
          </div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <SectionHeading
          description="Your draft is resumable, optional context stays optional, and the analysis keeps its method visible."
          eyebrow="The complete workflow"
          title="Four steps, with no hidden handoff."
        />
        <ol className="mt-12 space-y-0">
          {workflowSteps.map((step, index) => (
            <li
              className="grid gap-5 border-t border-[var(--border)] py-9 md:grid-cols-[110px_1fr_1fr] md:items-start"
              key={step.number}
            >
              <span className="font-mono text-3xl font-semibold tracking-[-0.05em] text-[var(--primary)]">
                {step.number}
              </span>
              <h2 className="text-2xl font-semibold tracking-[-0.035em]">{step.title}</h2>
              <div>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">{step.description}</p>
                <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
                  {[
                    "PDF, DOCX, and TXT up to 8 MiB. Paste mode and a fictional sample are also available.",
                    "Supported checks distinguish deterministic, AI-inferred, and low-confidence findings.",
                    "Selecting a finding and selecting resume evidence use the same annotation link.",
                    "Applied suggestions create a version; earlier content stays available for comparison or restore.",
                  ][index]}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-[var(--background-secondary)] py-20 sm:py-28">
        <div className="container-shell">
          <div className="grid gap-12 lg:grid-cols-[.65fr_1.35fr] lg:items-end">
            <SectionHeading
              description="The report connects a prioritized explanation to the exact document evidence and preserves the analysis context."
              eyebrow="The output"
              title="A report you can interrogate."
            />
            <div className="grid gap-px overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
              {[
                ["Method", "Analyzer and schema versions stay attached."],
                ["Confidence", "Low-certainty findings remain visible as uncertain."],
                ["Evidence", "Annotations and source offsets connect both directions."],
              ].map(([title, copy]) => (
                <div className="bg-white p-5" key={title}>
                  <p className="text-xs font-bold text-[var(--primary)]">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12">
            <ProductReportPreview />
          </div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <SectionHeading
          align="center"
          description="The interface remains truthful when external services are absent."
          eyebrow="Two operating modes"
          title="Useful in demo mode. Connected in live mode."
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-px overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--border)] lg:grid-cols-2">
          <article className="bg-white p-7 sm:p-9">
            <Bot aria-hidden="true" className="size-7 text-[var(--violet)]" />
            <h2 className="mt-6 text-2xl font-semibold tracking-[-0.035em]">Demo mode</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              Deterministic Alex Morgan results, browser persistence, an Explore demo session,
              and visible “Demo analysis” labels. No real payment or external AI is simulated.
            </p>
            <Button asChild className="mt-7" variant="secondary">
              <Link href="/app/scans/demo">Explore sample report</Link>
            </Button>
          </article>
          <article className="bg-white p-7 sm:p-9">
            <LockKeyhole aria-hidden="true" className="size-7 text-[var(--primary)]" />
            <h2 className="mt-6 text-2xl font-semibold tracking-[-0.035em]">Live mode</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              Supabase-backed authentication, private storage, saved scans, signed report links,
              and optional server-only semantic analysis and billing adapters.
            </p>
            <Button asChild className="mt-7" variant="secondary">
              <Link href="/privacy">Review data handling</Link>
            </Button>
          </article>
        </div>
      </section>

      <section className="bg-[var(--primary-dark)] py-20 text-center text-white sm:py-24">
        <div className="container-shell">
          <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            See the workflow on your own document.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/65">
            Start in demo mode and keep every recommendation subject to your factual review.
          </p>
          <Button asChild className="mt-8 bg-white text-[var(--primary-dark)] shadow-none hover:bg-white/90" size="lg">
            <Link href="/scan">Scan my resume</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
