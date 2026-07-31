"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { caseStudies } from "@/content/case-studies";

const selectClassName =
  "min-h-11 rounded-full border border-[var(--border-strong)] bg-white px-4 text-sm font-semibold outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[color:rgba(14,107,73,.12)]";

export function CaseStudyFilter() {
  const [role, setRole] = useState("All roles");
  const [industry, setIndustry] = useState("All industries");
  const [seniority, setSeniority] = useState("All seniority");
  const [problem, setProblem] = useState("All problems");

  const filtered = useMemo(
    () =>
      caseStudies.filter(
        (study) =>
          (role === "All roles" || study.role === role) &&
          (industry === "All industries" || study.industry === industry) &&
          (seniority === "All seniority" || study.seniority === seniority) &&
          (problem === "All problems" || study.problemSolved === problem),
      ),
    [industry, problem, role, seniority],
  );

  const options = {
    roles: ["All roles", ...new Set(caseStudies.map((study) => study.role))],
    industries: ["All industries", ...new Set(caseStudies.map((study) => study.industry))],
    seniority: ["All seniority", ...new Set(caseStudies.map((study) => study.seniority))],
    problems: ["All problems", ...new Set(caseStudies.map((study) => study.problemSolved))],
  };

  function reset() {
    setRole("All roles");
    setIndustry("All industries");
    setSeniority("All seniority");
    setProblem("All problems");
  }

  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter demonstration case studies">
        <label>
          <span className="sr-only">Role</span>
          <select className={selectClassName} onChange={(event) => setRole(event.target.value)} value={role}>
            {options.roles.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Industry</span>
          <select className={selectClassName} onChange={(event) => setIndustry(event.target.value)} value={industry}>
            {options.industries.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Seniority</span>
          <select className={selectClassName} onChange={(event) => setSeniority(event.target.value)} value={seniority}>
            {options.seniority.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Main problem solved</span>
          <select className={selectClassName} onChange={(event) => setProblem(event.target.value)} value={problem}>
            {options.problems.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <Button onClick={reset} size="sm" variant="ghost">
          <RotateCcw aria-hidden="true" className="size-3.5" /> Reset
        </Button>
      </div>
      <p aria-live="polite" className="mt-5 text-sm text-[var(--text-secondary)]">
        Showing {filtered.length} of {caseStudies.length} fictional demonstrations.
      </p>
      {filtered.length ? (
        <div className="mt-7 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {filtered.map((study) => (
            <article
              className="grid gap-7 py-8 lg:grid-cols-[1.35fr_.65fr_auto] lg:items-center"
              key={study.slug}
            >
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="violet">Fictional demonstration</Badge>
                  <Badge>{study.role}</Badge>
                  <Badge>{study.problemSolved}</Badge>
                </div>
                <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-[-0.035em]">
                  {study.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                  {study.summary}
                </p>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)]">Initial</p>
                  <p className="mt-1 text-3xl font-semibold tracking-[-0.05em]">{study.initialScore}</p>
                </div>
                <span className="pb-2 text-[var(--text-muted)]">→</span>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)]">Revised</p>
                  <p className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-[var(--primary)]">
                    {study.improvedScore}
                  </p>
                </div>
              </div>
              <Button asChild variant="secondary">
                <Link href={`/case-studies/${study.slug}`}>
                  Read demonstration
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-7 rounded-[20px] border border-dashed border-[var(--border-strong)] p-10 text-center">
          <p className="font-semibold">No demonstration matches all four filters.</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Reset the filters to review every example.</p>
          <Button className="mt-5" onClick={reset} variant="secondary">Reset filters</Button>
        </div>
      )}
    </>
  );
}

