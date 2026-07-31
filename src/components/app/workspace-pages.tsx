"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileDiff,
  FilePlus2,
  FileText,
  Filter,
  FolderOpen,
  LockKeyhole,
  Mail,
  MoreHorizontal,
  Plus,
  Printer,
  RotateCcw,
  ScanLine,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { plans } from "@/config/plans";
import { productConfig } from "@/config/product";
import { DEMO_RESUME_ID, demoScans } from "@/data/demo";
import {
  getBrowserSupabase,
  isSupabaseConfigured,
} from "@/lib/auth/client";
import {
  DemoRepository,
  type DemoJobTarget,
} from "@/lib/repositories/demo";
import { SupabaseRepository } from "@/lib/repositories/supabase";
import { cn, formatDate } from "@/lib/utils";
import type { ResumeLibraryItem } from "@/lib/workspace-data";
import type { ResumeVersion, ScanSummary } from "@/types/domain";

const fieldClass =
  "min-h-11 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3.5 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[color:rgba(14,107,73,.13)]";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className={cn("text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl", eyebrow && "mt-2")}>{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </div>
      {action}
    </header>
  );
}

function WorkspacePage({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1450px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">{children}</div>;
}

function usePersistedDemoScans(initialScans: ScanSummary[]) {
  const [scans, setScans] = useState(initialScans);

  useEffect(() => {
    if (isSupabaseConfigured()) return;
    let active = true;
    void new DemoRepository().listScans().then((saved) => {
      if (active) setScans(saved);
    });
    return () => {
      active = false;
    };
  }, [initialScans]);

  return scans;
}

export function HistoryPage({ scans }: { scans: ScanSummary[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const persistedScans = usePersistedDemoScans(scans);
  const filtered = useMemo(() => {
    const items = persistedScans.filter((scan) => {
      const matchesQuery = `${scan.resumeName} ${scan.targetRole} ${scan.company ?? ""}`.toLowerCase().includes(query.toLowerCase());
      return matchesQuery && (status === "all" || scan.status === status);
    });
    return [...items].sort((left, right) => {
      if (sort === "score") return right.overallScore - left.overallScore;
      if (sort === "oldest") return left.createdAt.localeCompare(right.createdAt);
      return right.createdAt.localeCompare(left.createdAt);
    });
  }, [persistedScans, query, sort, status]);

  return (
    <WorkspacePage>
      <PageHeader
        eyebrow="Reports"
        title="Scan history"
        description="Review prior analyses, compare targets, and reopen the evidence behind each score."
        action={<Button asChild><Link href="/app/scan"><Plus className="size-4" /> New scan</Link></Button>}
      />
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-[var(--text-muted)]" />
          <span className="sr-only">Search scans</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resume, role, or company" className={`${fieldClass} pl-10`} />
        </label>
        <label className="relative">
          <span className="sr-only">Filter status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${fieldClass} min-w-40 appearance-none pr-9`}>
            <option value="all">All statuses</option>
            <option value="complete">Complete</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
          <Filter className="pointer-events-none absolute right-3.5 top-3.5 size-4 text-[var(--text-muted)]" />
        </label>
        <label className="relative">
          <span className="sr-only">Sort scans</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className={`${fieldClass} min-w-40 appearance-none pr-9`}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="score">Highest score</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-3.5 size-4 text-[var(--text-muted)]" />
        </label>
      </div>
      <p className="mt-5 text-xs font-bold text-[var(--text-muted)]">{filtered.length} scan{filtered.length === 1 ? "" : "s"}</p>
      {filtered.length ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          {filtered.map((scan) => (
            <article key={scan.id} className="grid gap-4 border-b border-[var(--border)] p-4 last:border-0 hover:bg-[var(--surface-muted)]/45 sm:grid-cols-[minmax(0,1fr)_100px_120px_44px] sm:items-center sm:px-5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--success-soft)] text-[var(--primary)]"><FileText className="size-5" /></span>
                <div className="min-w-0">
                  <Link href={`/app/scans/${scan.id}`} className="truncate font-extrabold hover:text-[var(--primary)]">{scan.resumeName}</Link>
                  <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{scan.targetRole}{scan.company ? ` · ${scan.company}` : ""} · {formatDate(scan.createdAt)}</p>
                </div>
              </div>
              <div><span className="text-xl font-extrabold">{scan.overallScore}</span><span className="text-xs text-[var(--text-muted)]"> /100</span></div>
              <span className="w-fit rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[11px] font-bold capitalize text-[var(--primary)]">{scan.status}</span>
              <Link href={`/app/scans/${scan.id}`} aria-label={`Open ${scan.resumeName}`} className="grid size-10 place-items-center rounded-full hover:bg-[var(--surface-strong)]"><ChevronRight className="size-4" /></Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 grid min-h-72 place-items-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-white text-center">
          <div><FolderOpen className="mx-auto size-8 text-[var(--text-muted)]" /><h2 className="mt-3 font-extrabold">No scans match</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Try a different search or clear the filter.</p><Button variant="secondary" size="sm" className="mt-4" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Button></div>
        </div>
      )}
    </WorkspacePage>
  );
}

export function ResumesPage({ resumes }: { resumes: ResumeLibraryItem[] }) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [visibleResumes, setVisibleResumes] = useState(resumes);

  useEffect(() => {
    const demoResume = resumes.find((resume) => resume.isDemo);
    if (!demoResume) return;
    let active = true;
    const repository = new DemoRepository();
    void Promise.all([
      repository.listVersions(demoResume.id),
      repository.listScans(),
    ]).then(async ([versions, scans]) => {
      if (!active) return;
      const latestScore = versions[0]?.score ?? null;
      const oldestScore = versions.at(-1)?.score ?? null;
      const seededScanIds = new Set(demoScans.map((scan) => scan.id));
      const localScans = scans.filter((scan) => !seededScanIds.has(scan.id));
      const localBundles = (
        await Promise.all(
          localScans.map((scan) => repository.getScanBundle(scan.id)),
        )
      ).filter((bundle) => bundle !== null);
      const latestByResume = new Map<
        string,
        (typeof localBundles)[number]
      >();
      for (const bundle of localBundles) {
        if (!latestByResume.has(bundle.resumeId)) {
          latestByResume.set(bundle.resumeId, bundle);
        }
      }
      const localItems = await Promise.all(
        [...latestByResume.values()].map(async (bundle): Promise<ResumeLibraryItem> => {
          const localVersions = await repository.listVersions(bundle.resumeId);
          const latest =
            localVersions[0]?.score ?? bundle.summary.overallScore;
          const oldest = localVersions.at(-1)?.score ?? latest;
          return {
            id: bundle.resumeId,
            name: bundle.summary.resumeName,
            updatedAt:
              localVersions[0]?.createdAt ?? bundle.summary.createdAt,
            versionCount: Math.max(1, localVersions.length),
            latestScore: latest,
            scoreChange: latest - oldest,
            isDemo: true,
          };
        }),
      );
      if (!active) return;
      setVisibleResumes([
        {
          ...demoResume,
          versionCount: versions.length,
          updatedAt: versions[0]?.createdAt ?? demoResume.updatedAt,
          latestScore,
          scoreChange:
            latestScore === null || oldestScore === null
              ? null
              : latestScore - oldestScore,
        },
        ...localItems,
      ]);
    });
    return () => {
      active = false;
    };
  }, [resumes]);

  return (
    <WorkspacePage>
      <PageHeader
        eyebrow="Library"
        title="Resumes"
        description="Keep role-specific versions together without overwriting the evidence behind an earlier report."
        action={<Button asChild><Link href="/app/scan"><FilePlus2 className="size-4" /> Add resume</Link></Button>}
      />
      {visibleResumes.length ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {visibleResumes.map((resume) => (
            <article key={resume.id} className="rounded-[22px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--success-soft)] text-[var(--primary)]"><FileText className="size-6" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-extrabold">{resume.name}</h2>
                        {resume.isDemo ? <span className="rounded-full bg-[var(--success-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--primary)]">Demo</span> : null}
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{resume.versionCount} version{resume.versionCount === 1 ? "" : "s"} · Updated {formatDate(resume.updatedAt)}</p>
                    </div>
                    <div className="relative">
                      <button onClick={() => setMenuOpen(menuOpen === resume.id ? null : resume.id)} aria-expanded={menuOpen === resume.id} aria-label={`Actions for ${resume.name}`} className="grid size-9 place-items-center rounded-full hover:bg-[var(--surface-muted)]"><MoreHorizontal className="size-4" /></button>
                      {menuOpen === resume.id && (
                        <div className="absolute right-0 top-10 z-10 w-44 rounded-xl border border-[var(--border)] bg-white p-1.5 shadow-[var(--shadow-lg)]">
                          <Link href={`/app/resumes/${resume.id}`} onClick={() => setMenuOpen(null)} className="block rounded-lg px-3 py-2 text-xs font-bold hover:bg-[var(--surface-muted)]">View versions</Link>
                          <Link href={`/app/scan?resumeId=${encodeURIComponent(resume.id)}`} onClick={() => setMenuOpen(null)} className="block rounded-lg px-3 py-2 text-xs font-bold hover:bg-[var(--surface-muted)]">Scan new version</Link>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 flex items-center gap-5 border-t border-[var(--border)] pt-4">
                    <div><strong className="text-xl">{resume.latestScore ?? "—"}</strong><p className="text-[11px] text-[var(--text-muted)]">Latest score</p></div>
                    <div><strong className="text-xl text-[var(--primary)]">{resume.scoreChange === null ? "—" : `${resume.scoreChange >= 0 ? "+" : ""}${resume.scoreChange}`}</strong><p className="text-[11px] text-[var(--text-muted)]">Since v1</p></div>
                    <Button asChild variant="ghost" size="sm" className="ml-auto"><Link href={`/app/resumes/${resume.id}`}>Open <ArrowRight className="size-3.5" /></Link></Button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          <Link href="/app/scan" className="grid min-h-48 place-items-center rounded-[22px] border border-dashed border-[var(--border-strong)] bg-white p-6 text-center hover:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]">
            <span><Plus className="mx-auto size-7 text-[var(--primary)]" /><strong className="mt-3 block text-sm">Add another resume</strong><span className="mt-1 block text-xs text-[var(--text-muted)]">Plan limits are checked when the scan is saved</span></span>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid min-h-72 place-items-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-white p-7 text-center">
          <div><FileText className="mx-auto size-8 text-[var(--text-muted)]" /><h2 className="mt-3 font-extrabold">No saved resumes yet</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Your first completed scan will create an immutable resume version.</p><Button asChild className="mt-5"><Link href="/app/scan">Start a scan</Link></Button></div>
        </div>
      )}
    </WorkspacePage>
  );
}

export function ResumeDetailPage({
  resumeId,
  resumeName,
  versions,
  isDemo,
}: {
  resumeId: string;
  resumeName: string;
  versions: ResumeVersion[];
  isDemo: boolean;
}) {
  const [savedVersions, setSavedVersions] = useState(versions);
  const [selected, setSelected] = useState(versions[0]?.id ?? "");
  const current = savedVersions.find((version) => version.id === selected) ?? savedVersions[0];
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!isDemo) return;
    let active = true;
    void new DemoRepository().listVersions(resumeId).then((items) => {
      if (!active || items.length === 0) return;
      setSavedVersions(items);
      setSelected((value) =>
        items.some((item) => item.id === value) ? value : items[0]!.id,
      );
    });
    return () => {
      active = false;
    };
  }, [isDemo, resumeId]);

  async function restoreVersion() {
    if (!current || restoring) return;
    setRestoring(true);
    setRestoreMessage(null);
    setRestoreError(null);
    const version: ResumeVersion = {
      id: crypto.randomUUID(),
      version: Math.max(0, ...savedVersions.map((item) => item.version)) + 1,
      name: `${current.name} — restored`,
      content: current.content,
      source: "restore",
      changeSummary: `Restored from version ${current.version}`,
      createdAt: new Date().toISOString(),
    };
    try {
      const client = getBrowserSupabase();
      if (client) {
        await new SupabaseRepository(client).saveVersion(resumeId, version);
      } else {
        await new DemoRepository().saveVersion(resumeId, version);
      }
      setSavedVersions((items) => [version, ...items]);
      setSelected(version.id);
      setRestoreMessage(`Version ${version.version} was created without changing the source version.`);
    } catch (error) {
      setRestoreError(error instanceof Error ? error.message : "The version could not be restored.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <WorkspacePage>
      <PageHeader
        eyebrow="Resume"
        title={resumeName}
        description="An immutable version history. Restoring creates a new version and keeps previous scan evidence intact."
        action={<Button asChild><Link href={`/app/scan?resumeId=${encodeURIComponent(resumeId)}`}><Plus className="size-4" /> Scan new version</Link></Button>}
      />
      {isDemo ? <p className="mt-5 w-fit rounded-full bg-[var(--success-soft)] px-3 py-1.5 text-xs font-bold text-[var(--primary)]">Demonstration resume</p> : null}
      {restoreMessage && <div className="mt-5 flex items-center gap-3 rounded-xl bg-[var(--success-soft)] px-4 py-3 text-sm font-bold text-[var(--primary)]" role="status"><CheckCircle2 className="size-4" /> {restoreMessage}<button className="ml-auto text-xs underline" onClick={() => setRestoreMessage(null)}>Dismiss</button></div>}
      {restoreError && <div className="mt-5 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-bold text-[var(--danger)]" role="alert">{restoreError}</div>}
      <div className="mt-8 grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <h2 className="text-sm font-extrabold">Version history</h2>
          <div className="mt-3 space-y-2">
            {savedVersions.map((version) => (
              <button
                key={version.id}
                onClick={() => setSelected(version.id)}
                className={cn("w-full rounded-xl border p-3 text-left", selected === version.id ? "border-[var(--primary)] bg-[var(--success-soft)]" : "border-[var(--border)] bg-white hover:border-[var(--border-strong)]")}
                aria-pressed={selected === version.id}
              >
                <div className="flex items-center justify-between"><strong className="text-sm">Version {version.version}</strong>{version.score && <span className="text-xs font-extrabold">{version.score}/100</span>}</div>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">{formatDate(version.createdAt)} · {version.source}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{version.changeSummary}</p>
              </button>
            ))}
          </div>
        </aside>
        <section className="min-w-0">
          {current ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div><h2 className="font-extrabold">{current.name}</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Version {current.version} · {formatDate(current.createdAt)}</p></div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => void restoreVersion()} disabled={restoring}><RotateCcw className="size-3.5" /> {restoring ? "Restoring…" : "Restore"}</Button>
                  <Button asChild size="sm"><Link href={`/app/compare?resumeId=${encodeURIComponent(resumeId)}`}>Compare</Link></Button>
                </div>
              </div>
              <div className="mt-5 max-h-[720px] overflow-auto rounded-xl border border-[var(--border)] bg-[#fffefb] p-8 font-serif text-[13px] leading-6 shadow-[var(--shadow-sm)] whitespace-pre-wrap">{current.content}</div>
            </>
          ) : <p>No saved versions.</p>}
        </section>
      </div>
    </WorkspacePage>
  );
}

export function JobsPage() {
  const [jobs, setJobs] = useState<DemoJobTarget[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const client = getBrowserSupabase();
      if (!client) return new DemoRepository().listJobs();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return [];
      const { data, error: loadError } = await client
        .from("job_descriptions")
        .select("id,title,company,content,updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (loadError) throw new Error("Job targets could not be loaded.");
      return (data ?? []).map((job) => ({
        id: String(job.id),
        title: String(job.title),
        company: job.company ? String(job.company) : "Company not set",
        content: String(job.content),
        status: "Saved" as const,
        updatedAt: String(job.updated_at),
        coverage: null,
      }));
    })()
      .then((items) => {
        if (active) setJobs(items);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Job targets could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function addJob() {
    if (!title.trim() || !description.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const client = getBrowserSupabase();
      let saved: DemoJobTarget;
      if (client) {
        const {
          data: { user },
          error: userError,
        } = await client.auth.getUser();
        if (userError || !user) throw new Error("Sign in again to save this job target.");
        const { data, error: saveError } = await client
          .from("job_descriptions")
          .insert({
            user_id: user.id,
            title: title.trim(),
            company: company.trim() || null,
            content: description.trim(),
          })
          .select("id,title,company,content,updated_at")
          .single();
        if (saveError || !data) throw new Error("The live job target could not be saved.");
        saved = {
          id: String(data.id),
          title: String(data.title),
          company: data.company ? String(data.company) : "Company not set",
          content: String(data.content),
          status: "Saved",
          updatedAt: String(data.updated_at),
          coverage: null,
        };
      } else {
        saved = {
          id: crypto.randomUUID(),
          title: title.trim(),
          company: company.trim() || "Company not set",
          content: description.trim(),
          status: "Saved",
          updatedAt: new Date().toISOString(),
          coverage: null,
        };
        await new DemoRepository().saveJob(saved);
      }
      setJobs((items) => [saved, ...items]);
      setTitle("");
      setCompany("");
      setDescription("");
      setOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The job target could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspacePage>
      <PageHeader eyebrow="Role library" title="Job targets" description="Save requirements once, then compare how each resume version covers the role." action={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Add job</Button>} />
      {error ? <p role="alert" className="mt-5 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-bold text-[var(--danger)]">{error}</p> : null}
      <div className="mt-8 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-white">
        {loading ? <p className="p-7 text-center text-sm font-bold text-[var(--text-muted)]">Loading job targets…</p> : null}
        {!loading && jobs.length === 0 ? <div className="p-8 text-center"><BriefcaseBusiness className="mx-auto size-7 text-[var(--text-muted)]" /><h2 className="mt-3 font-extrabold">No saved job targets</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Add a description once, then reuse its evidence requirements in a scan.</p></div> : null}
        {jobs.map((job) => (
          <article key={job.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_180px_100px] sm:items-center">
            <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--info-soft)] text-[var(--info)]"><BriefcaseBusiness className="size-5" /></span><div><h2 className="font-extrabold">{job.title}</h2><p className="mt-1 text-xs text-[var(--text-muted)]">{job.company} · Updated {formatDate(job.updatedAt)}</p></div></div>
            <div><div className="flex justify-between text-[11px] font-bold"><span>Requirement coverage</span><span>{job.coverage === null ? "Not scanned" : `${job.coverage}%`}</span></div><div className="mt-2 h-1.5 rounded-full bg-[var(--surface-strong)]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${job.coverage ?? 0}%` }} /></div></div>
            <Button asChild variant="ghost" size="sm"><Link href="/app/scan">Use in scan <ArrowRight className="size-3.5" /></Link></Button>
          </article>
        ))}
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-[#0d1e16]/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[80] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[22px] bg-white p-6 shadow-[var(--shadow-lg)] outline-none">
            <div className="flex items-start justify-between"><div><Dialog.Title id="add-job-title" className="text-xl font-extrabold">Add job target</Dialog.Title><Dialog.Description className="mt-1 text-sm text-[var(--text-muted)]">Save a role for future comparisons.</Dialog.Description></div><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close"><X className="size-4" /></Button></Dialog.Close></div>
            <label className="mt-6 block text-sm font-bold">Role title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className={`${fieldClass} mt-2`} /></label>
            <label className="mt-4 block text-sm font-bold">Company<input value={company} onChange={(event) => setCompany(event.target.value)} className={`${fieldClass} mt-2`} /></label>
            <label className="mt-4 block text-sm font-bold">Job description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={7} className={`${fieldClass} mt-2 h-auto py-3`} placeholder="Paste the responsibilities and requirements you want to compare." /></label>
            <div className="mt-6 flex justify-end gap-2"><Dialog.Close asChild><Button variant="secondary" disabled={busy}>Cancel</Button></Dialog.Close><Button disabled={!title.trim() || !description.trim() || busy} onClick={() => void addJob()}>{busy ? "Saving…" : "Save job"}</Button></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </WorkspacePage>
  );
}

export function ComparePage({ versions }: { versions: ResumeVersion[] }) {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("resumeId");
  const [availableVersions, setAvailableVersions] = useState(versions);
  const [left, setLeft] = useState(versions.at(-1)?.id ?? "");
  const [right, setRight] = useState(versions[0]?.id ?? "");
  const [view, setView] = useState<"changes" | "scores">("changes");

  useEffect(() => {
    if (!resumeId) return;
    let active = true;
    const loadVersions = async () => {
      const client = getBrowserSupabase();
      if (!client) return new DemoRepository().listVersions(resumeId);
      const { data, error } = await client
        .from("resume_versions")
        .select("id,version_number,name,content,source,change_summary,created_at,score")
        .eq("resume_id", resumeId)
        .order("version_number", { ascending: false });
      if (error) return [];
      return (data ?? []).map((row) => ({
        id: String(row.id),
        version: Number(row.version_number),
        name: String(row.name),
        content: String(row.content),
        source: row.source as ResumeVersion["source"],
        changeSummary: String(row.change_summary),
        createdAt: String(row.created_at),
        score: row.score === null ? undefined : Number(row.score),
      }));
    };
    void loadVersions().then((saved) => {
      if (!active || saved.length === 0) return;
      setAvailableVersions(saved);
      setLeft(saved.at(-1)?.id ?? "");
      setRight(saved[0]?.id ?? "");
    });
    return () => {
      active = false;
    };
  }, [resumeId]);

  const leftVersion = availableVersions.find((item) => item.id === left);
  const rightVersion = availableVersions.find((item) => item.id === right);
  const scoreGain =
    leftVersion?.score === undefined || rightVersion?.score === undefined
      ? null
      : rightVersion.score - leftVersion.score;
  if (availableVersions.length === 0) {
    return (
      <WorkspacePage>
        <PageHeader eyebrow="Versioning" title="Compare versions" description="See what changed without overwriting the evidence behind an earlier scan." />
        <div className="mt-8 grid min-h-72 place-items-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-white p-7 text-center">
          <div><FileDiff className="mx-auto size-8 text-[var(--text-muted)]" /><h2 className="mt-3 font-extrabold">No versions to compare</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Complete a scan, then create or restore another version.</p><Button asChild className="mt-5"><Link href="/app/scan">Start a scan</Link></Button></div>
        </div>
      </WorkspacePage>
    );
  }
  return (
    <WorkspacePage>
      <PageHeader eyebrow="Versioning" title="Compare versions" description="See what changed, how the evidence moved, and which score differences are estimates." />
      <div className="mt-7 grid gap-4 sm:grid-cols-[1fr_44px_1fr] sm:items-end">
        <label className="text-sm font-bold">Baseline version<select value={left} onChange={(event) => setLeft(event.target.value)} className={`${fieldClass} mt-2`}>{availableVersions.map((version) => <option key={version.id} value={version.id}>Version {version.version} · {formatDate(version.createdAt)}</option>)}</select></label>
        <FileDiff className="mx-auto mb-3 hidden size-5 text-[var(--text-muted)] sm:block" />
        <label className="text-sm font-bold">Comparison version<select value={right} onChange={(event) => setRight(event.target.value)} className={`${fieldClass} mt-2`}>{availableVersions.map((version) => <option key={version.id} value={version.id}>Version {version.version} · {formatDate(version.createdAt)}</option>)}</select></label>
      </div>
      <div className="mt-7 flex items-center justify-between border-y border-[var(--border)] py-5">
        <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Overall score change</p><p className={cn("mt-1 text-3xl font-extrabold", scoreGain === null ? "text-[var(--warning)]" : scoreGain >= 0 ? "text-[var(--primary)]" : "text-[var(--danger)]")}>{scoreGain === null ? "Pending rescan" : `${scoreGain >= 0 ? "+" : ""}${scoreGain}`}</p></div>
        <div className="flex rounded-full bg-[var(--surface-strong)] p-1">
          {(["changes", "scores"] as const).map((item) => <button key={item} onClick={() => setView(item)} className={cn("rounded-full px-4 py-2 text-xs font-bold capitalize", view === item ? "bg-white shadow-sm" : "text-[var(--text-muted)]")} aria-pressed={view === item}>{item}</button>)}
        </div>
      </div>
      {view === "changes" ? (
        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          {[leftVersion, rightVersion].map((version, index) => <section key={version?.id ?? index} className="min-w-0"><h2 className="text-sm font-extrabold">Version {version?.version ?? "—"} <span className="ml-2 font-normal text-[var(--text-muted)]">{index === 0 ? "Baseline" : "Current"}</span></h2><div className={cn("mt-3 max-h-[600px] overflow-auto rounded-xl border bg-[#fffefb] p-7 font-serif text-[12px] leading-6 whitespace-pre-wrap", index === 1 ? "border-[var(--primary)]" : "border-[var(--border)]")}>{version?.content}</div></section>)}
        </div>
      ) : scoreGain === null ? (
        <div className="mt-7 rounded-2xl border border-dashed border-[var(--border-strong)] bg-white p-7 text-center">
          <ScanLine className="mx-auto size-7 text-[var(--warning)]" />
          <h2 className="mt-3 font-extrabold">The revised version is not scored yet</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Run a new scan before comparing score dimensions. The text comparison remains available now.</p>
          <Button asChild className="mt-5"><Link href="/app/scan">Rescan revised version</Link></Button>
        </div>
      ) : (
        <div className="mt-7 rounded-2xl border border-[var(--border)] bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Saved overall scores</p>
          <div className="mt-4 flex items-baseline gap-4">
            <span className="text-2xl font-bold text-[var(--text-muted)]">{leftVersion?.score ?? "—"}</span>
            <ArrowRight className="size-4" />
            <span className="text-3xl font-extrabold text-[var(--primary)]">{rightVersion?.score ?? "—"}</span>
          </div>
          <p className="mt-4 max-w-2xl text-xs leading-5 text-[var(--text-secondary)]">Dimension-level changes belong to immutable scan results, not editable resume versions. Rescan a revised version to create a comparable dimension snapshot.</p>
        </div>
      )}
      <p className="mt-5 text-xs leading-5 text-[var(--text-muted)]">Score changes use {productConfig.name}’s deterministic heuristics. They do not guarantee ATS acceptance or a hiring outcome.</p>
    </WorkspacePage>
  );
}

export function ReportsPage({ scans }: { scans: ScanSummary[] }) {
  const [notice, setNotice] = useState<string | null>(null);
  const liveSharingAvailable = isSupabaseConfigured();
  const persistedScans = usePersistedDemoScans(scans);
  async function exportPdf(scanId: string) {
    setNotice("Preparing the accessible PDF report…");
    try {
      let href = `/api/reports/export?scanId=${encodeURIComponent(scanId)}`;
      let objectUrl: string | null = null;
      if (!liveSharingAvailable) {
        const result = await new DemoRepository().getScan(scanId);
        if (!result) throw new Error("The saved demo report could not be loaded.");
        const response = await fetch("/api/reports/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scanId, result }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            payload?.error ?? "The PDF report could not be created.",
          );
        }
        objectUrl = URL.createObjectURL(await response.blob());
        href = objectUrl;
      }
      const link = document.createElement("a");
      link.href = href;
      link.download = "";
      document.body.append(link);
      link.click();
      link.remove();
      if (objectUrl) {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
      }
      setNotice("The PDF download was requested. It contains selectable report text and score context.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "The PDF report could not be created.",
      );
    }
  }
  return (
    <WorkspacePage>
      <PageHeader eyebrow="Exports" title="Reports" description="Create a print-ready copy of any completed analysis, or reopen the live evidence workspace." />
      {notice && <div role="status" className="mt-5 flex items-start gap-3 rounded-xl bg-[var(--info-soft)] px-4 py-3 text-sm text-[#354fba]"><CheckCircle2 className="mt-0.5 size-4" />{notice}<button className="ml-auto" onClick={() => setNotice(null)} aria-label="Dismiss"><X className="size-4" /></button></div>}
      {persistedScans.length ? (
        <div className="mt-8 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-white">
          {persistedScans.slice(0, 4).map((scan) => (
            <article key={scan.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--violet-soft)] text-[var(--violet)]"><BarChart3 className="size-5" /></span>
              <div className="min-w-0 flex-1"><h2 className="font-extrabold">{scan.targetRole} report</h2><p className="mt-1 text-xs text-[var(--text-muted)]">{scan.resumeName} · {formatDate(scan.createdAt)} · Score {scan.overallScore}</p></div>
              <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => void exportPdf(scan.id)}><Printer className="size-3.5" /> Export PDF</Button><Button asChild size="sm"><Link href={`/app/scans/${scan.id}`}>Open</Link></Button></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-[var(--border-strong)] bg-white p-8 text-center">
          <BarChart3 className="mx-auto size-7 text-[var(--primary)]" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-extrabold">No reports yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            Complete a scan to create an evidence report and selectable-text PDF export.
          </p>
          <Button asChild className="mt-5">
            <Link href="/app/scan">Start a scan</Link>
          </Button>
        </div>
      )}
      <div className="mt-7 rounded-2xl border border-dashed border-[var(--border-strong)] bg-white p-5">
        <div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 size-5 text-[var(--primary)]" /><div><h2 className="text-sm font-extrabold">{liveSharingAvailable ? "Private sharing is available in each report" : "Private share links need live mode"}</h2><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{liveSharingAvailable ? "Open a report and use Export & share to create or revoke a high-entropy link. New links expire after seven days." : "Demo reports stay on this device. Configure Supabase to create revocable, high-entropy links with a seven-day default expiry."}</p></div></div>
      </div>
    </WorkspacePage>
  );
}

export function BillingPage() {
  const [annual, setAnnual] = useState(false);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState("free");
  const [usage, setUsage] = useState({
    used: 1,
    limit: 3,
    periodEnd: "2026-08-01T00:00:00.000Z",
  });
  const [billingNotice, setBillingNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const client = getBrowserSupabase();
    if (!client) return;
    void (async () => {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return;
      const { data } = await client
        .from("subscriptions")
        .select("plan,scans_used,scan_limit,current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) return;
      setCurrentPlanId(String(data.plan ?? "free"));
      setUsage({
        used: Number(data.scans_used ?? 0),
        limit: Number(data.scan_limit ?? 3),
        periodEnd: String(data.current_period_end),
      });
    })();
  }, []);

  async function startCheckout(
    planId: "pro" | "career" | "teams",
    planName: string,
  ) {
    setBusyPlan(planId);
    setBillingNotice(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          planId,
          billingPeriod: annual ? "annual" : "monthly",
        }),
      });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
        code?: string;
      };
      if (!response.ok || !result.url) {
        setBillingNotice({
          title:
            result.code === "BILLING_NOT_CONFIGURED"
              ? "Checkout is not configured"
              : "Checkout could not start",
          message:
            result.error ??
            `No checkout was created for ${planName}. No payment was attempted.`,
        });
        return;
      }
      window.location.assign(result.url);
    } catch {
      setBillingNotice({
        title: "Checkout could not start",
        message:
          "The billing service could not be reached. No payment was attempted.",
      });
    } finally {
      setBusyPlan(null);
    }
  }

  async function openBillingPortal() {
    setBusyPlan("portal");
    setBillingNotice(null);
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
      });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url) {
        setBillingNotice({
          title: "Billing portal could not open",
          message:
            result.error ??
            "No billing-management session was created. No account change occurred.",
        });
        return;
      }
      window.location.assign(result.url);
    } catch {
      setBillingNotice({
        title: "Billing portal could not open",
        message:
          "The billing service could not be reached. No account change occurred.",
      });
    } finally {
      setBusyPlan(null);
    }
  }

  const currentPlan =
    plans.find((plan) => plan.id === currentPlanId) ?? plans[0];

  return (
    <WorkspacePage>
      <PageHeader
        eyebrow="Account"
        title="Plan and billing"
        description="Review configured plan limits. Checkout activates only when the live account, Stripe prices, and server-side billing credentials are available."
        action={
          currentPlanId !== "free" ? (
            <Button
              variant="secondary"
              onClick={() => void openBillingPortal()}
              disabled={busyPlan !== null}
            >
              {busyPlan === "portal" ? "Opening portal…" : "Manage billing"}
            </Button>
          ) : undefined
        }
      />
      <div className="mt-7 flex items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div><p className="text-sm font-extrabold">{currentPlan?.name ?? "Free"} plan</p><p className="mt-1 text-xs text-[var(--text-muted)]">{usage.used} of {usage.limit} scans used this period · resets {formatDate(usage.periodEnd)}</p></div>
        <div className="flex rounded-full bg-[var(--surface-strong)] p-1" aria-label="Billing cadence">
          <button onClick={() => setAnnual(false)} className={cn("rounded-full px-4 py-2 text-xs font-bold", !annual ? "bg-white shadow-sm" : "text-[var(--text-muted)]")} aria-pressed={!annual}>Monthly</button>
          <button onClick={() => setAnnual(true)} className={cn("rounded-full px-4 py-2 text-xs font-bold", annual ? "bg-white shadow-sm" : "text-[var(--text-muted)]")} aria-pressed={annual}>Annual</button>
        </div>
      </div>
      <div className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const price = annual ? plan.annualPrice : plan.monthlyPrice;
          const current = plan.id === currentPlanId;
          const downgrade = plan.id === "free" && currentPlanId !== "free";
          return <article key={plan.id} className="flex min-h-[390px] flex-col bg-white p-5">
            <div className="flex items-start justify-between gap-3"><div><h2 className="font-extrabold">{plan.name}</h2><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{plan.description}</p></div>{plan.recommended && <span className="rounded-full bg-[var(--success-soft)] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[var(--primary)]">Popular</span>}</div>
            <p className="mt-5"><span className="text-3xl font-extrabold">${price}</span><span className="text-xs text-[var(--text-muted)]">/{annual ? "year" : "month"}</span></p>
            <p className="mt-3 text-xs font-bold">{plan.scans} scans · {plan.resumes} resumes{plan.seats > 1 ? ` · ${plan.seats} seats` : ""}</p>
            <ul className="mt-5 space-y-2.5 text-xs leading-5 text-[var(--text-secondary)]">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-[var(--primary)]" />{feature}</li>)}</ul>
            <Button
              variant={plan.id === "free" ? "secondary" : "primary"}
              className="mt-auto"
              disabled={current || busyPlan !== null}
              onClick={() => {
                if (downgrade) void openBillingPortal();
                else if (plan.id !== "free") void startCheckout(plan.id, plan.name);
              }}
            >
              {current
                ? "Current plan"
                : downgrade
                  ? "Manage downgrade"
                  : busyPlan === plan.id
                  ? "Opening secure checkout…"
                  : `Choose ${plan.name}`}
            </Button>
          </article>;
        })}
      </div>
      <Dialog.Root open={Boolean(billingNotice)} onOpenChange={(nextOpen) => { if (!nextOpen) setBillingNotice(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-[#0d1e16]/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[22px] bg-white p-6 shadow-[var(--shadow-lg)] outline-none">
            <div className="flex items-start gap-3"><AlertTriangle className="mt-1 size-5 text-[var(--warning)]" /><div><Dialog.Title id="billing-dialog-title" className="text-lg font-extrabold">{billingNotice?.title ?? "Billing update"}</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{billingNotice?.message} This interface never simulates a charge or checkout success.</Dialog.Description></div></div>
            <Dialog.Close asChild><Button className="mt-6 w-full">Got it</Button></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </WorkspacePage>
  );
}

interface TeamMember {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Coach" | "Member" | "Viewer";
  status: "Active" | "Invited";
}

const demoTeamMembers: TeamMember[] = [
  { id: "alex", name: "Alex Morgan", email: "demo@resumepilot.local", role: "Owner", status: "Active" },
  { id: "maya", name: "Maya Chen", email: "maya@example.test", role: "Coach", status: "Active" },
];

function teamRoleLabel(role: string): TeamMember["role"] {
  const normalized = role.toLowerCase();
  if (normalized === "owner") return "Owner";
  if (normalized === "admin") return "Admin";
  if (normalized === "coach") return "Coach";
  if (normalized === "member") return "Member";
  return "Viewer";
}

export function TeamPage() {
  const live = isSupabaseConfigured();
  const [members, setMembers] = useState<TeamMember[]>(live ? [] : demoTeamMembers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMember["role"]>("Viewer");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState(live ? "" : "Alex’s demo workspace");
  const [newTeamName, setNewTeamName] = useState("");
  const [loading, setLoading] = useState(live);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!live) {
      const saved = window.localStorage.getItem("resumepilot:demo-team");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { name?: string; members?: TeamMember[] };
          window.setTimeout(() => {
            if (parsed.name) setTeamName(parsed.name);
            if (parsed.members?.length) setMembers(parsed.members);
          }, 0);
        } catch {
          window.localStorage.removeItem("resumepilot:demo-team");
        }
      }
      return;
    }
    let active = true;
    void (async () => {
      const client = getBrowserSupabase();
      if (!client) return;
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) throw new Error("Sign in again to load your team.");
      const { data: teams, error: teamsError } = await client
        .from("teams")
        .select("id,name,owner_id")
        .order("created_at", { ascending: true })
        .limit(1);
      if (teamsError) throw new Error("The team workspace could not be loaded.");
      const team = teams?.[0];
      if (!team) return;
      const [{ data: activeMembers, error: membersError }, { data: invitations, error: invitationsError }] =
        await Promise.all([
          client
            .from("team_members")
            .select("id,user_id,role,status")
            .eq("team_id", team.id),
          client
            .from("team_invitations")
            .select("id,email,role,accepted_at,revoked_at")
            .eq("team_id", team.id)
            .is("accepted_at", null)
            .is("revoked_at", null),
        ]);
      if (membersError || invitationsError) {
        throw new Error("Team membership could not be loaded.");
      }
      const rows: TeamMember[] = (activeMembers ?? []).map((member) => ({
        id: String(member.id),
        userId: String(member.user_id),
        name: String(member.user_id) === user.id ? "You" : `Workspace member ${String(member.user_id).slice(0, 6)}`,
        email: String(member.user_id) === user.id ? user.email ?? "Signed-in account" : "Email is private",
        role: teamRoleLabel(String(member.role)),
        status: "Active",
      }));
      if (!rows.some((member) => member.userId === String(team.owner_id))) {
        rows.unshift({
          id: `owner-${team.owner_id}`,
          userId: String(team.owner_id),
          name: String(team.owner_id) === user.id ? "You" : "Workspace owner",
          email: String(team.owner_id) === user.id ? user.email ?? "Signed-in account" : "Email is private",
          role: "Owner",
          status: "Active",
        });
      }
      rows.push(
        ...(invitations ?? []).map((invitation) => ({
          id: String(invitation.id),
          name: String(invitation.email).split("@")[0] || "Invited member",
          email: String(invitation.email),
          role: teamRoleLabel(String(invitation.role)),
          status: "Invited" as const,
        })),
      );
      if (!active) return;
      setTeamId(String(team.id));
      setTeamName(String(team.name));
      setMembers(rows);
    })()
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "The team could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [live]);

  function persistDemo(next: TeamMember[]) {
    window.localStorage.setItem(
      "resumepilot:demo-team",
      JSON.stringify({ name: teamName, members: next }),
    );
  }

  async function createTeam() {
    if (!live || !newTeamName.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const client = getBrowserSupabase();
      if (!client) throw new Error("Live collaboration is not configured.");
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) throw new Error("Sign in again to create a team.");
      const slugBase =
        newTeamName.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 48) ||
        "workspace";
      const { data: team, error: createError } = await client
        .from("teams")
        .insert({
          owner_id: user.id,
          name: newTeamName.trim(),
          slug: `${slugBase}-${crypto.randomUUID().slice(0, 8)}`,
        })
        .select("id,name")
        .single();
      if (createError || !team) throw new Error("The team could not be created.");
      const { data: member, error: memberError } = await client
        .from("team_members")
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: "owner",
          status: "active",
        })
        .select("id")
        .single();
      if (memberError || !member) throw new Error("The owner membership could not be created.");
      setTeamId(String(team.id));
      setTeamName(String(team.name));
      setMembers([{
        id: String(member.id),
        userId: user.id,
        name: "You",
        email: user.email ?? "Signed-in account",
        role: "Owner",
        status: "Active",
      }]);
      setNewTeamName("");
      setNotice("Team workspace created.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "The team could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function invite() {
    if (!email.includes("@") || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      let member: TeamMember;
      if (live) {
        if (!teamId) throw new Error("Create or join a team before inviting members.");
        const response = await fetch("/api/team/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId,
            email: email.trim().toLowerCase(),
            role: role.toLowerCase(),
          }),
        });
        const payload = (await response.json()) as {
          invitation?: { id: string; email: string; role: string };
          inviteUrl?: string;
          error?: string;
        };
        if (!response.ok || !payload.invitation || !payload.inviteUrl) {
          throw new Error(payload.error ?? "The invitation could not be saved.");
        }
        const data = payload.invitation;
        member = {
          id: String(data.id),
          name: String(data.email).split("@")[0] || "Invited member",
          email: String(data.email),
          role: teamRoleLabel(String(data.role)),
          status: "Invited",
        };
        setInviteUrl(payload.inviteUrl);
        setNotice("Invitation created for seven days. Copy the private link below; no email was sent.");
      } else {
        member = {
          id: crypto.randomUUID(),
          name: email.split("@")[0] || "Invited member",
          email,
          role,
          status: "Invited",
        };
        setInviteUrl(null);
        setNotice("Demo invitation saved in this browser; no email was sent.");
      }
      setMembers((items) => {
        const next = [...items, member];
        if (!live) persistDemo(next);
        return next;
      });
      setEmail("");
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "The invitation could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function updateRole(member: TeamMember, nextRole: TeamMember["role"]) {
    if (member.role === "Owner") return;
    setError(null);
    try {
      if (live) {
        const client = getBrowserSupabase();
        if (!client) throw new Error("Live collaboration is not configured.");
        const table = member.status === "Invited" ? "team_invitations" : "team_members";
        const { error: updateError } = await client
          .from(table)
          .update({ role: nextRole.toLowerCase() })
          .eq("id", member.id);
        if (updateError) throw new Error("The member role could not be updated.");
      }
      setMembers((items) => {
        const next = items.map((item) => item.id === member.id ? { ...item, role: nextRole } : item);
        if (!live) persistDemo(next);
        return next;
      });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "The role could not be updated.");
    }
  }

  async function removeMember(member: TeamMember) {
    if (member.role === "Owner") return;
    setError(null);
    try {
      if (live) {
        const client = getBrowserSupabase();
        if (!client) throw new Error("Live collaboration is not configured.");
        const table = member.status === "Invited" ? "team_invitations" : "team_members";
        const { error: removeError } = await client.from(table).delete().eq("id", member.id);
        if (removeError) throw new Error("The member could not be removed.");
      }
      setMembers((items) => {
        const next = items.filter((item) => item.id !== member.id);
        if (!live) persistDemo(next);
        return next;
      });
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "The member could not be removed.");
    }
  }
  return (
    <WorkspacePage>
      <PageHeader eyebrow="Collaboration" title={teamName || "Team workspace"} description="Review candidate evidence together with explicit permissions. Demo invitations stay in this browser." />
      {notice ? <p role="status" className="mt-5 rounded-xl bg-[var(--success-soft)] px-4 py-3 text-sm font-bold text-[var(--primary)]">{notice}</p> : null}
      {inviteUrl ? (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-white p-3 sm:flex-row sm:items-center">
          <label className="min-w-0 flex-1 text-xs font-bold">
            One-time invitation link
            <input
              readOnly
              value={inviteUrl}
              className={`${fieldClass} mt-1 w-full text-xs`}
            />
          </label>
          <Button
            className="sm:self-end"
            variant="secondary"
            onClick={() => {
              void navigator.clipboard.writeText(inviteUrl).then(() => {
                setNotice("Invitation link copied. It expires after seven days and can be revoked from this workspace.");
              });
            }}
          >
            Copy link
          </Button>
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-5 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-bold text-[var(--danger)]">{error}</p> : null}
      {loading ? <p className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-8 text-center text-sm font-bold text-[var(--text-muted)]">Loading team workspace…</p> : null}
      {!loading && live && !teamId ? (
        <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="font-extrabold">Create a team workspace</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Owners can then manage roles, invitation records, shared data, and billing.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row"><label className="flex-1 text-sm font-bold">Workspace name<input value={newTeamName} onChange={(event) => setNewTeamName(event.target.value)} className={`${fieldClass} mt-2`} /></label><Button className="self-end" disabled={!newTeamName.trim() || busy} onClick={() => void createTeam()}>{busy ? "Creating…" : "Create workspace"}</Button></div>
        </section>
      ) : null}
      {!loading && (!live || teamId) ? <section className="mt-8 grid gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 lg:grid-cols-[minmax(0,1fr)_160px_120px] lg:items-end">
        <label className="text-sm font-bold">Invite by email<div className="relative mt-2"><Mail className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-[var(--text-muted)]" /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="colleague@example.com" className={`${fieldClass} pl-10`} /></div></label>
        <label className="text-sm font-bold">Role<select value={role} onChange={(event) => setRole(event.target.value as TeamMember["role"])} className={`${fieldClass} mt-2`}><option>Admin</option><option>Coach</option><option>Member</option><option>Viewer</option></select></label>
        <Button disabled={!email.includes("@") || busy} onClick={() => void invite()}><UserPlus className="size-4" /> {busy ? "Saving…" : "Invite"}</Button>
      </section> : null}
      {!loading && members.length ? <div className="mt-7 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        {members.map((member) => <div key={member.id} className="grid gap-4 border-b border-[var(--border)] p-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_160px_100px_40px] sm:items-center sm:px-5">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-[var(--surface-strong)] text-xs font-extrabold text-[var(--primary)]">{member.name.split(" ").map((word) => word[0]).slice(0,2).join("").toUpperCase()}</span><div><p className="text-sm font-extrabold">{member.name}</p><p className="text-xs text-[var(--text-muted)]">{member.email}</p></div></div>
          {member.role === "Owner" ? <span className="text-sm font-bold">Owner</span> : <select value={member.role} onChange={(event) => void updateRole(member, event.target.value as TeamMember["role"])} className={`${fieldClass} min-h-9 py-0 text-xs`}><option>Admin</option><option>Coach</option><option>Member</option><option>Viewer</option></select>}
          <span className={cn("w-fit rounded-full px-2.5 py-1 text-[11px] font-bold", member.status === "Active" ? "bg-[var(--success-soft)] text-[var(--primary)]" : "bg-[var(--warning-soft)] text-[#8c5a0d]")}>{member.status}</span>
          {member.role !== "Owner" ? <button onClick={() => void removeMember(member)} aria-label={`Remove ${member.name}`} className="grid size-9 place-items-center rounded-full text-[var(--text-muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"><Trash2 className="size-4" /></button> : <span />}
        </div>)}
      </div> : null}
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="border-l-2 border-[var(--primary)] pl-5"><h2 className="text-sm font-extrabold">Coach</h2><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Can create and edit shared resumes, scans, versions, and comments.</p></div>
        <div className="border-l-2 border-[var(--border-strong)] pl-5"><h2 className="text-sm font-extrabold">Viewer</h2><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Can read shared candidates and reports, but cannot make changes.</p></div>
      </div>
    </WorkspacePage>
  );
}

function SettingsFrame({ active, children }: { active: "profile" | "privacy" | "notifications"; children: React.ReactNode }) {
  const links = [
    { key: "profile", label: "Profile", href: "/app/settings/profile", icon: Users },
    { key: "privacy", label: "Privacy & data", href: "/app/settings/privacy", icon: ShieldCheck },
    { key: "notifications", label: "Notifications", href: "/app/settings/notifications", icon: Bell },
  ] as const;
  return <WorkspacePage><PageHeader eyebrow="Account" title="Settings" description="Manage your profile, privacy choices, and analysis notifications." /><div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,720px)]"><nav aria-label="Settings" className="space-y-1">{links.map((link) => { const Icon = link.icon; return <Link key={link.key} href={link.href} aria-current={active === link.key ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold", active === link.key ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]")}><Icon className="size-4" />{link.label}</Link>; })}</nav><section>{children}</section></div></WorkspacePage>;
}

export function ProfileSettingsPage() {
  const live = isSupabaseConfigured();
  const [name, setName] = useState(live ? "" : "Alex Morgan");
  const [role, setRole] = useState(live ? "" : "Product lead");
  const [email, setEmail] = useState(live ? "Loading verified account…" : "demo@resumepilot.local");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const client = getBrowserSupabase();
    if (!client) {
      const saved = window.localStorage.getItem("resumepilot:demo-profile");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { name?: string; role?: string };
          window.setTimeout(() => {
            if (parsed.name) setName(parsed.name);
            if (parsed.role) setRole(parsed.role);
          }, 0);
        } catch {
          window.localStorage.removeItem("resumepilot:demo-profile");
        }
      }
      return;
    }
    void (async () => {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "Verified account");
      const { data } = await client
        .from("profiles")
        .select("display_name,target_role")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.display_name) setName(String(data.display_name));
      if (data?.target_role) setRole(String(data.target_role));
    })();
  }, []);

  async function saveProfile() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const client = getBrowserSupabase();
      if (!client) {
        window.localStorage.setItem(
          "resumepilot:demo-profile",
          JSON.stringify({ name, role }),
        );
        setMessage("Profile saved on this device.");
        return;
      }
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();
      if (userError || !user) throw new Error("Sign in again to save this profile.");
      const { error: saveError } = await client.from("profiles").upsert({
        id: user.id,
        display_name: name.trim(),
        target_role: role.trim(),
      });
      if (saveError) throw new Error("The live profile could not be saved.");
      setMessage("Profile saved to your live account.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Profile could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsFrame active="profile">
      <h2 className="text-lg font-extrabold">Profile</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Used for your workspace identity, never inside resume analysis.
      </p>
      {message && (
        <p
          role="status"
          className="mt-5 flex items-center gap-2 rounded-xl bg-[var(--success-soft)] px-4 py-3 text-sm font-bold text-[var(--primary)]"
        >
          <CheckCircle2 className="size-4" /> {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-bold text-[var(--danger)]"
        >
          {error}
        </p>
      )}
      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void saveProfile();
        }}
      >
        <label className="block text-sm font-bold">
          Full name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={`${fieldClass} mt-2`}
          />
        </label>
        <label className="block text-sm font-bold">
          Email
          <input
            readOnly
            value={email}
            className={`${fieldClass} mt-2 bg-[var(--surface-muted)] text-[var(--text-muted)]`}
          />
        </label>
        <label className="block text-sm font-bold">
          Current role
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className={`${fieldClass} mt-2`}
          />
        </label>
        <Button type="submit" disabled={!name.trim() || busy}>
          {busy ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </SettingsFrame>
  );
}

export function PrivacySettingsPage() {
  const [retention, setRetention] = useState("30");
  const [autoDeleteUploads, setAutoDeleteUploads] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const live = isSupabaseConfigured();

  useEffect(() => {
    const client = getBrowserSupabase();
    if (!client) {
      const saved = window.localStorage.getItem("resumepilot:privacy-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as {
            retention?: number;
            autoDeleteUploads?: boolean;
            analyticsOptIn?: boolean;
          };
          window.setTimeout(() => {
            if (parsed.retention) setRetention(String(parsed.retention));
            setAutoDeleteUploads(Boolean(parsed.autoDeleteUploads));
            setAnalyticsOptIn(Boolean(parsed.analyticsOptIn));
          }, 0);
        } catch {
          window.localStorage.removeItem("resumepilot:privacy-settings");
        }
      }
      return;
    }
    void (async () => {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return;
      const { data } = await client
        .from("privacy_settings")
        .select("retention_days,auto_delete_uploads,analytics_opt_in")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) return;
      setRetention(String(data.retention_days ?? 365));
      setAutoDeleteUploads(Boolean(data.auto_delete_uploads));
      setAnalyticsOptIn(Boolean(data.analytics_opt_in));
    })();
  }, []);

  async function savePrivacy() {
    setBusy(true);
    setMessage(null);
    setError(null);
    const settings = {
      retention: Number(retention),
      autoDeleteUploads,
      analyticsOptIn,
    };
    try {
      const client = getBrowserSupabase();
      if (!client) {
        window.localStorage.setItem(
          "resumepilot:privacy-settings",
          JSON.stringify(settings),
        );
        setMessage("Privacy preferences saved on this device.");
        return;
      }
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();
      if (userError || !user) throw new Error("Sign in again to save these settings.");
      const { error: saveError } = await client.from("privacy_settings").upsert({
        user_id: user.id,
        retention_days: settings.retention,
        auto_delete_uploads: autoDeleteUploads,
        analytics_opt_in: analyticsOptIn,
      });
      if (saveError) throw new Error("Live privacy preferences could not be saved.");
      setMessage("Privacy preferences saved to your live account.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Privacy preferences could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function exportData() {
    setError(null);
    if (live) {
      const link = document.createElement("a");
      link.href = "/api/account/export";
      link.download = "";
      document.body.append(link);
      link.click();
      link.remove();
      setMessage("The live account-data download was requested.");
      return;
    }
    const repository = new DemoRepository();
    const payload = JSON.stringify(
      {
        mode: "demo",
        exportedAt: new Date().toISOString(),
        profile: JSON.parse(
          window.localStorage.getItem("resumepilot:demo-profile") ?? "null",
        ),
        privacySettings: JSON.parse(
          window.localStorage.getItem("resumepilot:privacy-settings") ?? "null",
        ),
        scans: await repository.listScans(),
        versions: await repository.listVersions(DEMO_RESUME_ID),
        note: "This export contains browser-local demonstration data.",
      },
      null,
      2,
    );
    const url = URL.createObjectURL(
      new Blob([payload], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${productConfig.slug}-demo-data.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Browser-local demo data exported.");
  }

  async function deleteAccount() {
    if (confirm !== "DELETE") return;
    setBusy(true);
    setError(null);
    try {
      if (live) {
        const response = await fetch("/api/account/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmation: "DELETE" }),
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(result.error ?? "The live account could not be deleted.");
        }
        window.location.assign("/");
        return;
      }
      await new Promise<void>((resolve, reject) => {
        const request = window.indexedDB.deleteDatabase("resumepilot-demo");
        request.onsuccess = () => resolve();
        request.onerror = () =>
          reject(new Error("Browser-local data could not be cleared."));
        request.onblocked = () =>
          reject(
            new Error(
              `Close other open ${productConfig.name} tabs, then try clearing demo data again.`,
            ),
          );
      });
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith("resumepilot:")) window.localStorage.removeItem(key);
      }
      document.cookie =
        "resumepilot_demo=; Path=/; SameSite=Lax; Max-Age=0";
      setDeleteOpen(false);
      setConfirm("");
      setMessage("Browser-local demo data was cleared. No external account existed.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Account deletion could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }

  const toggleClass = (enabled: boolean) =>
    cn(
      "relative h-7 w-12 shrink-0 rounded-full transition",
      enabled ? "bg-[var(--primary)]" : "bg-[var(--border-strong)]",
    );

  return (
    <SettingsFrame active="privacy">
      <h2 className="text-lg font-extrabold">Privacy and data</h2>
      <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
        {live
          ? "These controls update the configured private repository."
          : "Demo data and preferences stay in this browser."}
      </p>
      {message && (
        <p
          role="status"
          className="mt-5 rounded-xl bg-[var(--success-soft)] px-4 py-3 text-sm font-bold text-[var(--primary)]"
        >
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-bold text-[var(--danger)]"
        >
          {error}
        </p>
      )}
      <div className="mt-7 space-y-7">
        <label className="block text-sm font-bold">
          Report retention
          <select
            value={retention}
            onChange={(event) => setRetention(event.target.value)}
            className={`${fieldClass} mt-2 max-w-xs`}
          >
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
            <option value="3650">10 years</option>
          </select>
          <span className="mt-2 block text-xs leading-5 text-[var(--text-muted)]">
            Production retention jobs must honor this stored preference.
          </span>
        </label>
        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          <div className="flex items-start justify-between gap-5 py-5">
            <div>
              <h3 className="text-sm font-extrabold">Delete source uploads after extraction</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                Keep the normalized resume and report, but remove the original stored file.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoDeleteUploads((value) => !value)}
              aria-pressed={autoDeleteUploads}
              className={toggleClass(autoDeleteUploads)}
            >
              <span
                className={cn(
                  "absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform",
                  autoDeleteUploads ? "translate-x-5" : "translate-x-1",
                )}
              />
              <span className="sr-only">Delete source uploads after extraction</span>
            </button>
          </div>
          <div className="flex items-start justify-between gap-5 py-5">
            <div>
              <h3 className="text-sm font-extrabold">Optional product analytics</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                This never includes resume text, job descriptions, names, or provider output.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAnalyticsOptIn((value) => !value)}
              aria-pressed={analyticsOptIn}
              className={toggleClass(analyticsOptIn)}
            >
              <span
                className={cn(
                  "absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform",
                  analyticsOptIn ? "translate-x-5" : "translate-x-1",
                )}
              />
              <span className="sr-only">Allow optional product analytics</span>
            </button>
          </div>
        </div>
        <Button onClick={() => void savePrivacy()} disabled={busy}>
          {busy ? "Saving…" : "Save privacy preferences"}
        </Button>
        <div>
          <h3 className="text-sm font-extrabold">Your data</h3>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => void exportData()}>
              <ArrowDownToLine className="size-4" /> Export my data
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" /> Delete account
            </Button>
          </div>
        </div>
      </div>
      <Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-[#0d1e16]/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[22px] bg-white p-6 shadow-[var(--shadow-lg)] outline-none">
            <Dialog.Title id="delete-title" className="text-xl font-extrabold">
              Delete {live ? "this account" : "browser-local demo data"}?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {live
                ? "Stored files are removed before the live account is hard-deleted."
                : "This clears saved demo scans, versions, drafts, and preferences on this device."}{" "}
              Type DELETE to confirm.
            </Dialog.Description>
            <input
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="DELETE"
              className={`${fieldClass} mt-5`}
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="secondary" onClick={() => setConfirm("")}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                variant="danger"
                disabled={confirm !== "DELETE" || busy}
                onClick={() => void deleteAccount()}
              >
                {busy ? "Deleting…" : "Delete permanently"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </SettingsFrame>
  );
}

export function NotificationSettingsPage() {
  const [settings, setSettings] = useState({
    report: true,
    comments: true,
    marketing: false,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const client = getBrowserSupabase();
    if (!client) {
      const saved = window.localStorage.getItem(
        "resumepilot:notification-settings",
      );
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Partial<typeof settings>;
          window.setTimeout(() => {
            setSettings((value) => ({ ...value, ...parsed }));
          }, 0);
        } catch {
          window.localStorage.removeItem("resumepilot:notification-settings");
        }
      }
      return;
    }
    void (async () => {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return;
      const { data } = await client
        .from("notification_preferences")
        .select("scan_complete,product_updates,team_activity")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setSettings({
          report: Boolean(data.scan_complete),
          comments: Boolean(data.team_activity),
          marketing: Boolean(data.product_updates),
        });
      }
    })();
  }, []);

  const items = [
    { key: "report" as const, label: "Report ready", description: "When a live analysis completes." },
    { key: "comments" as const, label: "Team comments", description: "When a collaborator mentions you." },
    { key: "marketing" as const, label: "Product updates", description: "Occasional feature and research updates." },
  ];

  async function saveNotifications() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const client = getBrowserSupabase();
      if (!client) {
        window.localStorage.setItem(
          "resumepilot:notification-settings",
          JSON.stringify(settings),
        );
        setMessage("Notification preferences saved on this device.");
        return;
      }
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();
      if (userError || !user) throw new Error("Sign in again to save preferences.");
      const { error: saveError } = await client
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          scan_complete: settings.report,
          team_activity: settings.comments,
          product_updates: settings.marketing,
        });
      if (saveError) throw new Error("Live notification preferences could not be saved.");
      setMessage("Notification preferences saved to your live account.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Notification preferences could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsFrame active="notifications">
      <h2 className="text-lg font-extrabold">Notifications</h2>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Choose which account email events matter.
      </p>
      {message && (
        <p
          role="status"
          className="mt-5 flex items-center gap-2 rounded-xl bg-[var(--success-soft)] px-4 py-3 text-sm font-bold text-[var(--primary)]"
        >
          <CheckCircle2 className="size-4" /> {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-bold text-[var(--danger)]"
        >
          {error}
        </p>
      )}
      <div className="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-start justify-between gap-5 py-5"
          >
            <div>
              <h3 className="text-sm font-extrabold">{item.label}</h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {item.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings((value) => ({
                  ...value,
                  [item.key]: !value[item.key],
                }))
              }
              aria-pressed={settings[item.key]}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition",
                settings[item.key]
                  ? "bg-[var(--primary)]"
                  : "bg-[var(--border-strong)]",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform",
                  settings[item.key] ? "translate-x-5" : "translate-x-1",
                )}
              />
              <span className="sr-only">Toggle {item.label}</span>
            </button>
          </div>
        ))}
      </div>
      <Button
        className="mt-6"
        onClick={() => void saveNotifications()}
        disabled={busy}
      >
        {busy ? "Saving…" : "Save preferences"}
      </Button>
    </SettingsFrame>
  );
}
