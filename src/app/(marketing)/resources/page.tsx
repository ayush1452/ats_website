import type { Metadata } from "next";
import { BookOpenCheck } from "lucide-react";

import { ResourceFilter } from "@/components/marketing/resource-filter";

export const metadata: Metadata = {
  title: "Resume resources",
  description:
    "Six practical guides to ATS parsing, evidence mapping, keyword use, impact writing, resume formatting, and privacy.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Practical resume analysis guides",
    description: "Clear, evidence-led guidance without unsupported hiring promises.",
    url: "/resources",
  },
};

export default function ResourcesPage() {
  return (
    <main id="main-content">
      <section className="border-b border-[var(--border)] bg-white py-20 sm:py-28">
        <div className="container-shell grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Resume field notes</p>
            <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold leading-[.98] tracking-[-0.065em] sm:text-7xl">
              Practical guides for a clearer resume.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
              Learn to inspect extraction, map role evidence, write impact carefully, and ask
              better privacy questions before uploading.
            </p>
          </div>
          <span className="grid size-16 place-items-center rounded-[20px] bg-[var(--success-soft)] text-[var(--primary)]">
            <BookOpenCheck aria-hidden="true" className="size-7" />
          </span>
        </div>
      </section>
      <section className="container-shell py-16 sm:py-24">
        <ResourceFilter />
      </section>
    </main>
  );
}

