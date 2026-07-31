"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ResumeDetailPage } from "@/components/app/workspace-pages";
import { Button } from "@/components/ui/button";
import {
  DemoRepository,
  type DemoScanBundle,
} from "@/lib/repositories/demo";

export function LocalResumeDetail({ resumeId }: { resumeId: string }) {
  const [bundle, setBundle] = useState<DemoScanBundle | null>();

  useEffect(() => {
    let active = true;
    void new DemoRepository().getScanBundle(resumeId).then((saved) => {
      if (active) setBundle(saved);
    });
    return () => {
      active = false;
    };
  }, [resumeId]);

  if (bundle === undefined) {
    return (
      <div className="grid min-h-[65vh] place-items-center text-sm font-bold text-[var(--text-muted)]">
        Opening the saved resume…
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-extrabold">Saved resume unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            This browser does not contain that demo resume. Local demo data is
            not shared across devices.
          </p>
          <Button asChild className="mt-6">
            <Link href="/app/resumes">Return to resumes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ResumeDetailPage
      resumeId={bundle.resumeId}
      resumeName={bundle.summary.resumeName}
      versions={bundle.versions}
      isDemo
    />
  );
}
