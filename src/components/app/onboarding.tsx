"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import { getBrowserSupabase } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

interface OnboardingDraft {
  step: number;
  goal: "tailor" | "improve" | "explore";
  targetRole: string;
  seniority: string;
  market: string;
  fileName?: string;
}

const initialDraft: OnboardingDraft = {
  step: 1,
  goal: "tailor",
  targetRole: "",
  seniority: "mid",
  market: "United States",
};

export function OnboardingFlow() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(initialDraft);
  const [fileError, setFileError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("resumepilot:onboarding:v1");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<OnboardingDraft>;
        window.setTimeout(() => {
          setDraft({ ...initialDraft, ...parsed });
          setRestored(true);
        }, 0);
      }
    } catch {
      window.localStorage.removeItem("resumepilot:onboarding:v1");
    }
  }, []);

  useEffect(() => {
    if (draft.step < 5) window.localStorage.setItem("resumepilot:onboarding:v1", JSON.stringify(draft));
  }, [draft]);

  function next() {
    setDraft((value) => ({ ...value, step: Math.min(5, value.step + 1) }));
  }

  async function complete(path = "/app") {
    if (completing) return;
    setCompleting(true);
    setCompletionError(null);
    try {
      const client = getBrowserSupabase();
      if (client) {
        const {
          data: { user },
          error: userError,
        } = await client.auth.getUser();
        if (userError || !user) throw new Error("Sign in again to finish onboarding.");
        const { error } = await client.from("profiles").upsert({
          id: user.id,
          target_role: draft.targetRole.trim(),
          seniority: draft.seniority,
          industry: "",
          onboarding_completed: true,
        });
        if (error) throw new Error("Your live onboarding choices could not be saved.");
      }
      window.localStorage.removeItem("resumepilot:onboarding:v1");
      window.localStorage.setItem("resumepilot:onboarding-complete", "true");
      router.push(path);
      router.refresh();
    } catch (error) {
      setCompletionError(
        error instanceof Error ? error.message : "Onboarding could not be completed.",
      );
      setCompleting(false);
    }
  }

  function chooseFile(file: File | undefined) {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "docx", "txt"].includes(extension) || file.size > 8 * 1024 * 1024) {
      setFileError("Choose a PDF, DOCX, or TXT file up to 8 MiB.");
      return;
    }
    setFileError(null);
    setDraft((value) => ({ ...value, fileName: file.name }));
  }

  const goals = [
    { id: "tailor" as const, icon: Target, title: "Tailor for a role", copy: "Compare verified evidence with a specific job description." },
    { id: "improve" as const, icon: ScanLine, title: "Improve my resume", copy: "Find parseability, clarity, impact, and structure issues." },
    { id: "explore" as const, icon: Sparkles, title: "Explore the demo", copy: "Review deterministic sample data before adding a resume." },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-7">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--primary)] text-xs font-black text-white">{productConfig.shortName}</span>
            <span className="text-sm font-extrabold">{productConfig.name}</span>
          </div>
          <button onClick={() => void complete("/app")} disabled={completing} className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary)] disabled:opacity-50">Skip onboarding</button>
        </header>
        <div className="mt-8 grid grid-cols-5 gap-2" aria-label={`Step ${draft.step} of 5`}>
          {Array.from({ length: 5 }, (_, index) => <div key={index} className={cn("h-1.5 rounded-full", index + 1 <= draft.step ? "bg-[var(--primary)]" : "bg-[var(--surface-strong)]")} />)}
        </div>

        <main className="mx-auto mt-12 max-w-2xl">
          {completionError ? <p className="mb-5 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-bold text-[var(--danger)]" role="alert">{completionError}</p> : null}
          {restored && <div className="mb-5 rounded-xl bg-[var(--info-soft)] px-4 py-3 text-xs font-bold text-[#354fba]" role="status">Your onboarding progress was restored on this device. <button className="ml-2 underline" onClick={() => setRestored(false)}>Dismiss</button></div>}
          {draft.step === 1 && (
            <section className="text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--success-soft)] text-[var(--primary)]"><Sparkles className="size-7" /></span>
              <p className="eyebrow mt-6">Welcome to {productConfig.name}</p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">Build from evidence, not guesswork.</h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">Set up your workspace in about two minutes. Every choice can be changed later.</p>
              <Button onClick={next} size="lg" className="mt-8">Set up my workspace <ArrowRight className="size-4" /></Button>
            </section>
          )}

          {draft.step === 2 && (
            <section>
              <p className="eyebrow">Step 2 · Goal</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">What do you want to do first?</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">This changes the default scan context, not your score.</p>
              <div className="mt-7 space-y-3">{goals.map((goal) => { const Icon = goal.icon; return <button key={goal.id} onClick={() => setDraft((value) => ({ ...value, goal: goal.id }))} aria-pressed={draft.goal === goal.id} className={cn("flex w-full items-start gap-4 rounded-2xl border bg-white p-5 text-left", draft.goal === goal.id ? "border-[var(--primary)] ring-2 ring-[color:rgba(14,107,73,.12)]" : "border-[var(--border)] hover:border-[var(--border-strong)]")}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--success-soft)] text-[var(--primary)]"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><strong className="text-sm">{goal.title}</strong><span className="mt-1 block text-xs leading-5 text-[var(--text-secondary)]">{goal.copy}</span></span>{draft.goal === goal.id && <Check className="size-5 text-[var(--primary)]" />}</button>; })}</div>
            </section>
          )}

          {draft.step === 3 && (
            <section>
              <p className="eyebrow">Step 3 · Resume</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Add a resume now, or later.</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Demo mode keeps the draft on this device. A live deployment uses private storage.</p>
              <input ref={fileRef} type="file" aria-label="Resume file" accept=".pdf,.docx,.txt" className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} />
              <button onClick={() => fileRef.current?.click()} className={cn("mt-7 grid min-h-60 w-full place-items-center rounded-[22px] border border-dashed bg-white p-6 text-center hover:border-[var(--primary)]", draft.fileName ? "border-[var(--primary)]" : "border-[var(--border-strong)]")}>
                <span>{draft.fileName ? <FileText className="mx-auto size-8 text-[var(--primary)]" /> : <UploadCloud className="mx-auto size-8 text-[var(--primary)]" />}<strong className="mt-3 block text-sm">{draft.fileName ?? "Choose a resume"}</strong><span className="mt-1 block text-xs text-[var(--text-muted)]">{draft.fileName ? "Choose again to replace it" : "PDF, DOCX, or TXT · up to 8 MiB"}</span></span>
              </button>
              {fileError && <p className="mt-3 text-xs font-bold text-[var(--danger)]" role="alert">{fileError}</p>}
            </section>
          )}

          {draft.step === 4 && (
            <section>
              <p className="eyebrow">Step 4 · Target</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Set your role context.</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">These defaults make new scans faster and remain editable.</p>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-bold sm:col-span-2">Target role<input autoFocus value={draft.targetRole} onChange={(event) => setDraft((value) => ({ ...value, targetRole: event.target.value }))} placeholder="e.g. Product Lead" className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[color:rgba(14,107,73,.13)]" /></label>
                <label className="text-sm font-bold">Seniority<select value={draft.seniority} onChange={(event) => setDraft((value) => ({ ...value, seniority: event.target.value }))} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3.5 text-sm"><option value="entry">Entry level</option><option value="mid">Mid-level</option><option value="senior">Senior</option><option value="lead">Lead / principal</option><option value="executive">Executive</option></select></label>
                <label className="text-sm font-bold">Job market<select value={draft.market} onChange={(event) => setDraft((value) => ({ ...value, market: event.target.value }))} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3.5 text-sm"><option>United States</option><option>United Kingdom</option><option>European Union</option><option>India</option><option>Canada</option><option>Remote / global</option></select></label>
              </div>
            </section>
          )}

          {draft.step === 5 && (
            <section className="text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--success-soft)] text-[var(--primary)]"><Check className="size-7" /></span><p className="eyebrow mt-6">Workspace ready</p><h1 className="mt-3 text-4xl font-extrabold tracking-[-0.05em]">Your next action is clear.</h1><p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">{draft.goal === "explore" ? "Open the Alex Morgan report to see every lens, finding, and annotation." : draft.fileName ? "Continue to a new scan. Your selected file will need to be chosen again for security." : "Start a scan when you are ready, or explore the deterministic Alex Morgan report first."}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3"><Button onClick={() => void complete(draft.goal === "explore" ? "/app/scans/alex-morgan-product-lead" : "/app/scan")} size="lg" disabled={completing}>{completing ? "Saving…" : draft.goal === "explore" ? "Explore demo report" : "Start a scan"} <ArrowRight className="size-4" /></Button><Button variant="secondary" size="lg" onClick={() => void complete("/app")} disabled={completing}>Go to overview</Button></div>
              <p className="mt-7 flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]"><ShieldCheck className="size-3.5" /> Scores are heuristic guidance, not hiring guarantees.</p>
            </section>
          )}

          {draft.step > 1 && draft.step < 5 && (
            <div className="mt-8 flex items-center justify-between border-t border-[var(--border)] pt-5">
              <Button variant="ghost" onClick={() => setDraft((value) => ({ ...value, step: value.step - 1 }))}><ArrowLeft className="size-4" /> Back</Button>
              <div className="flex gap-2">
                {draft.step === 3 && <Button variant="secondary" onClick={() => { setDraft((value) => ({ ...value, fileName: undefined })); next(); }}>Skip for now</Button>}
                <Button onClick={next} disabled={draft.step === 4 && draft.targetRole.trim().length < 2}>Continue <ArrowRight className="size-4" /></Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
