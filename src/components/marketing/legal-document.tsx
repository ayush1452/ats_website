import Link from "next/link";

import { productConfig } from "@/config/product";
import type { LegalSection } from "@/content/legal";

export function LegalDocument({
  title,
  description,
  effectiveDate,
  sections,
}: {
  title: string;
  description: string;
  effectiveDate: string;
  sections: LegalSection[];
}) {
  return (
    <main id="main-content">
      <header className="border-b border-[var(--border)] bg-white py-16 sm:py-24">
        <div className="container-shell">
          <p className="eyebrow">Legal</p>
          <h1 className="mt-5 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.06em] sm:text-7xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--text-secondary)]">{description}</p>
          <p className="mt-6 inline-flex rounded-full bg-[var(--warning-soft)] px-4 py-2 text-xs font-semibold text-[#81520a]">
            Product legal template · counsel and provider review required before launch
          </p>
          <p className="mt-4 text-xs text-[var(--text-muted)]">Effective date: {effectiveDate}</p>
        </div>
      </header>
      <div className="container-shell grid gap-14 py-16 sm:py-24 lg:grid-cols-[260px_1fr] lg:items-start">
        <nav aria-label={`${title} sections`} className="lg:sticky lg:top-28">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">On this page</p>
          <ul className="mt-4 space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  className="block rounded-[10px] px-3 py-2 text-xs leading-5 text-[var(--text-secondary)] hover:bg-white hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                  href={`#${section.id}`}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-3xl">
          {sections.map((section) => (
            <section className="mb-14 scroll-mt-28 last:mb-0" id={section.id} key={section.id}>
              <h2 className="text-2xl font-semibold tracking-[-0.035em]">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)] sm:text-base sm:leading-8" key={paragraph}>
                  {paragraph}
                </p>
              ))}
              {section.items ? (
                <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                  {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : null}
            </section>
          ))}
          <div className="mt-16 rounded-[18px] border border-[var(--border)] bg-white p-6">
            <h2 className="text-lg font-semibold">Need clarification?</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Use the contact form and select Privacy and data or Plans and billing.
            </p>
            <Link className="mt-4 inline-block text-sm font-bold text-[var(--primary)] hover:underline" href="/contact?topic=privacy">
              Contact {productConfig.name}
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
