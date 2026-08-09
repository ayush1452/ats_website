import type { AnalysisInput } from "../contracts/analysis.js";
import type { AnalysisResult } from "../contracts/result.js";
import type { ProviderAssessment } from "./schema.js";

const NUMBER_PATTERN = /(?<![\p{L}\p{N}])(?:[$€£₹]?\d[\d,.]*%?)(?![\p{L}\p{N}])/gu;
const TOKEN_PATTERN = /[\p{L}\p{N}][\p{L}\p{N}+#.-]*/gu;
const STOP_WORDS = new Set([
  "a", "an", "and", "as", "at", "be", "by", "for", "from", "in", "into", "is",
  "it", "of", "on", "or", "that", "the", "this", "to", "was", "were", "with"
]);

export class AiProviderError extends Error {
  readonly code: "AI_TIMEOUT" | "AI_PROVIDER_ERROR" | "AI_INVALID_RESPONSE";

  constructor(
    code: "AI_TIMEOUT" | "AI_PROVIDER_ERROR" | "AI_INVALID_RESPONSE",
    options?: ErrorOptions
  ) {
    super(code === "AI_TIMEOUT" ? "AI review timed out." : "AI review could not be used.", options);
    this.name = "AiProviderError";
    this.code = code;
  }
}

function normalize(value: string): string {
  return value.normalize("NFKC").replace(/\s+/gu, " ").trim().toLocaleLowerCase("en-US");
}

function numericClaims(value: string): Set<string> {
  return new Set((value.match(NUMBER_PATTERN) ?? []).map((item) => normalize(item)));
}

function meaningfulTokens(value: string): Set<string> {
  return new Set(
    (value.match(TOKEN_PATTERN) ?? [])
      .map((item) => normalize(item))
      .filter((item) => item.length > 2 && !STOP_WORDS.has(item))
  );
}

function tokenOverlap(original: string, proposed: string): number {
  const originalTokens = meaningfulTokens(original);
  const proposedTokens = meaningfulTokens(proposed);
  if (originalTokens.size === 0 || proposedTokens.size === 0) return 0;
  const overlap = [...proposedTokens].filter((token) => originalTokens.has(token)).length;
  return overlap / Math.min(originalTokens.size, proposedTokens.size);
}

export function assertGroundedAssessment(
  assessment: ProviderAssessment,
  input: AnalysisInput,
  result: AnalysisResult
): void {
  const normalizedResume = normalize(input.resumeText);
  const knownFindingIds = new Set(result.findings.map((finding) => finding.id));
  const resumeNumbers = numericClaims(input.resumeText);

  for (const suggestion of assessment.suggestions) {
    if (suggestion.findingId !== null && !knownFindingIds.has(suggestion.findingId)) {
      throw new AiProviderError("AI_INVALID_RESPONSE");
    }
    if (!normalizedResume.includes(normalize(suggestion.original))) {
      throw new AiProviderError("AI_INVALID_RESPONSE");
    }
    for (const numericClaim of numericClaims(suggestion.proposed)) {
      if (!resumeNumbers.has(numericClaim)) {
        throw new AiProviderError("AI_INVALID_RESPONSE");
      }
    }
    if (tokenOverlap(suggestion.original, suggestion.proposed) < 0.3) {
      throw new AiProviderError("AI_INVALID_RESPONSE");
    }
  }
}
