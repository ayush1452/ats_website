import type { Metadata } from "next";
import { Clock3, MessageSquareText, ShieldCheck, UsersRound } from "lucide-react";

import { ContactForm } from "@/components/marketing/contact-form";
import { productConfig } from "@/config/product";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${productConfig.name} about the product, privacy, plans, teams, or technical support.`,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Contact ${productConfig.name}`,
    description: "Product, privacy, plan, team, and support questions are welcome.",
    url: "/contact",
  },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string | string[] }>;
}) {
  const query = await searchParams;
  const rawTopic = Array.isArray(query.topic) ? query.topic[0] : query.topic;
  const supportedTopics = new Set(["product", "privacy", "teams", "billing", "support"]);
  const initialTopic = rawTopic && supportedTopics.has(rawTopic) ? rawTopic : "product";

  return (
    <main id="main-content">
      <section className="border-b border-[var(--border)] bg-white py-20 sm:py-28">
        <div className="container-shell">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-5 max-w-5xl text-balance text-5xl font-semibold leading-[.98] tracking-[-0.065em] sm:text-7xl">
            Tell us what you need to solve.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
            Ask about the product, candidate privacy, a coaching workspace, billing configuration,
            or a technical issue.
          </p>
        </div>
      </section>
      <section className="container-shell grid gap-12 py-16 sm:py-24 lg:grid-cols-[.62fr_1.38fr]">
        <aside>
          <h2 className="text-xl font-semibold tracking-[-0.03em]">A useful first message includes</h2>
          <ul className="mt-6 space-y-5">
            {[
              [MessageSquareText, "The page or workflow involved", "Describe what you expected and what happened."],
              [Clock3, "Approximate time", "A timestamp helps with a sanitized technical investigation."],
              [ShieldCheck, "No resume or secret", "Do not paste real resume content, passwords, tokens, or payment details."],
              [UsersRound, "Team context", "For team questions, include expected seats and reviewer roles."],
            ].map(([Icon, title, copy]) => {
              const ItemIcon = Icon as typeof MessageSquareText;
              return (
                <li className="flex gap-4" key={title as string}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[var(--success-soft)] text-[var(--primary)]">
                    <ItemIcon aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title as string}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{copy as string}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-8 rounded-[15px] bg-[var(--warning-soft)] p-4 text-xs leading-5 text-[#81520a]">
            Production support times and legal contact details must be configured before public launch.
          </p>
        </aside>
        <ContactForm initialTopic={initialTopic} />
      </section>
    </main>
  );
}
