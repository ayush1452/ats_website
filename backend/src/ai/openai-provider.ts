import { createHash } from "node:crypto";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { AiAssessment, AiSuggestion } from "../contracts/result.js";
import type {
  AiEnhancementRequest,
  SemanticAiProvider
} from "../services/analysis.js";
import { stableId } from "../scoring/ids.js";
import { AiProviderError, assertGroundedAssessment } from "./grounding.js";
import { redactContactData } from "./redaction.js";
import {
  ProviderAssessmentSchema,
  type ProviderAssessment
} from "./schema.js";

type ProviderRequest = {
  model: string;
  instructions: string;
  input: string;
  store: false;
  max_output_tokens: number;
  reasoning: { effort: "low"; context: "current_turn" };
  safety_identifier: string;
  text: {
    format: ReturnType<typeof zodTextFormat<typeof ProviderAssessmentSchema>>;
    verbosity: "low";
  };
};

export type StructuredAssessmentRequest = (
  request: ProviderRequest,
  options: { signal: AbortSignal; timeout: number }
) => Promise<unknown>;

export type OpenAiProviderOptions = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  request?: StructuredAssessmentRequest;
};

function safeIdentifier(analysisId: string): string {
  return createHash("sha256").update(`hirelight:${analysisId}`).digest("hex").slice(0, 64);
}

function buildProviderInput(request: AiEnhancementRequest): string {
  const resume = redactContactData(request.input.resumeText).slice(0, 24_000);
  const jobDescription = redactContactData(request.input.jobDescription ?? "").slice(0, 12_000);
  const findings = request.deterministicResult.findings.slice(0, 12).map((finding) => ({
    id: finding.id,
    category: finding.category,
    severity: finding.severity,
    title: finding.title,
    description: finding.description,
    evidence: finding.evidence ?? null
  }));
  const componentScores = request.deterministicResult.scores.components.map((component) => ({
    id: component.id,
    score: component.score,
    note: component.note
  }));

  return JSON.stringify({
    task: "Review semantic resume evidence using only the supplied text.",
    targetContext: request.input.context ?? null,
    resume,
    jobDescription: jobDescription || null,
    deterministicBaseline: {
      score: request.deterministicResult.scores.algorithmOverall,
      componentScores,
      findings
    }
  });
}

function instructions(): string {
  return [
    "You are the semantic evidence reviewer inside Hirelight.",
    "Score only the evidence in the supplied resume against the optional role context.",
    "Do not claim to emulate a specific ATS or predict hiring outcomes.",
    "Do not add employers, titles, dates, numbers, outcomes, tools, or achievements absent from the resume.",
    "Every rewrite original must be an exact contiguous excerpt from the resume.",
    "A proposed rewrite may clarify or reorder that excerpt, but must preserve all facts and numeric values.",
    "Use an existing deterministic finding id when a rewrite addresses it; otherwise use null.",
    "Return at most six high-value suggestions. Return an empty list when no grounded rewrite is warranted.",
    "Confidence reflects evidence sufficiency, not certainty about an employer or ATS."
  ].join("\n");
}

function defaultRequest(client: OpenAI): StructuredAssessmentRequest {
  return async (request, options) => {
    const response = await client.responses.parse(request, {
      signal: options.signal,
      timeout: options.timeout,
      maxRetries: 1
    });
    return response.output_parsed;
  };
}

function toSuggestions(
  assessment: ProviderAssessment,
  analysisId: string
): AiSuggestion[] {
  return assessment.suggestions.map((suggestion, index) => ({
    id: stableId("ai-suggestion", analysisId, String(index), suggestion.original, suggestion.proposed),
    findingId: suggestion.findingId,
    original: suggestion.original,
    proposed: suggestion.proposed,
    rationale: suggestion.rationale,
    changes: suggestion.changes,
    factualityWarning:
      "Verify every factual claim before applying. AI wording can be wrong even when it is grounded in the current draft."
  }));
}

export function createOpenAiProvider(options: OpenAiProviderOptions): SemanticAiProvider {
  const client = new OpenAI({
    apiKey: options.apiKey,
    timeout: options.timeoutMs,
    maxRetries: 1
  });
  const requestAssessment = options.request ?? defaultRequest(client);

  return {
    isAvailable: () => options.apiKey.trim().length > 0,
    async enhance(request) {
      if (!options.apiKey.trim()) {
        throw new AiProviderError("AI_PROVIDER_ERROR");
      }

      const timeoutSignal = AbortSignal.timeout(options.timeoutMs);
      const signal = request.signal === undefined
        ? timeoutSignal
        : AbortSignal.any([request.signal, timeoutSignal]);

      let raw: unknown;
      try {
        raw = await requestAssessment(
          {
            model: options.model,
            instructions: instructions(),
            input: buildProviderInput(request),
            store: false,
            max_output_tokens: 4_000,
            reasoning: { effort: "low", context: "current_turn" },
            safety_identifier: safeIdentifier(request.deterministicResult.analysisId),
            text: {
              format: zodTextFormat(ProviderAssessmentSchema, "hirelight_semantic_review"),
              verbosity: "low"
            }
          },
          { signal, timeout: options.timeoutMs }
        );
      } catch (error) {
        if (signal.aborted) throw new AiProviderError("AI_TIMEOUT", { cause: error });
        if (error instanceof AiProviderError) throw error;
        throw new AiProviderError("AI_PROVIDER_ERROR", { cause: error });
      }

      const parsed = ProviderAssessmentSchema.safeParse(raw);
      if (!parsed.success) {
        throw new AiProviderError("AI_INVALID_RESPONSE", { cause: parsed.error });
      }
      assertGroundedAssessment(parsed.data, request.input, request.deterministicResult);

      const assessment: AiAssessment = {
        status: "completed",
        score: parsed.data.score,
        confidence: parsed.data.confidence,
        provider: "openai",
        model: options.model,
        summary: parsed.data.summary,
        fallbackCode: null,
        suggestions: toSuggestions(parsed.data, request.deterministicResult.analysisId)
      };
      return assessment;
    }
  };
}
