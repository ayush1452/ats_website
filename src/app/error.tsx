"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)]">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <p className="eyebrow mb-3">Something went wrong</p>
        <h1 className="text-4xl font-bold tracking-[-0.04em]">Your work is still safe</h1>
        <p className="mt-4 leading-7 text-[var(--text-secondary)]">
          The current view could not load. Try again, or return to the dashboard if the issue
          continues.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-[var(--text-muted)]">Reference: {error.digest}</p>
        ) : null}
        <Button className="mt-7" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      </div>
    </main>
  );
}
