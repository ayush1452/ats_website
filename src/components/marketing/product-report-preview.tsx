"use client";

import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  Highlighter,
  Search,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ScoreRing } from "@/components/marketing/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import { cn } from "@/lib/utils";

type PreviewTab = "Overview" | "Keywords" | "Format";

const findings = [
  {
    id: "format",
    title: "Skills table may change reading order",
    detail: "Replace the two-column table with a plain section.",
    impact: "+7",
    tone: "danger" as const,
    line: "skills",
  },
  {
    id: "impact",
    title: "Two bullets need outcome evidence",
    detail: "Add a verified result, scope, or observable change.",
    impact: "+5",
    tone: "warning" as const,
    line: "experience",
  },
  {
    id: "keyword",
    title: "GTM strategy is a weighted gap",
    detail: "Evidence may fit the launch bullet—verify before adding.",
    impact: "+3",
    tone: "info" as const,
    line: "launch",
  },
];

export function ProductReportPreview({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const [tab, setTab] = useState<PreviewTab>("Overview");
  const [selectedFinding, setSelectedFinding] = useState(findings[0]?.id ?? "");

  const visibleFindings =
    tab === "Overview"
      ? findings
      : tab === "Keywords"
        ? findings.filter((finding) => finding.id === "keyword")
        : findings.filter((finding) => finding.id === "format");

  return (
    <div
      aria-label={`Interactive sample ${productConfig.name} report`}
      className={cn(
        "overflow-hidden rounded-[22px] border border-[color:rgba(202,215,207,.85)] bg-[var(--surface)] text-left text-[var(--text)] shadow-[0_32px_90px_rgba(8,45,31,.2)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-white px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-[var(--success-soft)] text-[var(--primary)]">
            <FileText aria-hidden="true" className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">Alex-Morgan-Resume.pdf</span>
            <span className="block truncate text-[11px] text-[var(--text-muted)]">
              Senior Product Manager · Updated moments ago
            </span>
          </span>
        </div>
        <Badge className="ml-3 shrink-0" tone="success">Demo analysis</Badge>
      </div>

      <div className={cn("grid", compact ? "lg:grid-cols-[156px_1fr]" : "lg:grid-cols-[176px_1fr_260px]")}>
        <aside className="hidden border-r border-[var(--border)] bg-[var(--background-secondary)] p-4 lg:block">
          <div className="text-center">
            <ScoreRing className="mx-auto" label="Overall score" score={73} size={compact ? "sm" : "lg"} />
            <p className="mt-2 text-xs font-bold">Overall score</p>
            <p className="mt-1 text-[10px] leading-4 text-[var(--text-muted)]">
              Transparent product heuristic
            </p>
          </div>
          <div className="mt-5 space-y-3">
            {[
              ["ATS parse", 87],
              ["Clarity", 72],
              ["Role match", 73],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="flex justify-between text-[10px]">
                  <span className="font-semibold text-[var(--text-secondary)]">{label}</span>
                  <span className="font-bold">{value}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-strong)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)]"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[12px] border border-[var(--border)] bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--danger)]">
              Priority
            </p>
            <p className="mt-1.5 text-xs font-semibold leading-5">Fix the skills table first.</p>
          </div>
        </aside>

        <section className="min-w-0 bg-[var(--background)]">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border)] px-3 py-2 sm:px-4">
            {(["Overview", "Keywords", "Format"] as PreviewTab[]).map((item) => (
              <button
                aria-pressed={tab === item}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                  tab === item
                    ? "bg-[var(--primary-dark)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-white",
                )}
                key={item}
                onClick={() => setTab(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--primary)]">
                  {tab === "Overview" ? "Priority findings" : `${tab} analysis`}
                </p>
                <h3 className="mt-1.5 text-base font-semibold tracking-[-0.02em]">
                  {tab === "Overview"
                    ? "Make the evidence easier to find"
                    : tab === "Keywords"
                      ? "One important role signal is missing"
                      : "One layout choice needs attention"}
                </h3>
              </div>
              <span className="hidden rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[10px] font-semibold text-[var(--text-secondary)] sm:inline">
                93% confidence
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {visibleFindings.map((finding) => (
                <button
                  aria-pressed={selectedFinding === finding.id}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-[15px] border bg-white p-3.5 text-left transition-[border,box-shadow,transform] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                    selectedFinding === finding.id
                      ? "border-[var(--primary)] shadow-[0_8px_24px_rgba(14,107,73,.08)]"
                      : "border-[var(--border)]",
                  )}
                  key={finding.id}
                  onClick={() => setSelectedFinding(finding.id)}
                  type="button"
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
                      finding.tone === "danger" && "bg-[var(--danger-soft)] text-[var(--danger)]",
                      finding.tone === "warning" && "bg-[var(--warning-soft)] text-[var(--warning)]",
                      finding.tone === "info" && "bg-[var(--info-soft)] text-[var(--info)]",
                    )}
                  >
                    {finding.tone === "info" ? (
                      <Highlighter aria-hidden="true" className="size-3.5" />
                    ) : (
                      <TriangleAlert aria-hidden="true" className="size-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold leading-5">{finding.title}</span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-secondary)]">
                      {finding.detail}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-bold text-[var(--primary)]">
                    {finding.impact} pts
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="mt-1 size-3.5 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              ))}
            </div>

            {!compact ? (
              <div className="mt-4 flex items-center justify-between rounded-[14px] bg-[var(--primary-dark)] px-4 py-3 text-white">
                <div>
                  <p className="text-xs font-bold">Estimated potential: +15 points</p>
                  <p className="mt-0.5 text-[10px] text-white/65">Capped estimate from unresolved findings</p>
                </div>
                <Button asChild className="bg-white text-[var(--primary-dark)] shadow-none hover:bg-white/90" size="sm">
                  <Link href="/scan">
                    Run my scan
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </section>

        {!compact ? (
          <aside className="hidden border-l border-[var(--border)] bg-[#edf1ec] p-4 lg:block">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                Resume preview
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                <Search aria-hidden="true" className="size-3" /> 100%
              </span>
            </div>
            <div className="mt-3 aspect-[.72] bg-white px-5 py-6 font-serif shadow-[0_6px_26px_rgba(23,35,29,.12)]">
              <p className="text-center text-[10px] font-semibold tracking-[0.08em]">ALEX MORGAN</p>
              <p className="mt-1 text-center text-[5px] text-[var(--text-muted)]">
                alex.morgan@example.test · Chicago, IL
              </p>
              <div className="mt-4">
                <p className="border-b border-[#b8c1bc] pb-1 text-[6px] font-bold tracking-[0.1em]">
                  EXPERIENCE
                </p>
                <p className="mt-2 text-[6px] font-bold">Senior Product Manager</p>
                <p className="mt-1 text-[5px] leading-[1.6]">
                  • Owned the platform roadmap and aligned priorities with product, engineering,
                  and GTM stakeholders.
                </p>
                <p
                  className={cn(
                    "mt-1 rounded-[2px] px-0.5 text-[5px] leading-[1.6] transition-colors",
                    selectedFinding === "impact" || selectedFinding === "keyword"
                      ? "bg-[var(--warning-soft)] ring-1 ring-[var(--warning)]"
                      : "bg-[#eef2ed]",
                  )}
                >
                  • Worked on onboarding improvements with design and engineering.
                </p>
                <p
                  className={cn(
                    "mt-1 rounded-[2px] px-0.5 text-[5px] leading-[1.6] transition-colors",
                    selectedFinding === "keyword"
                      ? "bg-[var(--info-soft)] ring-1 ring-[var(--info)]"
                      : "",
                  )}
                >
                  • Partnered with sales and marketing on three platform launches.
                </p>
              </div>
              <div className="mt-4">
                <p className="border-b border-[#b8c1bc] pb-1 text-[6px] font-bold tracking-[0.1em]">
                  SKILLS
                </p>
                <div
                  className={cn(
                    "mt-2 grid grid-cols-2 gap-px rounded-[2px] p-1 text-[4.5px] leading-[1.6] transition-colors",
                    selectedFinding === "format"
                      ? "bg-[var(--danger-soft)] ring-1 ring-[var(--danger)]"
                      : "bg-[#eef2ed]",
                  )}
                >
                  <span>Product roadmap</span>
                  <span>Agile · OKRs</span>
                  <span>Figma · Jira</span>
                  <span>Mixpanel · API</span>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-1 text-[4.5px] text-[var(--primary)]">
                <CheckCircle2 aria-hidden="true" className="size-2" />
                Matched evidence
                <Check aria-hidden="true" className="ml-auto size-2" />
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
