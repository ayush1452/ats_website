import { ChevronDown } from "lucide-react";

import type { FaqItem } from "@/content/site";

export function FaqList({
  items,
  showCategory = false,
}: {
  items: Array<Pick<FaqItem, "question" | "answer"> & Partial<Pick<FaqItem, "category">>>;
  showCategory?: boolean;
}) {
  return (
    <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
      {items.map((item) => (
        <details className="group py-1" key={item.question}>
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4 text-left font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] [&::-webkit-details-marker]:hidden">
            <span>
              {showCategory && item.category ? (
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--primary)]">
                  {item.category}
                </span>
              ) : null}
              {item.question}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 text-[var(--text-muted)] transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="max-w-3xl pb-6 pr-10 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}

