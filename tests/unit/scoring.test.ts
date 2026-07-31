import { describe, expect, it } from "vitest";

import {
  calculateWeightedScore,
  normalizedWeights,
  potentialGain,
  type ScoringValues,
} from "@/lib/analysis";

describe("transparent scoring", () => {
  it("uses all configured weights when a job description is present", () => {
    const values: ScoringValues = {
      parseability: 80,
      alignment: 60,
      experience: 70,
      impact: 50,
      formatting: 90,
      readability: 80,
    };

    const result = calculateWeightedScore(values);
    expect(result.score).toBe(70);
    expect(
      Object.values(result.contributions).reduce(
        (sum, contribution) => sum + contribution,
        0,
      ),
    ).toBe(69.5);
    expect(Object.values(result.weights).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
  });

  it("marks alignment unavailable and proportionally normalizes the remaining weights", () => {
    const values: ScoringValues = {
      parseability: 80,
      alignment: null,
      experience: 70,
      impact: 60,
      formatting: 90,
      readability: 80,
    };

    const weights = normalizedWeights(values);
    const result = calculateWeightedScore(values);

    expect(weights.alignment).toBe(0);
    expect(weights.parseability).toBeCloseTo(0.2 / 0.75);
    expect(Object.values(weights).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
    expect(result.score).toBe(75);
  });

  it("caps potential gains at both 25 points and the remaining score range", () => {
    expect(potentialGain([8, 7, 15], 62)).toBe(25);
    expect(potentialGain([8, 7, 15], 91)).toBe(9);
  });
});
