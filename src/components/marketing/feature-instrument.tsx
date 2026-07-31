"use client";

import { Check, Copy, RefreshCw, RotateCcw, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FeatureSlug } from "@/content/features";
import { cn } from "@/lib/utils";

const rowsByFeature: Record<
  FeatureSlug,
  Array<{ label: string; detail: string; value: string; status: "success" | "warning" | "danger" | "info" }>
> = {
  "ats-parser": [
    { label: "Contact fields", detail: "Name, email, location detected", value: "Passed", status: "success" },
    { label: "Skills table", detail: "Reading order may change", value: "High", status: "danger" },
    { label: "Section headings", detail: "7 of 7 recognized", value: "Passed", status: "success" },
    { label: "Footer", detail: "Page number only", value: "Low", status: "warning" },
  ],
  "job-match": [
    { label: "Product roadmap", detail: "Experience · line 14", value: "Strong", status: "success" },
    { label: "Revenue KPIs", detail: "No direct outcome evidence", value: "Missing", status: "danger" },
    { label: "GTM strategy", detail: "Related launch evidence", value: "Partial", status: "warning" },
    { label: "Agile / Scrum", detail: "Skills and experience", value: "Strong", status: "success" },
  ],
  "keyword-analysis": [
    { label: "Core role signals", detail: "8 matched · 1 missing", value: "89%", status: "success" },
    { label: "Tools & platforms", detail: "5 matched · 1 related", value: "83%", status: "info" },
    { label: "Business outcomes", detail: "2 matched · 2 missing", value: "50%", status: "warning" },
    { label: "Tableau", detail: "Only add with real experience", value: "Missing", status: "danger" },
  ],
  "impact-analysis": [
    { label: "Quantified bullets", detail: "4 of 11 eligible bullets", value: "36%", status: "warning" },
    { label: "Strong action verbs", detail: "9 of 11 bullets", value: "82%", status: "success" },
    { label: "Responsibility-only", detail: "Two bullets need an outcome", value: "2", status: "danger" },
    { label: "Scope evidence", detail: "Teams, launches, markets", value: "Good", status: "success" },
  ],
  "ai-rewrite": [
    { label: "Ownership", detail: "Responsible for → owned", value: "Changed", status: "info" },
    { label: "Scope", detail: "Named three partner teams", value: "Added", status: "warning" },
    { label: "Metrics", detail: "No unsupported metric added", value: "Checked", status: "success" },
    { label: "Source", detail: "Original remains unchanged", value: "Safe", status: "success" },
  ],
  "version-comparison": [
    { label: "Overall", detail: "65 → 73", value: "+8", status: "success" },
    { label: "Formatting", detail: "40 → 76", value: "+36", status: "success" },
    { label: "Resolved findings", detail: "Skills table · dates · heading", value: "3", status: "success" },
    { label: "New findings", detail: "One repeated phrase", value: "1", status: "warning" },
  ],
};

export function FeatureInstrument({ slug }: { slug: FeatureSlug }) {
  const [mode, setMode] = useState<"report" | "source">("report");
  const [suggestionState, setSuggestionState] = useState<"ready" | "applied" | "rejected">("ready");
  const rows = rowsByFeature[slug];

  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--border-strong)] bg-white shadow-[0_26px_80px_rgba(18,51,37,.14)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <div>
          <p className="text-sm font-bold">Alex Morgan · Senior Product Manager</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Sample report · fictional demonstration</p>
        </div>
        <div className="flex rounded-full bg-[var(--surface-muted)] p-1">
          {(["report", "source"] as const).map((item) => (
            <button
              aria-pressed={mode === item}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                mode === item ? "bg-white text-[var(--text)] shadow-sm" : "text-[var(--text-secondary)]",
              )}
              key={item}
              onClick={() => setMode(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {mode === "report" ? (
        <div className="p-5 sm:p-7">
          <div className="grid gap-3">
            {rows.map((row) => (
              <div
                className="grid gap-3 border-b border-[var(--border)] py-3 last:border-none sm:grid-cols-[1fr_1.4fr_auto] sm:items-center"
                key={row.label}
              >
                <p className="text-sm font-semibold">{row.label}</p>
                <p className="text-xs leading-5 text-[var(--text-secondary)]">{row.detail}</p>
                <Badge tone={row.status}>{row.value}</Badge>
              </div>
            ))}
          </div>
          {slug === "ai-rewrite" ? (
            <div className="mt-5 rounded-[16px] bg-[var(--violet-soft)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#5840ae]">Suggested wording</p>
              <p className="mt-2 text-sm leading-6">
                Owned the platform roadmap and aligned quarterly priorities with product,
                engineering, and GTM stakeholders.
              </p>
              <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                Verify roadmap ownership and every named stakeholder group before applying.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestionState === "ready" ? (
                  <>
                    <Button onClick={() => setSuggestionState("applied")} size="sm">
                      <Check aria-hidden="true" className="size-3.5" /> Apply
                    </Button>
                    <Button onClick={() => setSuggestionState("rejected")} size="sm" variant="secondary">
                      <X aria-hidden="true" className="size-3.5" /> Reject
                    </Button>
                    <Button
                      onClick={() => void navigator.clipboard?.writeText(
                        "Owned the platform roadmap and aligned quarterly priorities with product, engineering, and GTM stakeholders.",
                      )}
                      size="sm"
                      variant="ghost"
                    >
                      <Copy aria-hidden="true" className="size-3.5" /> Copy
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setSuggestionState("ready")} size="sm" variant="secondary">
                    <RotateCcw aria-hidden="true" className="size-3.5" /> Reset demo
                  </Button>
                )}
              </div>
              <p aria-live="polite" className="mt-2 text-xs font-semibold text-[var(--primary)]">
                {suggestionState === "applied"
                  ? "Applied to a new sample version. The source version remains available."
                  : suggestionState === "rejected"
                    ? "Rejected. No resume content changed."
                    : ""}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-[#edf1ec] p-6 sm:p-9">
          <div className="mx-auto max-w-md bg-white px-8 py-10 font-serif shadow-[0_8px_30px_rgba(23,35,29,.12)]">
            <p className="text-center text-lg font-semibold tracking-[0.08em]">ALEX MORGAN</p>
            <p className="mt-1 text-center text-[10px] text-[var(--text-muted)]">
              alex.morgan@example.test · Chicago, IL
            </p>
            <p className="mt-7 border-b border-[#aab5af] pb-1 text-xs font-bold tracking-[0.1em]">
              EXPERIENCE
            </p>
            <p className="mt-4 text-xs font-bold">Senior Product Manager</p>
            <p className="mt-2 bg-[var(--warning-soft)] px-1 text-[11px] leading-6 ring-1 ring-[var(--warning)]">
              Owned the platform roadmap and aligned priorities with product, engineering,
              and GTM stakeholders.
            </p>
            <p className="mt-2 text-[11px] leading-6">
              Led customer onboarding experiments with design and engineering.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-[10px] font-sans font-semibold text-[var(--primary)]">
              <RefreshCw aria-hidden="true" className="size-3" />
              Linked to the selected report evidence
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

