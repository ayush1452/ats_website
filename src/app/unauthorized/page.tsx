import { LockKeyhole } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main id="main-content" className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl bg-[var(--warning-soft)] text-[var(--warning)]">
          <LockKeyhole className="size-6" aria-hidden="true" />
        </span>
        <p className="eyebrow mb-3">Permission required</p>
        <h1 className="text-4xl font-bold tracking-[-0.04em]">This workspace is not available</h1>
        <p className="mt-4 leading-7 text-[var(--text-secondary)]">
          Ask the workspace owner for access, or return to your own dashboard.
        </p>
        <Button asChild className="mt-7">
          <Link href="/app">Return to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
