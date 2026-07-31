"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { TurnstileField } from "@/components/ui/turnstile-field";
import { productConfig } from "@/config/product";
import {
  analysisResultSchema,
  canonicalResumeDocumentSchema,
} from "@/lib/analysis";
import { isSupabaseConfigured } from "@/lib/auth/client";
import { DemoRepository } from "@/lib/repositories/demo";
import { cn } from "@/lib/utils";
import type {
  AnalysisResult,
  CanonicalResumeDocument,
  ScanSummary,
} from "@/types/domain";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"] as const;
const STAGES = [
  { key: "extract", label: "Reading resume structure" },
  { key: "analyze", label: "Checking evidence and clarity" },
  { key: "match", label: "Comparing role requirements" },
  { key: "report", label: "Preparing your report" },
] as const;

type InputMode = "file" | "paste";
type WizardStatus = "editing" | "running" | "failed";

interface ScanDraft {
  inputMode: InputMode;
  pastedResume: string;
  jobDescription: string;
  targetRole: string;
  company: string;
  seniority: string;
  industry: string;
  market: string;
  goal: "ats" | "match" | "general";
}

interface CompletedScan {
  id: string;
  result: AnalysisResult;
  document: CanonicalResumeDocument;
}

const emptyDraft: ScanDraft = {
  inputMode: "file",
  pastedResume: "",
  jobDescription: "",
  targetRole: "",
  company: "",
  seniority: "mid",
  industry: "Technology",
  market: "United States",
  goal: "match",
};

function validateFile(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
    return "Choose a PDF, DOCX, or TXT file.";
  }
  if (file.size > MAX_FILE_SIZE) return "File size must be 8 MiB or less.";
  if (file.size === 0) return "This file is empty.";
  const expectedMime: Record<string, string[]> = {
    pdf: ["application/pdf"],
    docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip"],
    txt: ["text/plain", ""],
  };
  if (!expectedMime[extension]?.includes(file.type)) {
    return `The file contents do not match the .${extension} extension.`;
  }
  return null;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      {hint && <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

const fieldClass =
  "min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[color:rgba(14,107,73,.13)] placeholder:text-[var(--text-muted)]";

export function ScanWizard({
  embedded = false,
  resumeId,
}: {
  embedded?: boolean;
  resumeId?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ScanDraft>(emptyDraft);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<WizardStatus>("editing");
  const [activeStage, setActiveStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [restored, setRestored] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const captchaRequired = Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("resumepilot:scan-draft:v1");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ScanDraft>;
        window.setTimeout(() => {
          setDraft({ ...emptyDraft, ...parsed });
          setRestored(true);
        }, 0);
      }
    } catch {
      window.localStorage.removeItem("resumepilot:scan-draft:v1");
    }
  }, []);

  useEffect(() => {
    if (status === "editing") {
      window.localStorage.setItem("resumepilot:scan-draft:v1", JSON.stringify(draft));
    }
  }, [draft, status]);

  function selectFile(candidate: File | undefined) {
    if (!candidate) return;
    const issue = validateFile(candidate);
    setFileError(issue);
    setFile(issue ? null : candidate);
  }

  function canContinue() {
    if (step === 1) {
      if (draft.inputMode === "file") return Boolean(file && !fileError);
      return draft.pastedResume.trim().length >= 120;
    }
    if (step === 3) {
      return (
        draft.targetRole.trim().length >= 2 &&
        (!captchaRequired || Boolean(captchaToken))
      );
    }
    return true;
  }

  async function parseStream(response: Response): Promise<CompletedScan> {
    if (!response.body) {
      throw new Error("The analysis response did not include a result stream.");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let completed: CompletedScan | null = null;

    function consumeLine(line: string) {
      if (!line.trim()) return;
      const event = JSON.parse(line) as {
        type?: string;
        stage?: string;
        id?: string;
        result?: unknown;
        document?: unknown;
        error?: string;
      };
      if (event.error) throw new Error(event.error);
      if (
        event.type === "result" &&
        event.id &&
        event.result &&
        event.document
      ) {
        completed = {
          id: event.id,
          result: analysisResultSchema.parse(event.result) as AnalysisResult,
          document: canonicalResumeDocumentSchema.parse(
            event.document,
          ) as CanonicalResumeDocument,
        };
      }
      const stageIndex = STAGES.findIndex((item) => item.key === event.stage);
      if (stageIndex >= 0) setActiveStage(stageIndex);
    }

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        try {
          consumeLine(line);
        } catch (streamError) {
          if (streamError instanceof SyntaxError) continue;
          throw streamError;
        }
      }
      if (done) break;
    }
    if (buffer.trim()) consumeLine(buffer);
    if (!completed) {
      throw new Error(
        "The analysis ended before a validated report was returned. Your draft is still saved.",
      );
    }
    return completed;
  }

  async function startAnalysis() {
    setStep(4);
    setStatus("running");
    setError(null);
    setActiveStage(0);
    const controller = new AbortController();
    abortRef.current = controller;
    const body = new FormData();
    if (file) body.set("file", file);
    if (resumeId && isSupabaseConfigured()) body.set("resumeId", resumeId);
    if (draft.inputMode === "paste") body.set("resumeText", draft.pastedResume);
    body.set("jobDescription", draft.jobDescription);
    body.set("jobTitle", draft.targetRole);
    body.set("targetRole", draft.targetRole);
    body.set("company", draft.company);
    body.set("seniority", draft.seniority);
    body.set("industry", draft.industry);
    body.set("market", draft.market);
    body.set("goal", draft.goal);

    try {
      idempotencyKeyRef.current ??= crypto.randomUUID();
      const response = await fetch("/api/scans", {
        method: "POST",
        body,
        signal: controller.signal,
        headers: {
          Accept: "application/x-ndjson",
          "Idempotency-Key": idempotencyKeyRef.current,
          ...(captchaToken
            ? { "X-Captcha-Token": captchaToken }
            : {}),
        },
      });
      if (!response.ok) {
        const payload = (await response
          .json()
          .catch(() => null)) as { error?: unknown } | null;
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "The analysis service could not start. Your draft is still saved.",
        );
      }
      const completed = await parseStream(response);
      if (!isSupabaseConfigured()) {
        const summary: ScanSummary = {
          id: completed.id,
          resumeName: completed.document.filename,
          targetRole: draft.targetRole,
          company: draft.company.trim() || undefined,
          createdAt: completed.result.completedAt,
          overallScore: completed.result.overallScore,
          roleMatch: completed.result.componentScores.roleMatch,
          atsParse: completed.result.componentScores.atsParse,
          status: "complete",
          mode: completed.result.mode,
        };
        await new DemoRepository().saveScanBundle(
          completed.id,
          summary,
          completed.result,
          completed.document,
          resumeId,
        );
      }
      setActiveStage(STAGES.length);
      window.localStorage.removeItem("resumepilot:scan-draft:v1");
      idempotencyKeyRef.current = null;
      router.push(`/app/scans/${completed.id}`);
    } catch (requestError) {
      if (controller.signal.aborted) {
        setStatus("editing");
        setStep(3);
        setCaptchaToken(null);
        setCaptchaAttempt((value) => value + 1);
        return;
      }
      const isUnavailable =
        requestError instanceof TypeError ||
        (requestError instanceof Error && /not configured|demo|404|405/i.test(requestError.message));
      if (isUnavailable) {
        // This is a deterministic local fixture, not a simulated external analysis.
        window.localStorage.setItem("resumepilot:last-demo-scan", new Date().toISOString());
        setActiveStage(STAGES.length);
        router.push("/app/scans/alex-morgan-product-lead?source=demo");
        return;
      }
      setStatus("failed");
      setCaptchaToken(null);
      setCaptchaAttempt((value) => value + 1);
      setError(requestError instanceof Error ? requestError.message : "Analysis could not be completed.");
    }
  }

  function cancelAnalysis() {
    abortRef.current?.abort();
  }

  const stepLabels = ["Resume", "Job description", "Context", "Analysis"];

  return (
    <div className={cn("mx-auto w-full", embedded ? "max-w-5xl px-4 py-8 sm:px-7 lg:py-10" : "max-w-6xl px-4 py-7 sm:px-7")}>
      <div className="flex items-center justify-between gap-4">
        <Link
          href={embedded ? "/app" : "/"}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--primary)]"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {embedded ? "Workspace" : productConfig.name}
        </Link>
        <span className="rounded-full bg-[var(--success-soft)] px-3 py-1.5 text-[11px] font-extrabold text-[var(--primary)]">
          Demo available
        </span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-12">
        <div className="min-w-0">
          <div>
            <p className="eyebrow">New resume scan</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              {step === 1 && "Add your resume"}
              {step === 2 && "Add the role description"}
              {step === 3 && "Set the analysis context"}
              {step === 4 && "Creating your evidence report"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              {step === 1 && "Upload a supported file or paste the resume text. You can replace or remove it before analysis."}
              {step === 2 && "A job description enables role-match and requirement coverage. It is optional."}
              {step === 3 && "These details tune the language and evidence checks; they do not change the facts in your resume."}
              {step === 4 && "Each stage below reflects work reported by the analysis endpoint. No artificial waiting is added."}
            </p>
          </div>

          <ol aria-label="Scan progress" className="mt-7 grid grid-cols-4 gap-2">
            {stepLabels.map((label, index) => {
              const number = index + 1;
              const complete = number < step || (step === 4 && status === "running" && number < 4);
              return (
                <li key={label} aria-current={number === step ? "step" : undefined}>
                  <div className={cn("h-1.5 rounded-full", number <= step ? "bg-[var(--primary)]" : "bg-[var(--surface-strong)]")} />
                  <p className={cn("mt-2 hidden text-[11px] font-bold sm:block", number <= step ? "text-[var(--text)]" : "text-[var(--text-muted)]")}>
                    {complete ? <Check className="mr-1 inline size-3" /> : `${number}. `}{label}
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="mt-8">
            {step === 1 && (
              <section aria-labelledby="resume-input-title">
                <h2 id="resume-input-title" className="sr-only">Resume input</h2>
                {restored && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl bg-[var(--info-soft)] px-4 py-3 text-sm text-[#354fba]" role="status">
                    <RefreshCw aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    Your saved scan draft was restored on this device.
                    <button
                      onClick={() => setRestored(false)}
                      className="ml-auto text-xs font-bold underline underline-offset-2"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                <div className="inline-flex rounded-full bg-[var(--surface-strong)] p-1" aria-label="Resume input method">
                  {(["file", "paste"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDraft((value) => ({ ...value, inputMode: mode }))}
                      aria-pressed={draft.inputMode === mode}
                      className={cn(
                        "min-h-9 rounded-full px-4 text-xs font-bold",
                        draft.inputMode === mode ? "bg-white text-[var(--text)] shadow-sm" : "text-[var(--text-muted)]",
                      )}
                    >
                      {mode === "file" ? "Upload file" : "Paste text"}
                    </button>
                  ))}
                </div>

                {draft.inputMode === "file" ? (
                  <div className="mt-5">
                    <input
                      ref={fileRef}
                      type="file"
                      aria-label="Resume file"
                      accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      className="sr-only"
                      onChange={(event) => selectFile(event.target.files?.[0])}
                    />
                    {!file ? (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        onDragEnter={(event) => {
                          event.preventDefault();
                          setDragActive(true);
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragActive(false);
                          selectFile(event.dataTransfer.files[0]);
                        }}
                        className={cn(
                          "grid min-h-64 w-full place-items-center rounded-[22px] border border-dashed bg-white px-6 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                          dragActive ? "border-[var(--primary)] bg-[var(--success-soft)]" : "border-[var(--border-strong)] hover:border-[var(--primary)]",
                        )}
                      >
                        <span>
                          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--success-soft)] text-[var(--primary)]">
                            <UploadCloud aria-hidden="true" className="size-6" />
                          </span>
                          <span className="mt-4 block text-base font-extrabold">Drop your resume here</span>
                          <span className="mt-1 block text-sm text-[var(--text-muted)]">or choose a PDF, DOCX, or TXT file</span>
                          <span className="mt-3 block text-xs font-semibold text-[var(--text-muted)]">Maximum size: 8 MiB</span>
                        </span>
                      </button>
                    ) : (
                      <div className="flex min-h-36 items-center gap-4 rounded-[22px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--success-soft)] text-[var(--primary)]">
                          <FileText aria-hidden="true" className="size-6" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold">{file.name}</p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">{(file.size / 1024).toFixed(0)} KB · Ready to analyze</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>Replace</Button>
                        <Button variant="ghost" size="icon" onClick={() => setFile(null)} aria-label="Remove resume">
                          <X aria-hidden="true" className="size-4" />
                        </Button>
                      </div>
                    )}
                    {fileError && (
                      <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--danger)]" role="alert">
                        <AlertTriangle aria-hidden="true" className="size-4" /> {fileError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-5">
                    <Field label="Resume text" hint={`${draft.pastedResume.trim().length} characters`}>
                      <textarea
                        value={draft.pastedResume}
                        onChange={(event) => setDraft((value) => ({ ...value, pastedResume: event.target.value }))}
                        placeholder="Paste your complete resume, including section headings and contact details…"
                        className={`${fieldClass} min-h-72 resize-y py-3.5 leading-6`}
                      />
                    </Field>
                    {draft.pastedResume.length > 0 && draft.pastedResume.trim().length < 120 && (
                      <p className="mt-2 text-xs font-semibold text-[var(--danger)]">Paste at least 120 characters so the structure can be analyzed.</p>
                    )}
                  </div>
                )}
              </section>
            )}

            {step === 2 && (
              <section aria-labelledby="job-description-title">
                <h2 id="job-description-title" className="sr-only">Job description</h2>
                <Field label="Job description" hint="Optional">
                  <textarea
                    value={draft.jobDescription}
                    onChange={(event) => setDraft((value) => ({ ...value, jobDescription: event.target.value }))}
                    placeholder="Paste the responsibilities, requirements, and qualifications…"
                    className={`${fieldClass} min-h-[320px] resize-y py-3.5 leading-6`}
                  />
                </Field>
                <div className="mt-4 flex items-start gap-3 rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-xs leading-5 text-[var(--text-secondary)]">
                  <ScanLine aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
                  Without a job description, role-match metrics are marked unavailable and the remaining score weights are normalized.
                </div>
              </section>
            )}

            {step === 3 && (
              <section aria-labelledby="context-title" className="grid gap-5 sm:grid-cols-2">
                <h2 id="context-title" className="sr-only">Analysis context</h2>
                <Field label="Target role">
                  <input
                    value={draft.targetRole}
                    onChange={(event) => setDraft((value) => ({ ...value, targetRole: event.target.value }))}
                    className={fieldClass}
                    placeholder="e.g. Product Lead"
                    autoFocus
                  />
                </Field>
                <Field label="Company" hint="Optional">
                  <input
                    value={draft.company}
                    onChange={(event) => setDraft((value) => ({ ...value, company: event.target.value }))}
                    className={fieldClass}
                    placeholder="e.g. Northstar Labs"
                  />
                </Field>
                <Field label="Seniority">
                  <select value={draft.seniority} onChange={(event) => setDraft((value) => ({ ...value, seniority: event.target.value }))} className={fieldClass}>
                    <option value="entry">Entry level</option>
                    <option value="mid">Mid-level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead / principal</option>
                    <option value="executive">Executive</option>
                  </select>
                </Field>
                <Field label="Industry">
                  <input
                    value={draft.industry}
                    onChange={(event) => setDraft((value) => ({ ...value, industry: event.target.value }))}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Job market">
                  <select value={draft.market} onChange={(event) => setDraft((value) => ({ ...value, market: event.target.value }))} className={fieldClass}>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>European Union</option>
                    <option>India</option>
                    <option>Canada</option>
                    <option>Australia</option>
                    <option>Remote / global</option>
                  </select>
                </Field>
                <Field label="Primary goal">
                  <select
                    value={draft.goal}
                    onChange={(event) => setDraft((value) => ({ ...value, goal: event.target.value as ScanDraft["goal"] }))}
                    className={fieldClass}
                  >
                    <option value="match">Tailor for this role</option>
                    <option value="ats">Improve parseability</option>
                    <option value="general">General resume review</option>
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <TurnstileField
                    key={captchaAttempt}
                    action="resume_scan"
                    onToken={setCaptchaToken}
                  />
                </div>
              </section>
            )}

            {step === 4 && (
              <section aria-labelledby="analysis-progress-title" className="rounded-[22px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
                <h2 id="analysis-progress-title" className="text-base font-extrabold">
                  {status === "failed" ? "Analysis stopped" : "Analysis in progress"}
                </h2>
                <div className="mt-6 space-y-2" aria-live="polite">
                  {STAGES.map((stage, index) => {
                    const done = index < activeStage || activeStage === STAGES.length;
                    const active = index === activeStage && status === "running";
                    return (
                      <div key={stage.key} className={cn("flex min-h-14 items-center gap-3 rounded-xl px-4", active && "bg-[var(--success-soft)]")}>
                        <span className={cn("grid size-7 place-items-center rounded-full", done ? "bg-[var(--primary)] text-white" : active ? "bg-white text-[var(--primary)]" : "bg-[var(--surface-strong)] text-[var(--text-muted)]")}>
                          {done ? <Check className="size-4" /> : active ? <LoaderCircle className="size-4 animate-spin" /> : <span className="size-2 rounded-full bg-current" />}
                        </span>
                        <span className={cn("text-sm font-bold", !done && !active && "text-[var(--text-muted)]")}>{stage.label}</span>
                        {active && <span className="ml-auto text-[11px] font-bold text-[var(--primary)]">Working</span>}
                        {done && <span className="ml-auto text-[11px] font-bold text-[var(--text-muted)]">Complete</span>}
                      </div>
                    );
                  })}
                </div>
                {error && (
                  <div className="mt-5 rounded-xl bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]" role="alert">
                    <p className="font-bold">{error}</p>
                    <p className="mt-1 text-xs leading-5">Your draft is still saved on this device. Retry now or return to context.</p>
                  </div>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                  {status === "running" ? (
                    <Button variant="secondary" onClick={cancelAnalysis}>Cancel analysis</Button>
                  ) : (
                    <>
                      <Button onClick={startAnalysis}><RefreshCw className="size-4" /> Retry</Button>
                      <Button variant="secondary" onClick={() => { setStatus("editing"); setStep(3); }}>Review context</Button>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>

          {step < 4 && (
            <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-5">
              <Button
                variant="ghost"
                onClick={() => {
                  if (step === 1) router.push(embedded ? "/app" : "/");
                  else setStep((value) => Math.max(1, value - 1));
                }}
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                {step === 1 ? "Cancel" : "Back"}
              </Button>
              {step === 3 ? (
                <Button onClick={startAnalysis} disabled={!canContinue()}>
                  Analyze resume <ScanLine aria-hidden="true" className="size-4" />
                </Button>
              ) : (
                <Button onClick={() => setStep((value) => value + 1)} disabled={!canContinue()}>
                  {step === 2 && !draft.jobDescription.trim() ? "Continue without JD" : "Continue"}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <aside className="hidden lg:block" aria-label="Privacy and scan information">
          <div className="sticky top-24 space-y-6">
            <div className="border-l-2 border-[var(--primary)] pl-5">
              <ShieldCheck aria-hidden="true" className="size-5 text-[var(--primary)]" />
              <h2 className="mt-3 text-sm font-extrabold">Honest by design</h2>
              <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                {productConfig.privacy.demoUploadCopy} Live processing only activates when a backend is configured.
              </p>
            </div>
            <div className="border-l-2 border-[var(--border-strong)] pl-5">
              <LockKeyhole aria-hidden="true" className="size-5 text-[var(--text-muted)]" />
              <h2 className="mt-3 text-sm font-extrabold">Private inputs</h2>
              <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{productConfig.privacy.uploadAssurance}</p>
            </div>
            <p className="text-[11px] leading-5 text-[var(--text-muted)]">
              {productConfig.name} uses transparent product heuristics. Scores do not guarantee ATS acceptance, interviews, or employment.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
