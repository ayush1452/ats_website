import { scoringWeights } from "@/config/scoring";

import { clamp, round } from "./text";

export type ScoringDimension =
  | "parseability"
  | "alignment"
  | "experience"
  | "impact"
  | "formatting"
  | "readability";

export type ScoringValues = Record<ScoringDimension, number | null>;
export type ScoringWeightMap = Record<ScoringDimension, number>;

export interface WeightedScore {
  score: number;
  weights: ScoringWeightMap;
  contributions: Record<ScoringDimension, number>;
}

export function normalizedWeights(
  values: ScoringValues,
  weights: ScoringWeightMap = scoringWeights,
): ScoringWeightMap {
  const activeWeight = Object.entries(weights).reduce((sum, [key, weight]) => {
    return values[key as ScoringDimension] === null ? sum : sum + weight;
  }, 0);

  if (activeWeight <= 0) {
    throw new Error("At least one scoring dimension is required");
  }

  return Object.fromEntries(
    Object.entries(weights).map(([key, weight]) => [
      key,
      values[key as ScoringDimension] === null ? 0 : weight / activeWeight,
    ]),
  ) as ScoringWeightMap;
}

export function calculateWeightedScore(
  values: ScoringValues,
  weights: ScoringWeightMap = scoringWeights,
): WeightedScore {
  const effectiveWeights = normalizedWeights(values, weights);
  const contributions = Object.fromEntries(
    Object.entries(effectiveWeights).map(([key, weight]) => {
      const score = values[key as ScoringDimension];
      return [key, score === null ? 0 : clamp(score) * weight];
    }),
  ) as Record<ScoringDimension, number>;

  return {
    score: round(
      Object.values(contributions).reduce((sum, contribution) => sum + contribution, 0),
    ),
    weights: effectiveWeights,
    contributions,
  };
}

export function potentialGain(impacts: number[], currentScore: number): number {
  const unresolvedTotal = impacts.reduce((sum, impact) => sum + Math.max(0, impact), 0);
  return round(Math.min(100 - clamp(currentScore), unresolvedTotal, 25));
}
