import { MailCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-[440px]">
      <span className="mb-6 grid size-14 place-items-center rounded-2xl bg-[var(--success-soft)] text-[var(--primary)]">
        <MailCheck className="size-6" aria-hidden="true" />
      </span>
      <p className="eyebrow mb-3">Verify your email</p>
      <h1 className="text-4xl font-bold tracking-[-0.04em]">Open the secure link we sent</h1>
      <p className="mt-4 leading-7 text-[var(--text-secondary)]">
        Verification protects your saved resumes and lets us restore access safely.
      </p>
      <Button asChild className="mt-7" variant="secondary">
        <Link href="/login">I’ve verified my email</Link>
      </Button>
    </div>
  );
}
