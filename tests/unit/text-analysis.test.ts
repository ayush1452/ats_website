import { describe, expect, it } from "vitest";

import {
  calculateReadability,
  createAnnotation,
  detectSections,
  detectWeakVerbs,
  hasQuantifiedOutcome,
  inspectDateConsistency,
  keywordStuffingRatio,
  makeTextDocument,
  phraseFrequency,
} from "@/lib/analysis";

describe("deterministic text checks", () => {
  it("calculates bounded readability statistics", () => {
    const stats = calculateReadability(
      "Led a focused product team. Shipped a simpler onboarding flow. Adoption increased by 18%.",
    );
    expect(stats.words).toBeGreaterThan(10);
    expect(stats.sentences).toBe(3);
    expect(stats.score).toBeGreaterThanOrEqual(0);
    expect(stats.score).toBeLessThanOrEqual(100);
    expect(stats.gradeLevel).toBeGreaterThanOrEqual(0);
  });

  it("counts phrases by token rather than matching substrings", () => {
    expect(phraseFrequency("SQL and SQL analysis. NoSQL is separate.", "SQL")).toBe(2);
    expect(keywordStuffingRatio("SQL SQL SQL SQL analysis", "SQL")).toBeGreaterThan(0.03);
  });

  it("detects weak verbs and quantified evidence", () => {
    const weak = detectWeakVerbs("Helped launch a tool and was responsible for reporting.");
    expect(weak.map((item) => item.verb.toLocaleLowerCase())).toEqual([
      "helped",
      "responsible",
    ]);
    expect(hasQuantifiedOutcome("Increased activation by 24% in two quarters.")).toBe(true);
    expect(hasQuantifiedOutcome("Worked with the product team.")).toBe(false);
  });

  it("recognizes mixed date styles", () => {
    expect(inspectDateConsistency("Jan 2023 – Mar 2024").consistent).toBe(true);
    expect(inspectDateConsistency("Jan 2023 – 04/2024").consistent).toBe(false);
  });

  it("detects conventional sections in source order", () => {
    const sections = detectSections(
      "SUMMARY\nProduct leader\nEXPERIENCE\nLed work\nSKILLS\nSQL\nEDUCATION\nB.S.",
    );
    expect(sections.map((section) => section.name)).toEqual([
      "Summary",
      "Experience",
      "Skills",
      "Education",
    ]);
    expect(sections.every((section) => section.end >= section.start)).toBe(true);
  });

  it("creates a stable source annotation with exact offsets", () => {
    const source = "Led onboarding for 2,000 customers.";
    const document = makeTextDocument({
      text: `SUMMARY\nProduct leader\nEXPERIENCE\n${source}`,
    });
    const annotation = createAnnotation({
      id: "annotation-1",
      findingId: "finding-1",
      document,
      sourceText: source,
      severity: "medium",
      label: "Evidence",
    });
    expect(annotation).not.toBeNull();
    expect(
      document.normalizedText.slice(annotation?.start, annotation?.end),
    ).toBe(source);
  });
});
