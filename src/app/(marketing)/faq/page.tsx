import type { Metadata } from "next";
import { ArrowRight, MessageCircleQuestion } from "lucide-react";
import Link from "next/link";

import { FaqList } from "@/components/marketing/faq-list";
import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import { faqs } from "@/content/site";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    `Answers about ${productConfig.name} analysis, scoring, supported files, privacy, sharing, and plans.`,
  alternates: { canonical: "/faq" },
  openGraph: {
    title: `${productConfig.name} FAQ`,
    description: `Clear answers about what ${productConfig.name} can—and cannot—tell you.`,
    url: "/faq",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FaqPage() {
  return (
    <main id="main-content">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        type="application/ld+json"
      />
      <section className="border-b border-[var(--border)] bg-white py-20 sm:py-28">
        <div className="container-shell grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Questions, answered</p>
            <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold leading-[.98] tracking-[-0.065em] sm:text-7xl">
              Know the product’s useful boundaries.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
              Plain-language answers about supported analysis, heuristic scores, data handling,
              and what changes when external services are configured.
            </p>
          </div>
          <span className="grid size-16 place-items-center rounded-[20px] bg-[var(--success-soft)] text-[var(--primary)]">
            <MessageCircleQuestion aria-hidden="true" className="size-7" />
          </span>
        </div>
      </section>

      <section className="container-shell py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
          <nav aria-label="FAQ categories" className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Categories</p>
            <ul className="mt-4 flex flex-wrap gap-2 lg:grid">
              {["Product", "Scoring", "Privacy", "Plans"].map((category) => (
                <li key={category}>
                  <a
                    className="block rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                    href={`#${category.toLowerCase()}`}
                  >
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            {(["Product", "Scoring", "Privacy", "Plans"] as const).map((category) => (
              <section className="mb-14 scroll-mt-28 last:mb-0" id={category.toLowerCase()} key={category}>
                <h2 className="text-2xl font-semibold tracking-[-0.035em]">{category}</h2>
                <div className="mt-5">
                  <FaqList items={faqs.filter((faq) => faq.category === category)} showCategory={false} />
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--background-secondary)] py-20 text-center sm:py-24">
        <div className="container-shell">
          <h2 className="text-3xl font-semibold tracking-[-0.04em]">Still need a specific answer?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
            Contact us for product, privacy, billing, team, or technical questions.
          </p>
          <Button asChild className="mt-7" variant="secondary">
            <Link href="/contact">Contact {productConfig.name} <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
