import { Clock3 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default async function SessionExpiredPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/app";
  return (
    <div className="w-full max-w-[440px]">
      <span className="mb-6 grid size-14 place-items-center rounded-2xl bg-[var(--warning-soft)] text-[var(--warning)]">
        <Clock3 className="size-6" aria-hidden="true" />
      </span>
      <p className="eyebrow mb-3">Session expired</p>
      <h1 className="text-4xl font-bold tracking-[-0.04em]">Sign in to continue</h1>
      <p className="mt-4 leading-7 text-[var(--text-secondary)]">
        Your saved data is unchanged. For your privacy, the previous session can no longer open
        protected reports.
      </p>
      <Button asChild className="mt-7">
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>Return to login</Link>
      </Button>
    </div>
  );
}
