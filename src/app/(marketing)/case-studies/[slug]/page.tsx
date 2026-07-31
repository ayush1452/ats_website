import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import {
  caseStudies,
  caseStudyBySlug,
  type CaseStudySlug,
} from "@/content/case-studies";

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = caseStudyBySlug[slug as CaseStudySlug];
  if (!study) return {};
  return {
    title: study.title,
    description: `Fictional ${productConfig.name} demonstration: ${study.summary}`,
    alternates: { canonical: `/case-studies/${study.slug}` },
    openGraph: {
      title: study.title,
      description: `Fictional demonstration for a ${study.role.toLowerCase()} resume.`,
      url: `/case-studies/${study.slug}`,
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = caseStudyBySlug[slug as CaseStudySlug];
  if (!study) notFound();

  return (
    <main id="main-content">
      <article>
        <header className="border-b border-[var(--border)] bg-white py-16 sm:py-24">
          <div className="container-shell">
            <Link className="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] hover:underline" href="/case-studies">
              <ArrowLeft aria-hidden="true" className="size-4" /> All demonstrations
            </Link>
            <div className="mt-9 flex flex-wrap gap-2">
              <Badge tone="violet">Fictional demonstration</Badge>
              <Badge>{study.role}</Badge>
              <Badge>{study.industry}</Badge>
              <Badge>{study.seniority}</Badge>
            </div>
            <h1 className="mt-6 max-w-5xl text-balance text-5xl font-semibold leading-[1] tracking-[-0.06em] sm:text-7xl">
              {study.title}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
              {study.summary}
            </p>
            <div className="mt-10 flex items-end gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">Initial</p>
                <p className="mt-1 text-5xl font-semibold tracking-[-0.06em]">{study.initialScore}</p>
              </div>
              <span className="pb-3 text-xl text-[var(--text-muted)]">→</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--primary)]">Revised</p>
                <p className="mt-1 text-5xl font-semibold tracking-[-0.06em] text-[var(--primary)]">{study.improvedScore}</p>
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-xs leading-5 text-[var(--text-muted)]">
              Scores are demonstration heuristics. They do not represent a real customer or a hiring outcome.
            </p>
          </div>
        </header>

        <section className="container-shell grid gap-12 py-20 sm:py-28 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="eyebrow">Candidate context</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">What the sample starts with.</h2>
          </div>
          <div>
            <p className="text-lg leading-8 text-[var(--text-secondary)]">{study.candidateContext}</p>
            <div className="mt-9 grid gap-8 sm:grid-cols-2">
              <div>
                <h3 className="font-semibold">Main problems</h3>
                <ul className="mt-4 space-y-3">
                  {study.problems.map((problem) => (
                    <li className="flex gap-3 text-sm leading-6" key={problem}>
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--danger)]" />
                      {problem}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Changes made</h3>
                <ul className="mt-4 space-y-3">
                  {study.changes.map((change) => (
                    <li className="flex gap-3 text-sm leading-6" key={change}>
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--background-secondary)] py-20 sm:py-28">
          <div className="container-shell">
            <p className="eyebrow">Dimension score change</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">What moved, and by how much.</h2>
            <div className="mt-10 space-y-6" role="img" aria-label={`Dimension scores before and after for ${study.role} demonstration`}>
              {study.dimensions.map((dimension) => (
                <div className="grid gap-2 sm:grid-cols-[120px_1fr_55px]" key={dimension.label}>
                  <span className="text-sm font-semibold">{dimension.label}</span>
                  <div className="space-y-1.5">
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-[var(--text-muted)]" style={{ width: `${dimension.before}%` }} />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${dimension.after}%` }} />
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[var(--primary)]">+{dimension.after - dimension.before}</span>
                  <span className="sr-only">
                    {dimension.label}: {dimension.before} before and {dimension.after} after.
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-5 text-xs text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[var(--text-muted)]" /> Initial</span>
              <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-[var(--primary)]" /> Revised</span>
            </div>
          </div>
        </section>

        <section className="container-shell py-20 sm:py-28">
          <p className="eyebrow">Before and after</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">How the sample evidence changed.</h2>
          <div className="mt-10 space-y-6">
            {study.beforeAfter.map((example) => (
              <div className="overflow-hidden rounded-[20px] border border-[var(--border)]" key={example.label}>
                <div className="border-b border-[var(--border)] bg-white px-5 py-4 text-sm font-bold">{example.label}</div>
                <div className="grid gap-px bg-[var(--border)] md:grid-cols-2">
                  <div className="bg-white p-6">
                    <Badge>Before</Badge>
                    <p className="mt-5 font-serif text-lg leading-8 text-[var(--text-secondary)]">“{example.before}”</p>
                  </div>
                  <div className="bg-[var(--success-soft)] p-6">
                    <Badge tone="success">Revised demonstration</Badge>
                    <p className="mt-5 font-serif text-lg leading-8 text-[var(--primary-dark)]">“{example.after}”</p>
                  </div>
                </div>
                <p className="bg-white px-5 py-4 text-xs leading-5 text-[var(--text-muted)]">{example.verification}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#10291f] py-20 text-white sm:py-24">
          <div className="container-shell grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#73d3a2]">Lessons</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">What this demonstration shows.</h2>
            </div>
            <ol className="space-y-5">
              {study.lessons.map((lesson, index) => (
                <li className="flex gap-5 border-b border-white/12 pb-5 text-sm leading-7 text-white/75" key={lesson}>
                  <span className="font-mono text-xs font-bold text-[#73d3a2]">0{index + 1}</span>
                  {lesson}
                </li>
              ))}
            </ol>
          </div>
        </section>
      </article>

      <section className="bg-white py-20 text-center sm:py-24">
        <div className="container-shell">
          <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-[-0.05em]">Find the evidence in your own resume.</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
            Use the demonstration as a method, never as copy or metrics to reuse.
          </p>
          <Button asChild className="mt-8" size="lg">
            <Link href="/scan">Start a scan <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
