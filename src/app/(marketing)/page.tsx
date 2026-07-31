import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileCheck2,
  FileDiff,
  Fingerprint,
  KeyRound,
  LayoutList,
  LockKeyhole,
  ScanText,
  ShieldCheck,
  Target,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";

import { FaqList } from "@/components/marketing/faq-list";
import { ProductReportPreview } from "@/components/marketing/product-report-preview";
import { ScoreRing } from "@/components/marketing/score-ring";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { caseStudies } from "@/content/case-studies";
import { features } from "@/content/features";
import { faqs, workflowSteps } from "@/content/site";
import { plans } from "@/config/plans";
import { productConfig } from "@/config/product";
import { scoringWeights } from "@/config/scoring";

export const metadata: Metadata = {
  title: "Resume analysis with evidence",
  description:
    "See how your resume parses, matches a role, communicates impact, and can be improved—with every finding connected to evidence.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "See why your resume gets filtered out",
    description:
      "Transparent resume analysis for parseability, role alignment, recruiter clarity, and practical improvements.",
    url: "/",
  },
};

const scoreDimensions = [
  { label: "Parseability", weight: scoringWeights.parseability, value: 87 },
  { label: "Job alignment", weight: scoringWeights.alignment, value: 73 },
  { label: "Experience", weight: scoringWeights.experience, value: 82 },
  { label: "Impact", weight: scoringWeights.impact, value: 62 },
  { label: "Formatting", weight: scoringWeights.formatting, value: 76 },
  { label: "Readability", weight: scoringWeights.readability, value: 81 },
];

export default function HomePage() {
  return (
    <main id="main-content">
      <section className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden bg-[var(--primary-dark)] text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 78% 15%, rgba(77,181,128,.32), transparent 28%), linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)",
            backgroundSize: "auto, 42px 42px, 42px 42px",
          }}
        />
        <div className="container-shell relative grid min-h-[calc(100svh-72px)] items-center gap-12 py-14 lg:grid-cols-[.83fr_1.17fr] lg:py-16">
          <div className="z-10 max-w-xl animate-rise">
            <Badge className="bg-white/10 text-[#bce9d1] ring-1 ring-white/15" tone="neutral">
              Resume analysis with evidence
            </Badge>
            <h1 className="mt-7 text-balance text-[clamp(3rem,6.5vw,6.5rem)] font-semibold leading-[.92] tracking-[-0.07em]">
              See why your resume gets filtered out.
            </h1>
            <p className="mt-7 max-w-lg text-pretty text-base leading-7 text-white/72 sm:text-lg">
              Inspect ATS parseability, role alignment, recruiter clarity, and the exact
              improvements behind every score.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-white text-[var(--primary-dark)] shadow-none hover:bg-[#ecf7f1]" size="lg">
                <Link href="/scan">
                  Scan my resume
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="border-white/25 bg-white/[0.06] text-white hover:border-white/50 hover:text-white"
                size="lg"
                variant="secondary"
              >
                <Link href="/app/scans/demo">View sample report</Link>
              </Button>
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-white/65">
              <LockKeyhole aria-hidden="true" className="size-3.5" />
              {productConfig.privacy.uploadAssurance}
            </p>
          </div>
          <div className="relative z-10 lg:-mr-28 xl:-mr-36">
            <div
              aria-hidden="true"
              className="absolute -inset-10 -z-10 rounded-full bg-[#5fc591]/10 blur-3xl"
            />
            <ProductReportPreview compact className="animate-rise [animation-delay:120ms]" />
          </div>
        </div>
      </section>

      <section aria-label="Product value" className="border-b border-[var(--border)] bg-white">
        <div className="container-shell grid divide-y divide-[var(--border)] md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            {
              icon: ScanText,
              title: "ATS parseability",
              copy: "See extracted text, section confidence, and supported layout risks.",
            },
            {
              icon: Target,
              title: "Job-description match",
              copy: "Connect weighted role requirements to exact, related, or missing evidence.",
            },
            {
              icon: FileCheck2,
              title: "Recruiter clarity",
              copy: "Find weak ownership, hidden scope, and bullets that need an outcome.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div className="flex gap-4 py-7 md:px-8 md:first:pl-0 md:last:pr-0" key={item.title}>
                <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[var(--success-soft)] text-[var(--primary)]">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold">{item.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{item.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <SectionHeading
          description="Open a finding and the source document responds. Change the analysis lens and the workspace keeps the same evidence in view."
          eyebrow="One connected report"
          title="The score is the starting point, not the answer."
        />
        <div className="mt-12">
          <ProductReportPreview />
        </div>
        <div className="mt-8 grid gap-px overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
          {[
            ["Why", "Every dimension includes the checks and evidence that shaped it."],
            ["Where", "Findings point to the relevant section, bullet, keyword, or layout signal."],
            ["What next", "Actions are ordered by severity, potential gain, and estimated effort."],
          ].map(([title, copy]) => (
            <div className="bg-white p-5 sm:p-6" key={title}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--primary)]">{title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--background-secondary)] py-20 sm:py-28">
        <div className="container-shell">
          <SectionHeading
            description="A resumable workflow that keeps the source, role context, findings, and revisions connected."
            eyebrow="How it works"
            title="Four steps from document to decision."
          />
          <ol className="mt-12 grid gap-10 border-t border-[var(--border-strong)] pt-10 lg:grid-cols-4">
            {workflowSteps.map((step) => (
              <li key={step.number}>
                <span className="font-mono text-xs font-bold text-[var(--primary)]">{step.number}</span>
                <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{step.description}</p>
              </li>
            ))}
          </ol>
          <Button asChild className="mt-10" variant="secondary">
            <Link href="/how-it-works">
              Explore the workflow <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <SectionHeading
          description="Six focused workspaces share the same document evidence, score model, and version history."
          eyebrow="Analysis toolkit"
          title="The right lens for each resume question."
        />
        <div className="mt-12 grid overflow-hidden rounded-[22px] border border-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                className="group min-h-[260px] border-b border-[var(--border)] p-6 transition-colors hover:bg-[var(--surface-muted)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] sm:border-r lg:min-h-[300px] lg:p-8 [&:nth-last-child(-n+2)]:sm:border-b-0 [&:nth-child(2n)]:sm:border-r-0 [&:nth-last-child(-n+3)]:lg:border-b-0 [&:nth-child(2n)]:lg:border-r [&:nth-child(3n)]:lg:border-r-0"
                href={`/features/${feature.slug}`}
                key={feature.slug}
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-[14px] bg-[var(--success-soft)] text-[var(--primary)]">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">0{index + 1}</span>
                </div>
                <h3 className="mt-9 text-xl font-semibold tracking-[-0.035em]">{feature.shortName}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{feature.description}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
                  Explore feature
                  <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden bg-[#10291f] py-20 text-white sm:py-28">
        <div className="container-shell grid items-center gap-14 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#73d3a2]">Keyword evidence</p>
            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Match meaning before repetition.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/65">
              Exact terms, related evidence, frequency, role importance, and natural placement
              stay visible as separate signals.
            </p>
            <Button
              asChild
              className="mt-8 border-white/20 bg-transparent text-white hover:border-white/45 hover:text-white"
              variant="secondary"
            >
              <Link href="/features/keyword-analysis">Explore keyword analysis</Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-[22px] border border-white/12 bg-white/[0.06]">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/10 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-white/65">
              <span>Role signal</span>
              <span>JD / resume</span>
              <span>Status</span>
            </div>
            {[
              ["Product roadmap", "4 / 2", "Strong", "success"],
              ["GTM strategy", "3 / 0", "Related", "warning"],
              ["Revenue KPIs", "2 / 0", "Missing", "danger"],
              ["Tableau", "2 / 0", "Verify", "info"],
              ["Agile / Scrum", "3 / 2", "Matched", "success"],
            ].map(([keyword, frequency, status, tone]) => (
              <div
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-white/10 px-5 py-4 last:border-0"
                key={keyword}
              >
                <span className="text-sm font-semibold">{keyword}</span>
                <span className="font-mono text-xs text-white/65">{frequency}</span>
                <Badge tone={tone as "success" | "warning" | "danger" | "info"}>{status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="relative">
            <div className="mx-auto aspect-[.72] max-w-[420px] bg-white px-9 py-10 font-serif shadow-[0_20px_80px_rgba(23,35,29,.15)]">
              <p className="text-center text-base font-semibold tracking-[0.08em]">ALEX MORGAN</p>
              <p className="mt-1 text-center text-[9px] text-[var(--text-muted)]">
                alex.morgan@example.test · Chicago, IL
              </p>
              <p className="mt-7 border-b border-[#aab5af] pb-1 text-[10px] font-bold tracking-[0.1em]">
                EXPERIENCE
              </p>
              <p className="mt-4 text-[10px] font-bold">Senior Product Manager</p>
              <p className="mt-2 text-[9px] leading-5">
                • Owned the platform roadmap and aligned quarterly priorities with cross-functional
                stakeholders.
              </p>
              <p className="mt-2 rounded bg-[var(--warning-soft)] px-1 text-[9px] leading-5 ring-1 ring-[var(--warning)]">
                • Worked on onboarding improvements with design and engineering.
              </p>
              <p className="mt-7 border-b border-[#aab5af] pb-1 text-[10px] font-bold tracking-[0.1em]">
                SKILLS
              </p>
              <div className="mt-3 grid grid-cols-2 gap-px rounded bg-[var(--danger-soft)] p-2 text-[8px] leading-5 ring-1 ring-[var(--danger)]">
                <span>Roadmapping</span><span>Agile · OKRs</span>
                <span>Figma · Jira</span><span>Mixpanel · API</span>
              </div>
            </div>
            <div className="absolute -right-2 top-20 max-w-[220px] rounded-[14px] border border-[var(--danger)] bg-white p-3 shadow-lg sm:right-4">
              <p className="flex gap-2 text-xs font-bold text-[var(--danger)]">
                <TriangleAlert aria-hidden="true" className="size-4 shrink-0" /> Reading-order risk
              </p>
              <p className="mt-1 text-[10px] leading-4 text-[var(--text-secondary)]">
                A table is used for essential skills.
              </p>
            </div>
          </div>
          <div>
            <SectionHeading
              description="The preview shows what was detected and where. The explanation separates likely extraction blockers from smaller recommendations."
              eyebrow="Format without flattening"
              title="Keep the design. Repair the information path."
            />
            <ul className="mt-8 space-y-4">
              {[
                "Review an approximate plain-text parse beside the source.",
                "See confidence for contact fields and major sections.",
                "Fix the highest-information-loss issue first.",
              ].map((item) => (
                <li className="flex gap-3 text-sm leading-6" key={item}>
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--primary)]" />
                  {item}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8" variant="secondary">
              <Link href="/features/ats-parser">Explore format analysis</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-[var(--background-secondary)] py-20 sm:py-28">
        <div className="container-shell">
          <SectionHeading
            align="center"
            description="The suggestion explains what changed and keeps unknown metrics visibly incomplete until you verify them."
            eyebrow="Before and after"
            title="Stronger wording, same underlying facts."
          />
          <div className="mx-auto mt-12 grid max-w-5xl overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--border)] lg:grid-cols-2">
            <div className="bg-white p-7 sm:p-9">
              <Badge>Before</Badge>
              <p className="mt-8 font-serif text-xl leading-8 text-[var(--text-secondary)]">
                “Worked on onboarding improvements with design and engineering.”
              </p>
              <p className="mt-8 text-xs leading-5 text-[var(--text-muted)]">
                The action and outcome are implicit.
              </p>
            </div>
            <div className="bg-[var(--success-soft)] p-7 sm:p-9">
              <Badge tone="success">Verified draft</Badge>
              <p className="mt-8 font-serif text-xl leading-8 text-[var(--primary-dark)]">
                “Led onboarding experiments with design and engineering, improving activation by [X%].”
              </p>
                <p className="mt-8 text-xs leading-5 text-[var(--primary-dark)]">
                Replace [X%] only with a metric you can verify—or describe the observable outcome
                without a number.
              </p>
            </div>
          </div>
          <div className="mx-auto mt-5 flex max-w-5xl flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[var(--border)] bg-white p-4">
            <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <FileDiff aria-hidden="true" className="size-4 text-[var(--primary)]" />
              Applying a suggestion creates a new resume version.
            </p>
            <Link className="text-sm font-bold text-[var(--primary)] hover:underline" href="/features/ai-rewrite">
              See rewrite controls
            </Link>
          </div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <div className="grid gap-14 lg:grid-cols-[.76fr_1.24fr] lg:items-center">
          <div>
            <SectionHeading
              description="Every score retains the weight snapshot, analyzer version, confidence, and findings that produced it."
              eyebrow="Score transparency"
              title="A model you can inspect."
            />
            <div className="mt-8 flex items-center gap-6">
              <ScoreRing label="Sample overall score" score={73} />
              <div>
                <p className="font-semibold">73 / 100</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  Sample heuristic score for the fictional Alex Morgan report.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {scoreDimensions.map((dimension) => (
              <div className="grid grid-cols-[110px_1fr_50px] items-center gap-4" key={dimension.label}>
                <span className="text-xs font-semibold">{dimension.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-strong)]">
                  <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${dimension.value}%` }} />
                </div>
                <span className="text-right font-mono text-xs text-[var(--text-secondary)]">
                  {Math.round(dimension.weight * 100)}%
                </span>
              </div>
            ))}
            <p className="pt-3 text-xs leading-5 text-[var(--text-muted)]">
              Bars show the sample dimension score. Labels on the right show the configured
              weight. Without a job description, alignment is unavailable and other weights are
              proportionally normalized.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#e6f3eb] py-20 sm:py-24">
        <div className="container-shell grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow">Privacy by design</p>
            <h2 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              A resume is personal data, not demo content.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
              Live mode uses private storage, short-lived signed downloads, row-level access, and
              deletion controls. Demo analysis stays in the browser.
            </p>
            <Button asChild className="mt-8" variant="secondary">
              <Link href="/privacy">Read the privacy policy</Link>
            </Button>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
            {[
              [LockKeyhole, "Private by default", "Files are not public assets."],
              [KeyRound, "Short-lived access", "Signed live downloads expire quickly."],
              [Fingerprint, "Scoped authorization", "Access is checked against user and team permissions."],
              [ShieldCheck, "You control retention", "Export and deletion controls remain available."],
            ].map(([Icon, title, copy]) => {
              const PrivacyIcon = Icon as typeof LockKeyhole;
              return (
                <div className="bg-white/70 p-6" key={title as string}>
                  <PrivacyIcon aria-hidden="true" className="size-5 text-[var(--primary)]" />
                  <h3 className="mt-5 text-sm font-bold">{title as string}</h3>
                  <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{copy as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            description="Invented candidates and outcomes, clearly labeled until verified customer data is available."
            eyebrow="Demonstration case studies"
            title="Three ways clearer evidence changes a report."
          />
          <Link className="shrink-0 text-sm font-bold text-[var(--primary)] hover:underline" href="/case-studies">
            View all demonstrations
          </Link>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--border)] lg:grid-cols-3">
          {caseStudies.map((study) => (
            <article className="flex flex-col bg-white p-7" key={study.slug}>
              <Badge tone="violet">Fictional demonstration</Badge>
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                {study.role} · {study.industry}
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-[-0.035em]">{study.title}</h3>
              <div className="mt-8 flex items-end gap-3">
                <span className="text-3xl font-semibold tracking-[-0.05em]">{study.initialScore}</span>
                <span className="pb-1 text-[var(--text-muted)]">→</span>
                <span className="text-3xl font-semibold tracking-[-0.05em] text-[var(--primary)]">
                  {study.improvedScore}
                </span>
              </div>
              <Link
                className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-bold text-[var(--primary)] hover:underline"
                href={`/case-studies/${study.slug}`}
              >
                Read demonstration <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[var(--background-secondary)] py-20 sm:py-28">
        <div className="container-shell">
          <SectionHeading
            align="center"
            description="Start with the highest-impact issues, or add role matching, rewrites, comparisons, and team review when you need them."
            eyebrow="Straightforward plans"
            title="Choose the depth that fits your search."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
            {plans.slice(0, 3).map((plan) => (
              <article className="flex flex-col bg-white p-7" key={plan.id}>
                <div className="min-h-6">
                  {plan.recommended ? <Badge tone="success">Recommended</Badge> : null}
                </div>
                <h3 className="mt-4 text-xl font-semibold">{plan.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{plan.description}</p>
                <p className="mt-7 text-4xl font-semibold tracking-[-0.05em]">
                  ${plan.monthlyPrice}<span className="text-sm font-normal text-[var(--text-muted)]"> / month</span>
                </p>
                <ul className="mt-7 space-y-3">
                  {plan.features.slice(0, 3).map((feature) => (
                    <li className="flex gap-2 text-sm" key={feature}>
                      <Check aria-hidden="true" className="size-4 shrink-0 text-[var(--primary)]" /> {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild>
              <Link href="/pricing">Compare all four plans</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-shell py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
          <SectionHeading
            description="Clear answers about the analysis, scoring model, privacy, and plans."
            eyebrow="Questions, answered"
            title="Know what the product can—and cannot—tell you."
          />
          <FaqList items={faqs.slice(0, 6)} />
        </div>
        <div className="mt-7 text-right">
          <Link className="text-sm font-bold text-[var(--primary)] hover:underline" href="/faq">
            Read every question
          </Link>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-white py-20 sm:py-28">
        <div className="container-shell text-center">
          <LayoutList aria-hidden="true" className="mx-auto size-8 text-[var(--primary)]" />
          <h2 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
            Start with the finding that matters most.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
            Run a transparent demo analysis now. No unsupported ATS or hiring promises.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/scan">
                Scan my resume <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/features">Explore every feature</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
