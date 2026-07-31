import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import {
  resourceBySlug,
  resources,
  type ResourceSlug,
} from "@/content/resources";

export function generateStaticParams() {
  return resources.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = resourceBySlug[slug as ResourceSlug];
  if (!resource) return {};

  return {
    title: resource.title,
    description: resource.description,
    alternates: { canonical: `/resources/${resource.slug}` },
    openGraph: {
      type: "article",
      title: resource.title,
      description: resource.description,
      url: `/resources/${resource.slug}`,
    },
  };
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = resourceBySlug[slug as ResourceSlug];
  if (!resource) notFound();
  const related = resources.filter((item) => item.slug !== resource.slug).slice(0, 2);

  return (
    <main id="main-content">
      <article>
        <header className="border-b border-[var(--border)] bg-white py-16 sm:py-24">
          <div className="container-shell">
            <Link className="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] hover:underline" href="/resources">
              <ArrowLeft aria-hidden="true" className="size-4" /> All guides
            </Link>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Badge tone="success">{resource.category}</Badge>
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Clock3 aria-hidden="true" className="size-3.5" /> {resource.readingTime}
              </span>
              <span className="text-xs text-[var(--text-muted)]">Published {resource.published}</span>
            </div>
            <h1 className="mt-6 max-w-5xl text-balance text-5xl font-semibold leading-[1] tracking-[-0.06em] sm:text-7xl">
              {resource.title}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
              {resource.description}
            </p>
          </div>
        </header>

        <div className="container-shell grid gap-14 py-16 sm:py-24 lg:grid-cols-[260px_1fr] lg:items-start">
          <aside className="rounded-[18px] bg-[var(--success-soft)] p-6 lg:sticky lg:top-28">
            <h2 className="text-sm font-bold text-[var(--primary-dark)]">Key takeaways</h2>
            <ul className="mt-4 space-y-4">
              {resource.takeaways.map((takeaway) => (
                <li className="flex gap-2.5 text-xs leading-5 text-[var(--primary-dark)]" key={takeaway}>
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {takeaway}
                </li>
              ))}
            </ul>
          </aside>
          <div className="max-w-3xl">
            {resource.sections.map((section) => (
              <section className="mb-14 last:mb-0" key={section.heading}>
                <h2 className="text-3xl font-semibold tracking-[-0.04em]">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p className="mt-5 text-base leading-8 text-[var(--text-secondary)]" key={paragraph}>
                    {paragraph}
                  </p>
                ))}
                {section.checklist ? (
                  <ul className="mt-6 space-y-3 border-l-2 border-[var(--primary)] pl-5">
                    {section.checklist.map((item) => (
                      <li className="flex gap-3 text-sm leading-7" key={item}>
                        <CheckCircle2 aria-hidden="true" className="mt-1 size-4 shrink-0 text-[var(--primary)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
            <div className="mt-16 rounded-[20px] border border-[var(--border)] bg-[var(--background-secondary)] p-6 sm:p-8">
              <h2 className="text-xl font-semibold tracking-[-0.03em]">Use the guide as a review method.</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                {productConfig.name} can organize supported signals and evidence, but the result remains a
                product heuristic. Verify every claim and recommendation against your experience.
              </p>
              <Button asChild className="mt-6">
                <Link href="/scan">Scan my resume <ArrowRight aria-hidden="true" className="size-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </article>

      <section className="border-t border-[var(--border)] bg-white py-16 sm:py-20">
        <div className="container-shell">
          <h2 className="text-2xl font-semibold tracking-[-0.035em]">Continue reading</h2>
          <div className="mt-7 grid gap-px overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--border)] md:grid-cols-2">
            {related.map((item) => (
              <Link
                className="group bg-white p-6 transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                href={`/resources/${item.slug}`}
                key={item.slug}
              >
                <Badge>{item.category}</Badge>
                <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em]">{item.title}</h3>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
                  Read guide <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
