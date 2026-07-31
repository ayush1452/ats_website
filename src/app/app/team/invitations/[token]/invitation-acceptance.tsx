"use client";

import { CheckCircle2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/auth/client";

export function InvitationAcceptance({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const validToken = /^[A-Za-z0-9_-]{40,64}$/u.test(token);
  const live = isSupabaseConfigured();

  async function accept() {
    if (!live || !validToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/team/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "The invitation could not be accepted.");
      }
      setAccepted(true);
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "The invitation could not be accepted.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[70vh] w-full max-w-2xl place-items-center px-5 py-12 text-center">
      <div className="w-full rounded-[24px] border border-[var(--border)] bg-white p-7 shadow-[var(--shadow-sm)] sm:p-10">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--success-soft)] text-[var(--primary)]">
          {accepted ? (
            <CheckCircle2 aria-hidden="true" className="size-6" />
          ) : (
            <UserPlus aria-hidden="true" className="size-6" />
          )}
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.03em]">
          {accepted ? "You joined the workspace" : "Team workspace invitation"}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
          {accepted
            ? "Your membership is active. The role from the invitation now controls which shared resumes, scans, and comments you can change."
            : "Accept with the verified account whose email matches this seven-day invitation. Invalid, expired, revoked, and already-used links fail closed."}
        </p>
        {error ? (
          <p className="mt-5 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm font-bold text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
        {accepted ? (
          <Button asChild className="mt-6">
            <Link href="/app/team">Open team workspace</Link>
          </Button>
        ) : (
          <Button
            className="mt-6"
            disabled={!live || !validToken || busy}
            onClick={() => void accept()}
          >
            {busy ? "Accepting…" : "Accept invitation"}
          </Button>
        )}
        {!live ? (
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Externally accessible invitations require a configured Supabase backend.
          </p>
        ) : null}
      </div>
    </div>
  );
}
