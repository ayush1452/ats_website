import { describe, expect, it } from "vitest";

import {
  DeterministicAnalysisService,
  makeTextDocument,
} from "@/lib/analysis";
import type {
  AnalysisInput,
  AnalysisResult,
  Recommendation,
  SemanticAnalysisProvider,
} from "@/types/domain";

const resumeText = `ALEX EXAMPLE
alex@example.test · +1 555 010 1234

SUMMARY
Product manager focused on clear customer outcomes.

EXPERIENCE
• Led onboarding improvements for 2,000 users and increased activation by 18%.
• Helped the team maintain launch plans.

SKILLS
Product strategy, SQL, user research

EDUCATION
B.S. Business, Example University`;

function input(jobDescription?: string): AnalysisInput {
  return {
    document: makeTextDocument({ text: resumeText }),
    jobDescription,
    targetRole: "Product Manager",
    seniority: "Mid-level",
    industry: "B2B SaaS",
    market: "United States",
    goal: jobDescription ? "match" : "general",
  };
}

describe("DeterministicAnalysisService", () => {
  it("returns a validated demo result and emits actual pipeline stages", async () => {
    const stages: string[] = [];
    const result = await new DeterministicAnalysisService().analyze(
      input(),
      (stage) => {
        stages.push(stage);
      },
    );

    expect(result.mode).toBe("demo");
    expect(result.componentScores.roleMatch).toBeNull();
    expect(result.metrics.keywordMatch).toBeNull();
    expect(result.weightSnapshot.alignment).toBe(0);
    expect(
      result.dimensionScores.some((dimension) => dimension.key === "alignment"),
    ).toBe(false);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(stages).toEqual([
      "validate",
      "structure",
      "evidence",
      "match",
      "score",
      "complete",
    ]);
  });

  it("scores explicit job-description terms without claiming semantic equivalence", async () => {
    const result = await new DeterministicAnalysisService().analyze(
      input("Lead product strategy, SQL analysis, Tableau reporting, and user research."),
    );
    expect(result.componentScores.roleMatch).not.toBeNull();
    expect(result.keywords.some((keyword) => keyword.keyword === "Tableau")).toBe(true);
    expect(
      result.keywords.find((keyword) => keyword.keyword === "Tableau")?.status,
    ).toBe("missing");
  });

  it("fails closed to deterministic mode when semantic output is invalid", async () => {
    const invalidProvider: SemanticAnalysisProvider = {
      name: "invalid-test-provider",
      async enrich(): Promise<Partial<AnalysisResult>> {
        return {
          findings: [{ id: "not-a-complete-finding" }] as unknown as AnalysisResult["findings"],
        };
      },
      async rewrite(): Promise<Recommendation> {
        throw new Error("Not used");
      },
    };

    const result = await new DeterministicAnalysisService(invalidProvider).analyze(
      input("Product strategy and SQL are required."),
    );
    expect(result.mode).toBe("demo");
    expect(result.findings.every((finding) => finding.title.length > 0)).toBe(true);
  });
});
