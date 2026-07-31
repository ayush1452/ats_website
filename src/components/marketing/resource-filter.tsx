"use client";

import { ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { resources, type ResourceCategory } from "@/content/resources";
import { cn } from "@/lib/utils";

type CategoryFilter = "All guides" | ResourceCategory;

export function ResourceFilter() {
  const [category, setCategory] = useState<CategoryFilter>("All guides");
  const [query, setQuery] = useState("");

  const categories: CategoryFilter[] = [
    "All guides",
    "ATS fundamentals",
    "Tailoring",
    "Writing",
    "Privacy",
  ];

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return resources.filter(
      (resource) =>
        (category === "All guides" || resource.category === category) &&
        (!normalizedQuery ||
          resource.title.toLowerCase().includes(normalizedQuery) ||
          resource.description.toLowerCase().includes(normalizedQuery)),
    );
  }, [category, query]);

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter resources by category">
          {categories.map((item) => (
            <button
              aria-pressed={category === item}
              className={cn(
                "min-h-10 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                category === item
                  ? "bg-[var(--primary-dark)] text-white"
                  : "border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--primary)]",
              )}
              key={item}
              onClick={() => setCategory(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <label className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-white px-4 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[color:rgba(14,107,73,.12)]">
          <Search aria-hidden="true" className="size-4 text-[var(--text-muted)]" />
          <span className="sr-only">Search guides</span>
          <input
            className="min-w-0 bg-transparent text-sm outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guides"
            type="search"
            value={query}
          />
        </label>
      </div>
      <p aria-live="polite" className="mt-5 text-sm text-[var(--text-secondary)]">
        {filtered.length} practical guide{filtered.length === 1 ? "" : "s"}
      </p>
      {filtered.length ? (
        <div className="mt-4 grid gap-px overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--border)] md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource, index) => (
            <article
              className="group flex min-h-[310px] flex-col bg-white p-6 transition-colors hover:bg-[#fbfdfb] sm:p-7"
              key={resource.slug}
            >
              <div className="flex items-center justify-between gap-4">
                <Badge tone={resource.category === "Privacy" ? "info" : index % 2 ? "success" : "neutral"}>
                  {resource.category}
                </Badge>
                <span className="text-xs text-[var(--text-muted)]">{resource.readingTime}</span>
              </div>
              <h2 className="mt-8 text-xl font-semibold tracking-[-0.035em]">{resource.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                {resource.description}
              </p>
              <Link
                aria-label={`Read ${resource.title}`}
                className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-bold text-[var(--primary)] outline-none group-hover:underline focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                href={`/resources/${resource.slug}`}
              >
                Read guide
                <ArrowUpRight aria-hidden="true" className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[20px] border border-dashed border-[var(--border-strong)] p-10 text-center">
          <p className="font-semibold">No guides match that search.</p>
          <button
            className="mt-3 text-sm font-bold text-[var(--primary)] hover:underline"
            onClick={() => {
              setQuery("");
              setCategory("All guides");
            }}
            type="button"
          >
            Clear search and filters
          </button>
        </div>
      )}
    </>
  );
}

