"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileSearch,
  FileText,
  Filter,
  LayoutList,
  Lightbulb,
  Link2,
  LockKeyhole,
  MoreHorizontal,
  PanelRightOpen,
  Pencil,
  RefreshCw,
  ScanText,
  Search,
  Share2,
  ShieldAlert,
  Sparkles,
  Target,
  TextQuote,
  TrendingUp,
  WandSparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ResumePreview } from "@/components/report/resume-preview";
import { ScoreRing } from "@/components/report/score-ring";
import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import { recommendationSchema } from "@/lib/analysis/schemas";
import {
  getBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/auth/client";
import { DemoRepository } from "@/lib/repositories/demo";
import { cn, formatDate } from "@/lib/utils";
import type {
  AnalysisResult,
  CanonicalResumeDocument,
  Finding,
  Recommendation,
  ReportLens,
  ReportTab,
  ResumeVersion,
  Severity,
} from "@/types/domain";

const reportTabs: Array<{ id: ReportTab; label: string; icon: typeof BarChart3 }> = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "keywords", label: "Keywords", icon: TextQuote },
  { id: "sections", label: "Sections", icon: LayoutList },
  { id: "impact", label: "Impact", icon: TrendingUp },
  { id: "ai-tools", label: "AI tools", icon: WandSparkles },
  { id: "format", label: "Format", icon: ScanText },
  { id: "job-match", label: "Job match", icon: Target },
  { id: "reports", label: "Export & share", icon: Download },
];

const tabIds = new Set<ReportTab>(reportTabs.map((tab) => tab.id));
const lenses: Array<{ id: ReportLens; label: string }> = [
  { id: "default", label: "All evidence" },
  { id: "keywords", label: "Keywords" },
  { id: "format", label: "Format" },
  { id: "impact", label: "Impact" },
  { id: "job-match", label: "Job match" },
];

const severityStyles: Record<Severity, { label: string; className: string; dot: string }> = {
  critical: { label: "Critical", className: "bg-[var(--danger-soft)] text-[var(--danger)]", dot: "bg-[var(--danger)]" },
  high: { label: "High", className: "bg-[var(--danger-soft)] text-[var(--danger)]", dot: "bg-[var(--danger)]" },
  medium: { label: "Medium", className: "bg-[var(--warning-soft)] text-[#8c5a0d]", dot: "bg-[var(--warning)]" },
  low: { label: "Low", className: "bg-[var(--info-soft)] text-[#3a55bb]", dot: "bg-[var(--info)]" },
  passed: { label: "Passed", className: "bg-[var(--success-soft)] text-[var(--primary)]", dot: "bg-[var(--success)]" },
};

function MetricBar({ label, value, tone = "green" }: { label: string; value: number; tone?: "green" | "amber" | "blue" | "coral" }) {
  const color = tone === "green" ? "var(--primary)" : tone === "amber" ? "var(--warning)" : tone === "blue" ? "var(--info)" : "var(--danger)";
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-bold">{label}</span><span className="font-extrabold">{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-strong)]"><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }} /></div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const style = severityStyles[severity];
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold", style.className)}><span className={cn("size-1.5 rounded-full", style.dot)} />{style.label}</span>;
}

function ReportRail({
  result,
  activeTab,
  onTab,
  mobile = false,
}: {
  result: AnalysisResult;
  activeTab: ReportTab;
  onTab: (tab: ReportTab) => void;
  mobile?: boolean;
}) {
  const potentialGain = Math.min(
    20,
    Math.round(
      result.findings
        .filter((finding) => finding.status === "open")
        .reduce((sum, finding) => sum + finding.scoreImpact, 0),
    ),
  );
  if (mobile) {
    return (
      <nav aria-label="Report sections" className="overflow-x-auto border-b border-[var(--border)] bg-white px-3">
        <div className="flex min-w-max">
          {reportTabs.map((tab) => (
            <button key={tab.id} onClick={() => onTab(tab.id)} aria-current={activeTab === tab.id ? "page" : undefined} className={cn("border-b-2 px-3 py-3 text-xs font-bold", activeTab === tab.id ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--text-muted)]")}>{tab.label}</button>
          ))}
        </div>
      </nav>
    );
  }
  return (
    <aside className="hidden min-h-[calc(100vh-64px)] border-r border-[var(--border)] bg-white xl:flex xl:flex-col">
      <div className="border-b border-[var(--border)] px-5 py-6 text-center">
        <ScoreRing score={result.overallScore} label="Overall score" size="lg" tone="amber" detail={`${Math.round(result.confidence * 100)}% analysis confidence`} />
        <div className="mt-5 grid grid-cols-3 divide-x divide-[var(--border)]">
          <div><strong className="block text-sm">{result.componentScores.atsParse}</strong><span className="text-[9px] text-[var(--text-muted)]">ATS</span></div>
          <div><strong className="block text-sm">{result.componentScores.recruiterClarity}</strong><span className="text-[9px] text-[var(--text-muted)]">Clarity</span></div>
          <div><strong className="block text-sm">{result.componentScores.roleMatch ?? "—"}</strong><span className="text-[9px] text-[var(--text-muted)]">Match</span></div>
        </div>
      </div>
      <nav aria-label="Report sections" className="space-y-1 p-3">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          return <button key={tab.id} onClick={() => onTab(tab.id)} aria-current={activeTab === tab.id ? "page" : undefined} className={cn("flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-bold transition-colors", activeTab === tab.id ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]")}><Icon className="size-4" />{tab.label}</button>;
        })}
      </nav>
      <div className="mt-auto border-t border-[var(--border)] p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Estimated potential</p>
        <div className="mt-2 flex items-end justify-between"><strong className="text-2xl tracking-tight">+{potentialGain}</strong><span className="text-[10px] text-[var(--text-muted)]">capped estimate</span></div>
        <div className="mt-3 h-1.5 rounded-full bg-[var(--surface-strong)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${potentialGain / 20 * 100}%` }} /></div>
      </div>
    </aside>
  );
}

function FindingsList({
  findings,
  selectedId,
  onSelect,
  onStatus,
}: {
  findings: Finding[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onStatus: (id: string, status: Finding["status"]) => void;
}) {
  const [severity, setSeverity] = useState<"all" | Severity>("all");
  const [query, setQuery] = useState("");
  const visible = findings.filter((finding) => (severity === "all" || finding.severity === severity) && `${finding.title} ${finding.description}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <section aria-labelledby="findings-title" className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 id="findings-title" className="text-lg font-extrabold tracking-[-0.02em]">Prioritized findings</h2><p className="mt-1 text-xs text-[var(--text-muted)]">{visible.length} of {findings.length} findings · select one to locate its evidence</p></div>
        <div className="flex gap-2">
          <label className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-[var(--text-muted)]" /><span className="sr-only">Search findings</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-9 w-32 rounded-full border border-[var(--border)] bg-white pl-8 pr-3 text-xs outline-none focus:border-[var(--primary)] sm:w-40" /></label>
          <label className="relative"><span className="sr-only">Severity filter</span><select value={severity} onChange={(event) => setSeverity(event.target.value as "all" | Severity)} className="h-9 appearance-none rounded-full border border-[var(--border)] bg-white pl-3 pr-8 text-xs font-bold outline-none focus:border-[var(--primary)]"><option value="all">All severities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="passed">Passed</option></select><Filter className="pointer-events-none absolute right-2.5 top-2.5 size-3.5 text-[var(--text-muted)]" /></label>
        </div>
      </div>
      <div className="mt-4 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-white">
        {visible.map((finding) => (
          <article key={finding.id} id={`finding-${finding.id}`} className={cn("transition-colors", selectedId === finding.id && "bg-[var(--success-soft)]/65")}>
            <button type="button" onClick={() => onSelect(finding.id)} aria-expanded={selectedId === finding.id} className="flex w-full items-start gap-3 p-4 text-left sm:p-5">
              <span className={cn("mt-1 size-2 shrink-0 rounded-full", severityStyles[finding.severity].dot)} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2"><strong className="text-sm">{finding.title}</strong><SeverityBadge severity={finding.severity} />{finding.status !== "open" && <span className="rounded-full bg-[var(--surface-strong)] px-2 py-1 text-[9px] font-bold capitalize text-[var(--text-muted)]">{finding.status}</span>}</span>
                <span className="mt-1.5 block text-xs leading-5 text-[var(--text-secondary)]">{finding.description}</span>
              </span>
              <span className="shrink-0 text-right"><strong className="block text-xs text-[var(--primary)]">+{finding.scoreImpact}</strong><span className="text-[9px] text-[var(--text-muted)]">est. pts</span></span>
              <ChevronDown className={cn("mt-1 size-4 shrink-0 text-[var(--text-muted)] transition-transform", selectedId === finding.id && "rotate-180")} />
            </button>
            {selectedId === finding.id && (
              <div className="border-t border-[var(--border)] px-5 py-5 sm:ml-5 sm:px-8">
                {finding.sourceText && <blockquote className="border-l-2 border-[var(--warning)] bg-white px-4 py-3 font-serif text-xs leading-5">“{finding.sourceText}”</blockquote>}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Why it matters</p><p className="mt-1.5 text-xs leading-5 text-[var(--text-secondary)]">{finding.whyItMatters}</p></div>
                  <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Recommended action</p><p className="mt-1.5 text-xs leading-5 text-[var(--text-secondary)]">{finding.recommendation}</p></div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => onStatus(finding.id, "resolved")} disabled={finding.status === "resolved"}><Check className="size-3.5" /> Mark resolved</Button>
                  {finding.status === "dismissed" ? <Button variant="secondary" size="sm" onClick={() => onStatus(finding.id, "open")}><RefreshCw className="size-3.5" /> Undo dismiss</Button> : <Button variant="ghost" size="sm" onClick={() => onStatus(finding.id, "dismissed")}>Dismiss</Button>}
                  <button onClick={() => document.getElementById("resume-preview-panel")?.scrollIntoView({ behavior: "smooth" })} className="ml-auto text-xs font-bold text-[var(--primary)] xl:hidden">View in resume <ArrowRight className="ml-1 inline size-3.5" /></button>
                </div>
              </div>
            )}
          </article>
        ))}
        {!visible.length && <div className="p-8 text-center"><Search className="mx-auto size-6 text-[var(--text-muted)]" /><p className="mt-2 text-sm font-bold">No findings match</p><p className="mt-1 text-xs text-[var(--text-muted)]">Clear a filter to see the full report.</p></div>}
      </div>
    </section>
  );
}

function OverviewTab({
  result,
  findings,
  selectedFinding,
  onSelect,
  onStatus,
}: {
  result: AnalysisResult;
  findings: Finding[];
  selectedFinding?: string;
  onSelect: (id: string) => void;
  onStatus: (id: string, status: Finding["status"]) => void;
}) {
  const chartData = result.dimensionScores.map((item) => ({ name: item.label.replace(" / ", "/"), score: item.score }));
  return (
    <>
      <div className="grid gap-5 border-b border-[var(--border)] pb-8 sm:grid-cols-[190px_minmax(0,1fr)]">
        <div className="grid place-items-center rounded-2xl bg-[var(--surface-muted)] px-4 py-5"><ScoreRing score={result.overallScore} label="Overall score" size="lg" tone="amber" /><span className="mt-2 rounded-full bg-[var(--warning-soft)] px-2.5 py-1 text-[10px] font-extrabold text-[#8c5a0d]">Good foundation</span></div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold">{result.overallScore >= 80 ? "Strong foundation with focused refinements" : result.overallScore >= 65 ? "A solid base with evidence gaps to address" : "Several high-impact improvements are available"}</h2><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{productConfig.name} connected {result.findings.filter((finding) => finding.status === "open").length} open findings to this analysis. Review the evidence before changing the resume.</p></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <MetricBar label="ATS parse" value={result.componentScores.atsParse} />
            <MetricBar label="Recruiter clarity" value={result.componentScores.recruiterClarity} tone="blue" />
            {result.componentScores.roleMatch === null ? <div><div className="flex items-center justify-between gap-3 text-xs"><span className="font-bold">Role match</span><span className="font-extrabold">Not scored</span></div><p className="mt-2 text-[10px] leading-4 text-[var(--text-muted)]">No job description was included; remaining weights were normalized.</p></div> : <MetricBar label="Role match" value={result.componentScores.roleMatch} tone="amber" />}
            <MetricBar label="Impact evidence" value={result.metrics.impact} />
          </div>
        </div>
      </div>
      <section aria-labelledby="dimensions-title" className="mt-8">
        <div className="flex items-end justify-between"><div><h2 id="dimensions-title" className="text-lg font-extrabold">Score dimensions</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Weights saved with this immutable scan.</p></div><Link href="?tab=reports" className="text-xs font-bold text-[var(--primary)]">Methodology</Link></div>
        <div className="mt-4 h-60" role="img" aria-label="Dimension score bar chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 4" />
              <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
              <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
              <Tooltip cursor={{ fill: "var(--surface-muted)" }} />
              <Bar dataKey="score" radius={[0, 5, 5, 0]} barSize={13} isAnimationActive={false}>{chartData.map((item) => <Cell key={item.name} fill={item.score < 65 ? "var(--warning)" : "var(--primary)"} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <FindingsList findings={findings} selectedId={selectedFinding} onSelect={onSelect} onStatus={onStatus} />
    </>
  );
}

function KeywordsTab({ result, onSelectFinding }: { result: AnalysisResult; onSelectFinding: (id: string) => void }) {
  const [group, setGroup] = useState("all");
  const [status, setStatus] = useState("all");
  const groups = [...new Set(result.keywords.map((keyword) => keyword.group))];
  const visible = result.keywords.filter((keyword) => (group === "all" || keyword.group === group) && (status === "all" || keyword.status === status));
  const matched = result.keywords.filter((item) => ["matched", "strong"].includes(item.status)).length;
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="border-l-2 border-[var(--primary)] pl-4"><strong className="text-3xl tracking-tight">{result.metrics.keywordMatch ?? "—"}{result.metrics.keywordMatch !== null && "%"}</strong><p className="mt-1 text-xs font-bold text-[var(--text-muted)]">Weighted keyword match</p></div>
        <div className="border-l-2 border-[var(--success)] pl-4"><strong className="text-3xl tracking-tight">{matched}</strong><p className="mt-1 text-xs font-bold text-[var(--text-muted)]">Strong or matched</p></div>
        <div className="border-l-2 border-[var(--danger)] pl-4"><strong className="text-3xl tracking-tight">{result.keywords.filter((item) => item.status === "missing").length}</strong><p className="mt-1 text-xs font-bold text-[var(--text-muted)]">Missing terms</p></div>
      </div>
      <div className="mt-7 flex flex-wrap gap-2 border-y border-[var(--border)] py-4">
        <select value={group} onChange={(event) => setGroup(event.target.value)} className="h-9 rounded-full border border-[var(--border)] bg-white px-3 text-xs font-bold"><option value="all">All groups</option>{groups.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-full border border-[var(--border)] bg-white px-3 text-xs font-bold"><option value="all">All statuses</option><option value="strong">Strong</option><option value="matched">Matched</option><option value="partial">Partial</option><option value="related">Related</option><option value="missing">Missing</option><option value="overused">Overused</option></select>
        <span className="ml-auto self-center text-[10px] font-bold text-[var(--text-muted)]">Frequency is a signal, not a stuffing target.</span>
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
        <table className="w-full min-w-[690px] text-left">
          <thead><tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]"><th className="px-4 py-3">Keyword</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Importance</th><th className="px-4 py-3">Resume / job</th><th className="px-4 py-3">Evidence</th></tr></thead>
          <tbody>{visible.map((keyword) => <tr key={`${keyword.group}-${keyword.keyword}`} className="border-b border-[var(--border)] last:border-0"><td className="px-4 py-4"><strong className="text-sm">{keyword.keyword}</strong><p className="mt-1 text-[10px] text-[var(--text-muted)]">{keyword.group} · {keyword.requirementType}</p></td><td className="px-4 py-4"><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize", keyword.status === "missing" ? "bg-[var(--danger-soft)] text-[var(--danger)]" : keyword.status === "partial" || keyword.status === "related" || keyword.status === "overused" ? "bg-[var(--warning-soft)] text-[#8c5a0d]" : "bg-[var(--success-soft)] text-[var(--primary)]")}>{keyword.status}</span></td><td className="px-4 py-4"><div className="h-1.5 w-20 rounded-full bg-[var(--surface-strong)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${keyword.importance}%` }} /></div></td><td className="px-4 py-4 text-xs font-bold">{keyword.resumeFrequency} / {keyword.jobFrequency}</td><td className="max-w-[220px] px-4 py-4 text-xs leading-5 text-[var(--text-secondary)]">{keyword.evidence ? <button onClick={() => { const annotation = result.annotations.find((item) => item.label.toLowerCase().includes(keyword.keyword.toLowerCase())); if (annotation) onSelectFinding(annotation.findingId); }} className="text-left underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--primary)]">{keyword.evidence}</button> : <span>Place naturally in {keyword.recommendedSection ?? "relevant evidence"}</span>}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}

function SectionsTab({ result, document }: { result: AnalysisResult; document: CanonicalResumeDocument }) {
  const [parserOpen, setParserOpen] = useState(false);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-extrabold">Detected sections</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Order, confidence, relevance, and readability from the canonical document.</p></div><Button variant="secondary" size="sm" onClick={() => setParserOpen((value) => !value)}><Eye className="size-3.5" /> {parserOpen ? "Hide" : "Show"} parser text</Button></div>
      {parserOpen && <div className="mt-5 max-h-72 overflow-auto rounded-xl border border-[var(--border)] bg-[#18231e] p-5 font-mono text-[11px] leading-5 text-[#dfeee6] whitespace-pre-wrap"><p className="mb-3 font-sans text-[10px] font-bold uppercase tracking-wider text-[#89aa99]">Safe plain-text parse · read-only</p>{document.normalizedText}</div>}
      <div className="mt-6 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-white">
        {result.sections.map((section, index) => <article key={section.name} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_100px_170px] sm:items-center"><div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--surface-strong)] text-xs font-extrabold text-[var(--primary)]">{section.order ?? index + 1}</span><div><h3 className="text-sm font-extrabold">{section.name}</h3><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{section.issue ?? section.action}</p></div></div><span className={cn("w-fit rounded-full px-2.5 py-1 text-[10px] font-extrabold capitalize", section.status === "detected" ? "bg-[var(--success-soft)] text-[var(--primary)]" : section.status === "missing" ? "bg-[var(--danger-soft)] text-[var(--danger)]" : "bg-[var(--warning-soft)] text-[#8c5a0d]")}>{section.status}</span><div className="space-y-2"><MetricBar label="Relevance" value={section.relevance} /><MetricBar label="Readability" value={section.readability} tone="blue" /></div></article>)}
      </div>
    </>
  );
}

function ImpactTab({ result, onSelectFinding }: { result: AnalysisResult; onSelectFinding: (id: string) => void }) {
  const impactFindings = result.findings.filter((finding) => finding.category === "impact" || finding.category === "experience");
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-3">
        <div><ScoreRing score={result.metrics.impact} label="Impact evidence" size="md" tone="green" /></div>
        <div className="border-l border-[var(--border)] pl-5"><strong className="text-3xl">{result.metrics.achievementDensity}%</strong><p className="mt-1 text-xs font-bold text-[var(--text-muted)]">Achievement density</p><p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">Bullets with a result, quantity, scale, or outcome signal.</p></div>
        <div className="border-l border-[var(--border)] pl-5"><strong className="text-3xl">{impactFindings.length}</strong><p className="mt-1 text-xs font-bold text-[var(--text-muted)]">Evidence opportunities</p><p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">Never invent a metric. Clarify only facts you can verify.</p></div>
      </div>
      <h2 className="mt-8 text-lg font-extrabold">Evidence opportunities</h2>
      <div className="mt-4 space-y-3">{impactFindings.map((finding) => <button key={finding.id} onClick={() => onSelectFinding(finding.id)} className="flex w-full items-start gap-4 rounded-2xl border border-[var(--border)] bg-white p-4 text-left hover:border-[var(--primary)]"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--warning-soft)] text-[var(--warning)]"><Lightbulb className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">{finding.title}</span><span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{finding.recommendation}</span></span><span className="text-xs font-extrabold text-[var(--primary)]">+{finding.scoreImpact}</span></button>)}</div>
      <div className="mt-8 border-l-2 border-[var(--primary)] pl-5"><h2 className="text-sm font-extrabold">Evidence pattern</h2><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Action + scope + method + verified outcome. For example: “Led onboarding redesign across two squads, reducing verified setup time by 18%.”</p></div>
    </>
  );
}

function RecommendationCard({
  recommendation,
  onApply,
  onReject,
}: {
  recommendation: Recommendation;
  onApply: (recommendation: Recommendation) => void;
  onReject: (id: string) => void;
}) {
  const [current, setCurrent] = useState(recommendation);
  const [draftText, setDraftText] = useState(recommendation.suggestedText);
  const [editing, setEditing] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [regenerating, setRegenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function copySuggestion() {
    setActionError(null);
    try {
      await navigator.clipboard.writeText(draftText);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1_500);
    } catch {
      setActionError("Copy was blocked by the browser. Select the text manually.");
      setEditing(true);
    }
  }

  async function regenerateSuggestion() {
    setRegenerating(true);
    setActionError(null);
    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: recommendation.originalText,
          context: recommendation.rationale,
          instruction:
            "Create another concise, evidence-first resume bullet. Preserve verification placeholders and do not invent facts.",
        }),
      });
      const payload = await response.json() as {
        recommendation?: unknown;
        error?: string;
      };
      if (!response.ok || !payload.recommendation) {
        throw new Error(payload.error ?? "A new suggestion could not be generated.");
      }
      const regenerated = recommendationSchema.parse(
        payload.recommendation,
      ) as Recommendation;
      const next = {
        ...regenerated,
        id: recommendation.id,
        findingId: recommendation.findingId,
        status: "pending" as const,
      };
      setCurrent(next);
      setDraftText(next.suggestedText);
      setEditing(false);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "A new suggestion could not be generated.",
      );
    } finally {
      setRegenerating(false);
    }
  }

  return <article className={cn("rounded-2xl border bg-white p-5", recommendation.status === "pending" ? "border-[var(--border)]" : "border-[var(--border)] opacity-65")}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Sparkles className="size-4 text-[var(--violet)]" /><h3 className="text-sm font-extrabold">{current.title}</h3></div><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold capitalize", recommendation.status === "applied" ? "bg-[var(--success-soft)] text-[var(--primary)]" : recommendation.status === "rejected" ? "bg-[var(--surface-strong)] text-[var(--text-muted)]" : "bg-[var(--violet-soft)] text-[var(--violet)]")}>{recommendation.status}</span></div>
    <div className="mt-4 grid gap-3">
      <div className="rounded-xl bg-[var(--danger-soft)] p-3"><p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--danger)]">Original</p><p className="mt-1.5 font-serif text-xs leading-5">{recommendation.originalText}</p></div>
      <div className="rounded-xl bg-[var(--success-soft)] p-3"><div className="flex items-center justify-between gap-3"><p className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--primary)]">Proposed</p>{recommendation.status === "pending" && <button type="button" onClick={() => setEditing((value) => !value)} className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--primary)]"><Pencil className="size-3" /> {editing ? "Done editing" : "Edit"}</button>}</div>{editing ? <textarea value={draftText} onChange={(event) => setDraftText(event.target.value)} aria-label="Edit proposed resume text" className="mt-2 min-h-28 w-full resize-y rounded-lg border border-[var(--border-strong)] bg-white p-3 font-serif text-xs leading-5 outline-none focus:border-[var(--primary)]" /> : <p className="mt-1.5 font-serif text-xs leading-5">{draftText}</p>}</div>
    </div>
    <p className="mt-4 text-xs leading-5 text-[var(--text-secondary)]"><strong className="text-[var(--text)]">Why:</strong> {current.rationale}</p>
    <ul className="mt-3 flex flex-wrap gap-1.5">{current.changes.map((change) => <li key={change} className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[10px] font-bold text-[var(--text-secondary)]">{change}</li>)}</ul>
    {current.requiresVerification && <div className="mt-4 flex items-start gap-2 rounded-xl bg-[var(--warning-soft)] px-3 py-2.5 text-[10px] leading-4 text-[#795013]"><ShieldAlert className="mt-0.5 size-3.5 shrink-0" /><span><strong>Verify every fact.</strong> This suggestion may reframe evidence, but it cannot know whether a metric or claim is true.</span></div>}
    {actionError && <p className="mt-3 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-[10px] font-bold text-[var(--danger)]" role="alert">{actionError}</p>}
    {recommendation.status === "pending" && <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => onApply({ ...current, suggestedText: draftText })} disabled={!draftText.trim()}>Review and apply</Button><Button variant="secondary" size="sm" onClick={() => void copySuggestion()}><Copy className="size-3.5" /> {copyState === "copied" ? "Copied" : "Copy"}</Button><Button variant="secondary" size="sm" onClick={() => void regenerateSuggestion()} disabled={regenerating}><RefreshCw className={cn("size-3.5", regenerating && "animate-spin")} /> {regenerating ? "Regenerating…" : "Regenerate"}</Button><Button variant="ghost" size="sm" onClick={() => onReject(recommendation.id)}>Reject</Button></div>}
  </article>;
}

function AiToolsTab({
  recommendations,
  onApply,
  onReject,
}: {
  recommendations: Recommendation[];
  onApply: (recommendation: Recommendation) => void;
  onReject: (id: string) => void;
}) {
  return (
    <>
      <div className="flex items-start gap-3 rounded-2xl bg-[var(--violet-soft)] p-4 text-[var(--violet)]"><WandSparkles className="mt-0.5 size-5 shrink-0" /><div><h2 className="text-sm font-extrabold">Demo suggestions</h2><p className="mt-1 text-xs leading-5">These deterministic examples are not external AI output. Live semantic suggestions only run through a configured server-side provider and are schema-validated.</p></div></div>
      <div className="mt-6 space-y-4">{recommendations.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} onApply={onApply} onReject={onReject} />)}</div>
      <div className="mt-6 flex items-start gap-3 border-l-2 border-[var(--border-strong)] pl-4"><LockKeyhole className="mt-0.5 size-4 text-[var(--text-muted)]" /><p className="text-xs leading-5 text-[var(--text-secondary)]">Applying never overwrites the source. It creates an immutable resume version, marks this score stale, and offers a rescan and comparison.</p></div>
    </>
  );
}

function FormatTab({ result, document }: { result: AnalysisResult; document: CanonicalResumeDocument }) {
  const risks = document.layoutSignals;
  return (
    <>
      <div className="grid gap-6 sm:grid-cols-[130px_minmax(0,1fr)] sm:items-center"><ScoreRing score={Math.max(0, 100 - result.metrics.formatRisk)} label="Format safety" size="md" tone="green" /><div><h2 className="text-lg font-extrabold">Low-to-moderate parsing risk</h2><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">Checked supported layout signals only. This is not a test against a third-party ATS.</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--primary)]">{document.pageCount} pages parsed</span><span className="rounded-full bg-[var(--info-soft)] px-2.5 py-1 text-[10px] font-bold text-[#3a55bb]">{Math.round(document.extractionConfidence * 100)}% extraction confidence</span></div></div></div>
      <div className="mt-8 grid gap-3">{risks.length ? risks.map((signal, index) => <article key={`${signal.type}-${index}`} className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-white p-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--warning-soft)] text-[var(--warning)]"><FileSearch className="size-4" /></span><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-extrabold capitalize">{signal.type.replace("-", " ")}</h3><span className="text-[10px] font-bold text-[var(--text-muted)]">Page {signal.page} · {Math.round(signal.confidence * 100)}% confidence</span></div><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{signal.detail}</p></div></article>) : <article className="flex items-start gap-3 rounded-xl bg-[var(--success-soft)] p-4"><CheckCircle2 className="mt-0.5 size-5 text-[var(--primary)]" /><div><h3 className="text-sm font-extrabold">No supported layout risks detected</h3><p className="mt-1 text-xs text-[var(--text-secondary)]">Manual review is still recommended after exporting or editing.</p></div></article>}</div>
      <section className="mt-8"><h2 className="text-lg font-extrabold">Parser order</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Section order reconstructed from source offsets.</p><ol className="mt-4 grid gap-2 sm:grid-cols-2">{document.sections.sort((left, right) => left.order - right.order).map((section) => <li key={section.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3"><span className="grid size-7 place-items-center rounded-full bg-[var(--surface-strong)] text-[10px] font-extrabold">{section.order}</span><span className="text-xs font-bold">{section.heading || section.name}</span><span className="ml-auto text-[10px] text-[var(--text-muted)]">{Math.round(section.confidence * 100)}%</span></li>)}</ol></section>
    </>
  );
}

function JobMatchTab({ result }: { result: AnalysisResult }) {
  const [type, setType] = useState<"all" | "must-have" | "preferred">("all");
  const visible = result.requirements.filter((item) => type === "all" || item.type === type);
  if (!result.requirements.length || result.componentScores.roleMatch === null) return <div className="grid min-h-72 place-items-center text-center"><div><Target className="mx-auto size-8 text-[var(--text-muted)]" /><h2 className="mt-3 font-extrabold">Job match is unavailable</h2><p className="mt-1 max-w-sm text-sm leading-6 text-[var(--text-muted)]">This scan did not include a job description. Other score weights were normalized instead of treating match as zero.</p><Button asChild className="mt-5"><Link href="/app/scan">Scan with a job description</Link></Button></div></div>;
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center"><ScoreRing score={result.componentScores.roleMatch} label="Role match" size="lg" tone="amber" /><div><h2 className="text-lg font-extrabold">Requirements are partially covered</h2><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">Evidence is strongest in roadmap leadership and cross-functional delivery. Experimentation ownership needs clearer source evidence.</p><div className="mt-4 grid grid-cols-2 gap-3"><MetricBar label="Coverage" value={result.metrics.requirementCoverage ?? 0} /><MetricBar label="Keyword match" value={result.metrics.keywordMatch ?? 0} tone="amber" /></div></div></div>
      <div className="mt-7 flex gap-2 border-y border-[var(--border)] py-4">{(["all", "must-have", "preferred"] as const).map((item) => <button key={item} onClick={() => setType(item)} aria-pressed={type === item} className={cn("rounded-full px-3 py-2 text-xs font-bold capitalize", type === item ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-strong)] text-[var(--text-secondary)]")}>{item.replace("-", " ")}</button>)}</div>
      <div className="mt-5 space-y-3">{visible.map((requirement) => <article key={requirement.requirement} className="rounded-2xl border border-[var(--border)] bg-white p-4"><div className="flex items-start gap-3"><span className={cn("mt-1 size-2 shrink-0 rounded-full", requirement.status === "matched" || requirement.status === "strong" ? "bg-[var(--success)]" : requirement.status === "missing" ? "bg-[var(--danger)]" : "bg-[var(--warning)]")} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-extrabold">{requirement.requirement}</h3><span className="rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[9px] font-bold capitalize">{requirement.type.replace("-", " ")}</span><span className="rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[9px] font-bold capitalize">{requirement.status}</span></div><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{requirement.explanation}</p>{requirement.evidence && <blockquote className="mt-3 border-l-2 border-[var(--primary)] pl-3 font-serif text-xs leading-5">{requirement.evidence}<span className="mt-1 block font-sans text-[9px] text-[var(--text-muted)]">{requirement.evidenceLocation}</span></blockquote>}<p className="mt-3 text-xs font-bold text-[var(--primary)]">{requirement.action}</p></div><strong className="text-sm">{requirement.score}</strong></div></article>)}</div>
    </>
  );
}

function ReportsTab({
  result,
  onShare,
  onExport,
  exportState,
  exportError,
}: {
  result: AnalysisResult;
  onShare: () => void;
  onExport: () => void;
  exportState: "idle" | "working" | "complete";
  exportError: string | null;
}) {
  return (
    <>
      {exportState === "complete" && <div className="mb-5 flex items-start gap-3 rounded-xl bg-[var(--success-soft)] px-4 py-3 text-xs font-bold text-[var(--primary)]" role="status"><CheckCircle2 className="size-4" /> Your report PDF was downloaded.</div>}
      {exportError && <div className="mb-5 flex items-start gap-3 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-xs font-bold text-[var(--danger)]" role="alert"><ShieldAlert className="size-4" /> {exportError}</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={onExport} disabled={exportState === "working"} className="group rounded-2xl border border-[var(--border)] bg-white p-5 text-left hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:cursor-wait disabled:opacity-60"><FileText className="size-6 text-[var(--primary)]" /><h2 className="mt-4 text-sm font-extrabold">Export report PDF</h2><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Download a text-first PDF with the score context and prioritized findings.</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)]">{exportState === "working" ? "Preparing PDF…" : "Download PDF"} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span></button>
        <button onClick={onShare} className="group rounded-2xl border border-[var(--border)] bg-white p-5 text-left hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"><Share2 className="size-6 text-[var(--primary)]" /><h2 className="mt-4 text-sm font-extrabold">Private share link</h2><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Create a revocable seven-day link when live storage is configured.</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)]">Review sharing <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span></button>
      </div>
      <section className="mt-8"><h2 className="text-lg font-extrabold">Score methodology</h2><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">This analysis uses product heuristics, not a proprietary ATS dataset. The exact version and weights are stored with the result.</p><div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">{result.dimensionScores.map((dimension) => <div key={dimension.key} className="grid gap-2 border-b border-[var(--border)] p-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_70px_90px] sm:items-center"><div><h3 className="text-sm font-extrabold">{dimension.label}</h3><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{dimension.explanation}</p></div><strong>{dimension.score}</strong><span className="text-xs font-bold text-[var(--text-muted)]">{Math.round((result.weightSnapshot[dimension.key] ?? 0) * 100)}% weight</span></div>)}</div></section>
      <div className="mt-7 rounded-xl bg-[var(--surface-muted)] p-4 text-[10px] leading-5 text-[var(--text-muted)]"><strong className="text-[var(--text-secondary)]">Analysis metadata:</strong> schema v{result.schemaVersion} · analyzer {result.analyzerVersion} · {result.mode} mode · completed {formatDate(result.completedAt)} · benchmark: {result.benchmark.label} ({result.benchmark.score}) — {result.benchmark.explanation}</div>
    </>
  );
}

function ApplyDialog({
  recommendation,
  score,
  live,
  error,
  pending,
  onClose,
  onConfirm,
}: {
  recommendation: Recommendation | null;
  score: number;
  live: boolean;
  error: string | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [checked, setChecked] = useState(false);
  return (
    <Dialog.Root open={Boolean(recommendation)} onOpenChange={(open) => { if (!open && !pending) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-[#0d1e16]/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-[22px] bg-white p-6 shadow-[var(--shadow-lg)] outline-none">
          <div className="flex items-start justify-between"><div><p className="eyebrow">Create version</p><Dialog.Title id="apply-title" className="mt-1 text-xl font-extrabold">Apply this suggested rewrite?</Dialog.Title></div><Dialog.Close asChild><Button variant="ghost" size="icon" disabled={pending} aria-label="Close"><X className="size-4" /></Button></Dialog.Close></div>
          <Dialog.Description className="sr-only">Review and verify the suggested wording before creating an immutable resume version.</Dialog.Description>
          <div className="mt-5 rounded-xl bg-[var(--success-soft)] p-4 font-serif text-sm leading-6">{recommendation?.suggestedText}</div>
          <p className="mt-4 text-xs leading-5 text-[var(--text-secondary)]">This creates a new immutable {live ? "live" : "browser-local"} version and marks score {score} as stale. The source version remains available for comparison.</p>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] p-3"><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-0.5 size-4 accent-[var(--primary)]" /><span className="text-xs leading-5">I reviewed the wording and verified that every fact, metric, and claim is accurate.</span></label>
          {error && <p className="mt-3 rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-xs font-bold text-[var(--danger)]" role="alert">{error}</p>}
          <div className="mt-6 flex justify-end gap-2"><Dialog.Close asChild><Button variant="secondary" disabled={pending}>Cancel</Button></Dialog.Close><Button disabled={!checked || pending || !recommendation} onClick={() => void onConfirm()}>{pending ? "Saving version…" : "Create version"}</Button></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ShareDialog({
  open,
  onClose,
  scanId,
  canShare,
}: {
  open: boolean;
  onClose: () => void;
  scanId: string;
  canShare: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [share, setShare] = useState<{ id: string; url: string; expiresAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function createShare() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId, expiresInDays: 7 }),
      });
      const payload = (await response.json()) as {
        shareId?: string;
        url?: string;
        expiresAt?: string;
        error?: string;
      };
      if (!response.ok || !payload.shareId || !payload.url || !payload.expiresAt) {
        throw new Error(payload.error ?? "The private link could not be created.");
      }
      setShare({ id: payload.shareId, url: payload.url, expiresAt: payload.expiresAt });
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : "The private link could not be created.");
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    if (!share) return;
    await navigator.clipboard.writeText(share.url);
    setCopied(true);
  }

  async function revokeShare() {
    if (!share) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/shares", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: share.id }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "The link could not be revoked.");
      setShare(null);
      setCopied(false);
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "The link could not be revoked.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !pending) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[90] bg-[#0d1e16]/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[22px] bg-white p-6 shadow-[var(--shadow-lg)] outline-none">
          <div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[var(--success-soft)] text-[var(--primary)]"><Link2 className="size-5" /></span><Dialog.Close asChild><Button variant="ghost" size="icon" disabled={pending} aria-label="Close"><X className="size-4" /></Button></Dialog.Close></div>
          <Dialog.Title id="share-title" className="mt-4 text-xl font-extrabold">{canShare ? "Private report link" : "Sharing needs live mode"}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{canShare ? "Create one high-entropy link that expires in seven days. You can revoke it at any time." : `This report is a local demonstration, so ${productConfig.name} will not invent a public URL. Configure Supabase to create an externally accessible link.`}</Dialog.Description>
          {error ? <p className="mt-4 rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-xs font-bold text-[var(--danger)]" role="alert">{error}</p> : null}
          {share ? <div className="mt-5"><label className="text-xs font-bold">Share URL<input readOnly value={share.url} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3 text-xs" /></label><p className="mt-2 text-[10px] text-[var(--text-muted)]">Expires {formatDate(share.expiresAt)}</p><div className="mt-5 flex gap-2"><Button className="flex-1" onClick={() => void copyLink()}><Copy className="size-3.5" /> {copied ? "Copied" : "Copy link"}</Button><Button variant="danger" onClick={() => void revokeShare()} disabled={pending}>{pending ? "Revoking…" : "Revoke"}</Button></div></div> : canShare ? <Button className="mt-6 w-full" onClick={() => void createShare()} disabled={pending}>{pending ? "Creating private link…" : "Create seven-day link"}</Button> : <Dialog.Close asChild><Button className="mt-6 w-full">Keep report private</Button></Dialog.Close>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ReportWorkspace({
  scanId,
  resumeId,
  result,
  document,
  versions,
  initialScoreStale = false,
  reportTitle,
  resumeLabel,
  localReport = false,
  demoReport = false,
}: {
  scanId: string;
  resumeId?: string;
  result: AnalysisResult;
  document: CanonicalResumeDocument;
  versions: ResumeVersion[];
  initialScoreStale?: boolean;
  reportTitle?: string;
  resumeLabel?: string;
  localReport?: boolean;
  demoReport?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as ReportTab | null;
  const activeTab = tabParam && tabIds.has(tabParam) ? tabParam : "overview";
  const requestedFinding = searchParams.get("findingId");
  const requestedAnnotation = searchParams.get("annotationId");
  const initialFinding =
    (requestedFinding &&
      result.findings.some((finding) => finding.id === requestedFinding)
      ? requestedFinding
      : result.annotations.find(
          (annotation) => annotation.id === requestedAnnotation,
        )?.findingId) ?? result.findings[0]?.id;
  const [lens, setLens] = useState<ReportLens>("default");
  const [selectedFinding, setSelectedFinding] = useState<string | undefined>(initialFinding);
  const [mobileMode, setMobileMode] = useState<"analysis" | "resume">("analysis");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [findings, setFindings] = useState(result.findings);
  const [recommendations, setRecommendations] = useState(result.recommendations);
  const [savedVersions, setSavedVersions] = useState(versions);
  const [applyTarget, setApplyTarget] = useState<Recommendation | null>(null);
  const [applyPending, setApplyPending] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [stale, setStale] = useState(initialScoreStale);
  const [exportState, setExportState] = useState<
    "idle" | "working" | "complete"
  >("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  const persistenceResumeId = resumeId ?? scanId;
  const liveReport =
    isSupabaseConfigured() && !localReport && !demoReport;

  function setTab(tab: ReportTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "overview") params.delete("tab"); else params.set("tab", tab);
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ""}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectFinding(id: string) {
    setSelectedFinding(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("findingId", id);
    const annotation = result.annotations.find(
      (item) => item.findingId === id,
    );
    if (annotation) params.set("annotationId", annotation.id);
    else params.delete("annotationId");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    const finding = result.findings.find((item) => item.id === id);
    if (finding) {
      const mappedTab: Partial<Record<Finding["category"], ReportTab>> = {
        keywords: "keywords", sections: "sections", impact: "impact", experience: "impact", format: "format", readability: "sections", "job-match": "job-match",
      };
      const next = mappedTab[finding.category];
      if (next && activeTab !== "overview") setTab(next);
      if (window.innerWidth < 1024) setMobileMode("resume");
    }
  }

  async function persistLocalResult(next: Partial<AnalysisResult>) {
    const repository = new DemoRepository();
    const bundle = await repository.getScanBundle(scanId);
    if (!bundle) return;
    await repository.saveScan(
      scanId,
      bundle.summary,
      { ...bundle.result, ...next },
    );
  }

  function updateFinding(id: string, status: Finding["status"]) {
    const nextFindings = findings.map((item) =>
      item.id === id ? { ...item, status } : item,
    );
    setFindings(nextFindings);
    void (async () => {
      if (liveReport) {
        const client = getBrowserSupabase();
        if (!client) return;
        await client
          .from("findings")
          .update({ status })
          .eq("scan_id", scanId)
          .eq("external_id", id);
      } else {
        await persistLocalResult({ findings: nextFindings });
      }
    })();
  }

  function rejectRecommendation(id: string) {
    const nextRecommendations = recommendations.map((item) =>
      item.id === id ? { ...item, status: "rejected" as const } : item,
    );
    setRecommendations(nextRecommendations);
    void (async () => {
      if (liveReport) {
        const client = getBrowserSupabase();
        if (!client) return;
        await client
          .from("recommendations")
          .update({ status: "rejected" })
          .eq("scan_id", scanId)
          .eq("external_id", id);
      } else {
        await persistLocalResult({ recommendations: nextRecommendations });
      }
    })();
  }

  async function applyRecommendation() {
    if (!applyTarget) return;
    setApplyPending(true);
    setApplyError(null);
    try {
      let nextVersion: ResumeVersion;
      if (liveReport) {
        const response = await fetch("/api/recommendations/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scanId,
            recommendationId: applyTarget.id,
            originalText: applyTarget.originalText,
            suggestedText: applyTarget.suggestedText,
            title: applyTarget.title,
          }),
        });
        const payload = (await response.json()) as {
          version?: ResumeVersion;
          error?: string;
        };
        if (!response.ok || !payload.version) {
          throw new Error(
            payload.error ?? "The live version could not be created.",
          );
        }
        nextVersion = payload.version;
      } else {
        const latestVersion = [...savedVersions].sort(
          (left, right) => right.version - left.version,
        )[0];
        const sourceContent = latestVersion?.content ?? document.normalizedText;
        if (!sourceContent.includes(applyTarget.originalText)) {
          throw new Error(
            "The original passage is no longer present in the latest version. Compare versions before applying.",
          );
        }
        const nextVersionNumber =
          Math.max(0, ...savedVersions.map((version) => version.version)) + 1;
        nextVersion = {
          id: crypto.randomUUID(),
          version: nextVersionNumber,
          name: `Verified rewrite v${nextVersionNumber}`,
          content: sourceContent.replace(
            applyTarget.originalText,
            applyTarget.suggestedText,
          ),
          source: "rewrite",
          changeSummary: applyTarget.title,
          createdAt: new Date().toISOString(),
        };
        const repository = new DemoRepository();
        await repository.saveVersion(persistenceResumeId, nextVersion);
        await repository.markScanStale(scanId);
      }
      setSavedVersions((items) => [nextVersion, ...items]);
      setRecommendations((items) => items.map((item) => item.id === applyTarget.id ? { ...item, status: "applied" } : item));
      setApplyTarget(null);
      setStale(true);
    } catch (error) {
      setApplyError(
        error instanceof Error
          ? error.message
          : "The new version could not be saved.",
      );
    } finally {
      setApplyPending(false);
    }
  }

  async function exportReport() {
    if (exportState === "working") return;
    setExportState("working");
    setExportError(null);
    try {
      const shouldSendLocalResult =
        localReport && !isSupabaseConfigured();
      const response = await fetch(
        shouldSendLocalResult
          ? "/api/reports/export"
          : `/api/reports/export?scanId=${encodeURIComponent(scanId)}`,
        shouldSendLocalResult
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scanId, result }),
            }
          : undefined,
      );
      if (!response.ok) {
        const payload = await response
          .json()
          .catch(() => ({ error: "The report PDF could not be prepared." })) as {
          error?: string;
        };
        throw new Error(
          payload.error ?? "The report PDF could not be prepared.",
        );
      }
      const blob = await response.blob();
      if (blob.type !== "application/pdf") {
        throw new Error("The export endpoint returned an invalid file.");
      }
      const objectUrl = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${productConfig.name.toLowerCase()}-report-${scanId.replace(/[^a-zA-Z0-9-]/g, "")}.pdf`;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
      setExportState("complete");
    } catch (error) {
      setExportState("idle");
      setExportError(
        error instanceof Error
          ? error.message
          : "The report PDF could not be downloaded.",
      );
    }
  }

  const analysisContent = (
    <div className="mx-auto w-full max-w-[860px] px-4 py-6 sm:px-6 lg:px-7 lg:py-7">
      <div className="mb-6 flex items-center justify-between gap-3 xl:hidden">
        <div><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Overall score</span><p className="text-2xl font-extrabold">{result.overallScore}<span className="text-xs text-[var(--text-muted)]"> /100</span></p></div>
        <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(true)} className="hidden sm:inline-flex lg:inline-flex"><PanelRightOpen className="size-3.5" /> Resume preview</Button>
      </div>
      {activeTab === "overview" && <OverviewTab result={result} findings={findings} selectedFinding={selectedFinding} onSelect={selectFinding} onStatus={updateFinding} />}
      {activeTab === "keywords" && <KeywordsTab result={result} onSelectFinding={selectFinding} />}
      {activeTab === "sections" && <SectionsTab result={result} document={document} />}
      {activeTab === "impact" && <ImpactTab result={result} onSelectFinding={selectFinding} />}
      {activeTab === "ai-tools" && <AiToolsTab recommendations={recommendations} onApply={setApplyTarget} onReject={rejectRecommendation} />}
      {activeTab === "format" && <FormatTab result={result} document={document} />}
      {activeTab === "job-match" && <JobMatchTab result={result} />}
      {activeTab === "reports" && <ReportsTab result={result} onShare={() => setShareOpen(true)} onExport={() => void exportReport()} exportState={exportState} exportError={exportError} />}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--background)]">
      <header className="flex min-h-[74px] flex-wrap items-center gap-3 border-b border-[var(--border)] bg-white px-4 py-3 sm:px-5">
        <Button asChild variant="ghost" size="icon"><Link href="/app/history" aria-label="Back to scan history"><ArrowLeft className="size-4" /></Link></Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-sm font-extrabold sm:text-base">{reportTitle || "Resume evidence report"}</h1><span className="rounded-full bg-[var(--success-soft)] px-2 py-1 text-[9px] font-extrabold text-[var(--primary)]">{demoReport || localReport ? "Demo analysis" : result.mode === "hybrid" ? "Hybrid analysis" : "Deterministic analysis"}</span>{stale && <span className="rounded-full bg-[var(--warning-soft)] px-2 py-1 text-[9px] font-extrabold text-[#8c5a0d]">Score stale · rescan required</span>}</div>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">{resumeLabel ?? document.filename} · {savedVersions.length} saved {savedVersions.length === 1 ? "version" : "versions"} · analyzed {formatDate(result.completedAt)} · analyzer {result.analyzerVersion}</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {stale && <Button asChild variant="secondary" size="sm"><Link href="/app/scan"><RefreshCw className="size-3.5" /> Rescan</Link></Button>}
          {stale && <Button asChild variant="ghost" size="sm"><Link href={`/app/compare?resumeId=${encodeURIComponent(persistenceResumeId)}`}><BarChart3 className="size-3.5" /> Compare</Link></Button>}
          <Button variant="secondary" size="sm" onClick={() => void exportReport()} disabled={exportState === "working"}><Download className="size-3.5" /> {exportState === "working" ? "Preparing…" : "Export"}</Button>
          <Button size="sm" onClick={() => setShareOpen(true)}><Share2 className="size-3.5" /> Share</Button>
        </div>
        <button className="grid size-10 place-items-center rounded-full hover:bg-[var(--surface-muted)] sm:hidden" onClick={() => setTab("reports")} aria-label="Open export and sharing actions"><MoreHorizontal className="size-4" /></button>
      </header>

      <div className="flex border-b border-[var(--border)] bg-white px-4 py-2 xl:pl-[256px]">
        <span className="mr-3 self-center text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Lens</span>
        <div className="flex min-w-0 gap-1 overflow-x-auto">
          {lenses.map((item) => <button key={item.id} onClick={() => setLens(item.id)} aria-pressed={lens === item.id} className={cn("shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold", lens === item.id ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-secondary)]")}>{item.label}</button>)}
        </div>
      </div>
      <ReportRail result={result} activeTab={activeTab} onTab={setTab} mobile />

      <div className="border-b border-[var(--border)] bg-white px-3 py-2 sm:hidden">
        <div className="grid grid-cols-2 rounded-full bg-[var(--surface-strong)] p-1">
          <button onClick={() => setMobileMode("analysis")} aria-pressed={mobileMode === "analysis"} className={cn("rounded-full px-4 py-2 text-xs font-bold", mobileMode === "analysis" ? "bg-white shadow-sm" : "text-[var(--text-muted)]")}>Analysis</button>
          <button onClick={() => setMobileMode("resume")} aria-pressed={mobileMode === "resume"} className={cn("rounded-full px-4 py-2 text-xs font-bold", mobileMode === "resume" ? "bg-white shadow-sm" : "text-[var(--text-muted)]")}>Resume</button>
        </div>
      </div>

      <div className="xl:grid xl:grid-cols-[236px_minmax(430px,1fr)_minmax(360px,416px)]">
        <ReportRail result={result} activeTab={activeTab} onTab={setTab} />
        <main className={cn("min-w-0", mobileMode === "resume" && "hidden sm:block")}>{analysisContent}</main>
        <div id="resume-preview-panel" className={cn("hidden min-w-0 border-l border-[var(--border)] xl:block", mobileMode === "resume" && "!block border-l-0 sm:hidden")}>
          <div className="sticky top-16">
            <ResumePreview document={document} annotations={result.annotations} selectedFindingId={selectedFinding} onSelectFinding={(id) => { selectFinding(id); setMobileMode("analysis"); }} lens={lens} />
          </div>
        </div>
      </div>

      <Dialog.Root open={previewOpen} onOpenChange={setPreviewOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-[#0d1e16]/40 backdrop-blur-sm xl:hidden" />
          <Dialog.Content aria-describedby={undefined} className="fixed inset-y-0 right-0 z-[90] w-[min(94vw,620px)] bg-white shadow-[var(--shadow-lg)] outline-none xl:hidden">
            <Dialog.Title className="sr-only">Resume preview</Dialog.Title>
            <Dialog.Close asChild><button aria-label="Close resume preview" className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white shadow-sm"><X className="size-4" /></button></Dialog.Close>
            <ResumePreview compact document={document} annotations={result.annotations} selectedFindingId={selectedFinding} onSelectFinding={(id) => { selectFinding(id); setPreviewOpen(false); }} lens={lens} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <ApplyDialog key={applyTarget?.id ?? "closed"} recommendation={applyTarget} score={result.overallScore} live={liveReport} error={applyError} pending={applyPending} onClose={() => { setApplyTarget(null); setApplyError(null); }} onConfirm={applyRecommendation} />
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} scanId={scanId} canShare={liveReport} />
    </div>
  );
}
