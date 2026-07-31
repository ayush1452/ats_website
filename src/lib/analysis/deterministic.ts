import { analyzerConfig } from "@/config/scoring";
import type {
  AnalysisInput,
  AnalysisMode,
  AnalysisResult,
  AnalysisService,
  Finding,
  FindingCategory,
  JobRequirement,
  KeywordMatch,
  Recommendation,
  SectionAnalysis,
  SemanticAnalysisProvider,
  Severity,
} from "@/types/domain";

import {
  analysisInputSchema,
  analysisResultSchema,
  semanticDomainEnrichmentSchema,
} from "./schemas";
import { calculateWeightedScore, type ScoringValues } from "./scoring";
import {
  bulletLines,
  calculateReadability,
  clamp,
  createAnnotation,
  detectSections,
  detectWeakVerbs,
  extractKeywords,
  hasQuantifiedOutcome,
  inspectDateConsistency,
  keywordStuffingRatio,
  phraseFrequency,
  round,
  words,
} from "./text";

const STAGE_MESSAGES = {
  validate: "Validating the resume and analysis context",
  structure: "Reviewing sections and parseability",
  evidence: "Measuring experience evidence and writing clarity",
  match: "Comparing the resume with the job description",
  score: "Calculating transparent weighted scores",
  semantic: "Checking semantic evidence with the configured provider",
  complete: "Analysis complete",
} as const;

type Stage = keyof typeof STAGE_MESSAGES;

async function emitStage(
  stage: Stage,
  onStage?: (stage: string) => void | Promise<void>,
): Promise<void> {
  await onStage?.(stage);
}

function severityFor(score: number): Severity {
  if (score < 45) return "high";
  if (score < 70) return "medium";
  if (score < 85) return "low";
  return "passed";
}

function finding(input: {
  id: string;
  category: FindingCategory;
  score: number;
  title: string;
  description: string;
  whyItMatters: string;
  recommendation: string;
  impact: number;
  sourceText?: string;
  sourceSection?: string;
  effort?: Finding["effort"];
  requiresVerification?: boolean;
}): Finding {
  return {
    id: input.id,
    category: input.category,
    severity: severityFor(input.score),
    title: input.title,
    description: input.description,
    whyItMatters: input.whyItMatters,
    recommendation: input.recommendation,
    sourceText: input.sourceText,
    sourceSection: input.sourceSection,
    scoreImpact: input.impact,
    effort: input.effort ?? "low",
    status: input.score >= 85 ? "resolved" : "open",
    requiresVerification: input.requiresVerification,
  };
}

function analyzeSections(input: AnalysisInput, readability: number): SectionAnalysis[] {
  const detected =
    input.document.sections.length > 0
      ? input.document.sections
      : detectSections(input.document.normalizedText);
  const expected = ["Summary", "Experience", "Skills", "Education"];

  return expected.map((name) => {
    const section = detected.find(
      (candidate) => candidate.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (!section) {
      return {
        name,
        status: "missing",
        confidence: 0.94,
        order: null,
        length: 0,
        relevance: 0,
        readability: 0,
        issue: `${name} was not detected as a distinct section.`,
        action: `Add a clearly labeled ${name.toLocaleLowerCase()} section when it reflects your background.`,
      };
    }

    const length = Math.max(0, section.end - section.start);
    return {
      name,
      status: length < 30 ? "warning" : "detected",
      confidence: section.confidence,
      order: section.order,
      length,
      relevance: clamp(length / (name === "Experience" ? 8 : 3)),
      readability,
      issue: length < 30 ? "This section contains very little extractable text." : undefined,
      action:
        length < 30
          ? "Add concise, truthful details in plain text."
          : "Keep the heading and content in a simple reading order.",
    };
  });
}

function keywordGroup(keyword: string): string {
  const technical = new Set([
    "api",
    "aws",
    "azure",
    "figma",
    "javascript",
    "jira",
    "mixpanel",
    "python",
    "react",
    "sql",
    "tableau",
  ]);
  const normalized = keyword.toLocaleLowerCase();
  if (technical.has(normalized)) return "Tools & technology";
  if (/lead|manage|strategy|roadmap|stakeholder/.test(normalized)) return "Leadership";
  return "Role signals";
}

function analyzeKeywords(input: AnalysisInput): KeywordMatch[] {
  if (!input.jobDescription?.trim()) return [];
  const resumeText = input.document.normalizedText;
  return extractKeywords(input.jobDescription, 24).map((keyword, index) => {
    const resumeFrequency = phraseFrequency(resumeText, keyword);
    const jobFrequency = phraseFrequency(input.jobDescription ?? "", keyword);
    const stuffingRatio = keywordStuffingRatio(resumeText, keyword);
    const status: KeywordMatch["status"] =
      stuffingRatio > 0.035
        ? "overused"
        : resumeFrequency > 0
          ? resumeFrequency >= Math.max(1, jobFrequency)
            ? "strong"
            : "matched"
          : "missing";

    return {
      keyword,
      status,
      group: keywordGroup(keyword),
      requirementType: index < 8 ? "must-have" : index < 16 ? "preferred" : "context",
      importance: round(Math.max(1, 10 - index * 0.32), 1),
      resumeFrequency,
      jobFrequency,
      scoreImpact: round(Math.max(0.5, 4 - index * 0.12), 1),
      recommendedSection:
        status === "missing" ? (keywordGroup(keyword) === "Tools & technology" ? "Skills" : "Experience") : undefined,
      evidence:
        resumeFrequency > 0
          ? `Found ${resumeFrequency} ${resumeFrequency === 1 ? "mention" : "mentions"} in the resume.`
          : undefined,
    };
  });
}

function keywordScore(keywords: KeywordMatch[]): number | null {
  if (keywords.length === 0) return null;
  const maximum = keywords.reduce((sum, keyword) => sum + keyword.importance, 0);
  const achieved = keywords.reduce((sum, keyword) => {
    const multiplier =
      keyword.status === "strong"
        ? 1
        : keyword.status === "matched"
          ? 0.9
          : keyword.status === "related" || keyword.status === "partial"
            ? 0.55
            : keyword.status === "overused"
              ? 0.35
              : 0;
    return sum + keyword.importance * multiplier;
  }, 0);
  return round((achieved / Math.max(1, maximum)) * 100);
}

function jobRequirements(keywords: KeywordMatch[]): JobRequirement[] {
  return keywords
    .filter((keyword) => keyword.requirementType !== "context")
    .slice(0, 12)
    .map((keyword) => ({
      requirement: keyword.keyword,
      type: keyword.requirementType === "must-have" ? "must-have" : "preferred",
      importance: keyword.importance,
      status: keyword.status,
      evidence: keyword.evidence,
      evidenceLocation: keyword.resumeFrequency > 0 ? "Resume text" : undefined,
      score:
        keyword.status === "strong"
          ? 100
          : keyword.status === "matched"
            ? 90
            : keyword.status === "partial" || keyword.status === "related"
              ? 55
              : 0,
      explanation:
        keyword.resumeFrequency > 0
          ? "The resume contains explicit text evidence for this term."
          : "No explicit text evidence was detected. This is not proof that the candidate lacks the skill.",
      action:
        keyword.resumeFrequency > 0
          ? "Keep the evidence specific and connected to an outcome."
          : "Add this only when it is truthful, preferably with evidence in experience or projects.",
    }));
}

function deterministicRecommendation(
  weakSource: string | undefined,
  weakFindingId: string | undefined,
): Recommendation[] {
  if (!weakSource || !weakFindingId) return [];
  return [
    {
      id: "recommendation-stronger-evidence",
      findingId: weakFindingId,
      title: "Turn a responsibility into outcome evidence",
      originalText: weakSource,
      suggestedText:
        "Led [specific initiative] for [audience or scope], resulting in [verified outcome and measurement].",
      rationale:
        "A concrete action, scope, and verified outcome make the contribution easier to evaluate.",
      changes: [
        "Uses a direct action verb",
        "Prompts for scope",
        "Leaves the result as a fact-checkable placeholder",
      ],
      requiresVerification: true,
      status: "pending",
    },
  ];
}

export class DeterministicAnalysisService implements AnalysisService {
  constructor(
    private readonly semanticProvider?: SemanticAnalysisProvider,
    private readonly deterministicMode: Exclude<AnalysisMode, "hybrid"> =
      "demo",
  ) {}

  async analyze(
    rawInput: AnalysisInput,
    onStage?: (stage: string) => void | Promise<void>,
  ): Promise<AnalysisResult> {
    await emitStage("validate", onStage);
    const input = analysisInputSchema.parse(rawInput) as AnalysisInput;
    const text = input.document.normalizedText;
    const textWords = words(text);
    const detectedBullets = bulletLines(text);
    const dateInspection = inspectDateConsistency(text);
    const readabilityStats = calculateReadability(text);

    await emitStage("structure", onStage);
    const detectedSections =
      input.document.sections.length > 0
        ? input.document.sections
        : detectSections(input.document.normalizedText);
    const requiredSectionCount = ["summary", "experience", "skills", "education"].filter(
      (name) =>
        detectedSections.some(
          (section) => section.name.toLocaleLowerCase() === name,
        ),
    ).length;
    const contactSignals =
      Number(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/iu.test(text)) +
      Number(/(?:\+\d{1,3}\s*)?(?:\(?\d{3}\)?[\s.-]*)?\d{3}[\s.-]*\d{4}\b/.test(text));
    const riskyLayoutCount = input.document.layoutSignals.filter((signal) =>
      ["column", "table", "text-box", "encoding"].includes(signal.type),
    ).length;
    const parseability = clamp(
      input.document.extractionConfidence * 75 +
        requiredSectionCount * 4 +
        contactSignals * 4.5 -
        riskyLayoutCount * 12,
    );
    const formatting = clamp(
      100 -
        riskyLayoutCount * 24 -
        (dateInspection.consistent ? 0 : 12) -
        (textWords.length > 1_400 ? 10 : 0),
    );

    await emitStage("evidence", onStage);
    const quantifiedBullets = detectedBullets.filter(hasQuantifiedOutcome);
    const weakVerbs = detectWeakVerbs(text);
    const bulletBase = Math.max(1, detectedBullets.length);
    const achievementDensity = round((quantifiedBullets.length / bulletBase) * 100);
    const experience = clamp(
      46 +
        Math.min(28, detectedBullets.length * 2.5) +
        Math.min(24, achievementDensity * 0.24) -
        Math.min(14, weakVerbs.length * 2),
    );
    const impact = clamp(
      32 +
        Math.min(58, achievementDensity * 0.58) -
        Math.min(16, weakVerbs.length * 2),
    );
    const readability = clamp(
      100 -
        Math.abs(10 - readabilityStats.gradeLevel) * 6 -
        Math.max(0, textWords.length / Math.max(1, readabilityStats.sentences) - 28) * 1.5,
    );

    await emitStage("match", onStage);
    const keywords = analyzeKeywords(input);
    const alignment = keywordScore(keywords);
    const requirements = jobRequirements(keywords);
    const requirementCoverage =
      requirements.length === 0
        ? null
        : round(
            (requirements.filter((requirement) =>
              ["strong", "matched", "partial", "related"].includes(requirement.status),
            ).length /
              requirements.length) *
              100,
          );

    const values: ScoringValues = {
      parseability,
      alignment,
      experience,
      impact,
      formatting,
      readability,
    };

    await emitStage("score", onStage);
    const weighted = calculateWeightedScore(values);
    const weakestBullet =
      detectedBullets.find(
        (bullet) => !hasQuantifiedOutcome(bullet) && detectWeakVerbs(bullet).length > 0,
      ) ?? detectedBullets.find((bullet) => !hasQuantifiedOutcome(bullet));
    const missingSections = 4 - requiredSectionCount;
    const missingKeyword = keywords.find((keyword) => keyword.status === "missing");
    const findings: Finding[] = [
      finding({
        id: "finding-layout-parseability",
        category: "format",
        score: formatting,
        title:
          riskyLayoutCount > 0
            ? "Complex layout signals may change reading order"
            : "Resume uses a straightforward text structure",
        description:
          riskyLayoutCount > 0
            ? `${riskyLayoutCount} layout ${riskyLayoutCount === 1 ? "signal was" : "signals were"} detected, including tables, columns, text boxes, or encoding concerns.`
            : "No table, multi-column, text-box, or encoding signal was detected in the extracted document.",
        whyItMatters:
          "Complex visual structures can produce a different text order when a document is extracted.",
        recommendation:
          riskyLayoutCount > 0
            ? "Use a single-column layout and plain text headings for essential information."
            : "Keep essential information in this simple reading order.",
        impact: riskyLayoutCount > 0 ? 8 : 0,
        effort: riskyLayoutCount > 0 ? "medium" : "low",
      }),
      finding({
        id: "finding-achievement-evidence",
        category: "impact",
        score: impact,
        title:
          achievementDensity < 45
            ? "Several bullets lack measurable outcome evidence"
            : "Most bullets include concrete outcome evidence",
        description: `${quantifiedBullets.length} of ${detectedBullets.length} detected bullets include a quantity or measurable scope.`,
        whyItMatters:
          "Specific scope and outcomes help a reviewer understand the size and consequence of the work.",
        recommendation:
          "Add verified quantities, time saved, adoption, revenue, quality, or customer outcomes where they are available.",
        impact: achievementDensity < 45 ? 7 : 0,
        sourceText: weakestBullet,
        sourceSection: "Experience",
        effort: "medium",
        requiresVerification: true,
      }),
      finding({
        id: "finding-section-structure",
        category: "sections",
        score: missingSections === 0 ? 100 : 100 - missingSections * 20,
        title:
          missingSections === 0
            ? "Core resume sections are clearly labeled"
            : `${missingSections} core ${missingSections === 1 ? "section was" : "sections were"} not detected`,
        description:
          missingSections === 0
            ? "Summary, experience, skills, and education headings were detected."
            : "One or more common resume sections could not be found as distinct headings.",
        whyItMatters:
          "Clear conventional headings make the document easier to scan and parse consistently.",
        recommendation: "Use concise plain-text headings for each relevant section.",
        impact: missingSections * 3,
      }),
    ];

    if (!dateInspection.consistent) {
      findings.push(
        finding({
          id: "finding-date-consistency",
          category: "format",
          score: 55,
          title: "Date formats are inconsistent",
          description: `The document mixes ${dateInspection.formats.join(" and ")} date styles.`,
          whyItMatters: "Consistent dates improve visual scanning and reduce ambiguity.",
          recommendation: "Choose one date style, such as “Jan 2023 – Mar 2025,” throughout.",
          impact: 3,
        }),
      );
    }

    if (missingKeyword) {
      findings.push(
        finding({
          id: "finding-keyword-gap",
          category: "keywords",
          score: alignment ?? 0,
          title: `No explicit evidence found for “${missingKeyword.keyword}”`,
          description:
            "The term appears in the job description but was not detected in the resume.",
          whyItMatters:
            "Explicit, truthful terminology can make relevant evidence easier for a reviewer to locate.",
          recommendation: `Add “${missingKeyword.keyword}” only if it accurately describes your experience.`,
          impact: missingKeyword.scoreImpact,
          effort: "low",
          requiresVerification: true,
        }),
      );
    }

    const annotations = findings.flatMap((item, index) => {
      if (!item.sourceText) return [];
      const annotation = createAnnotation({
        id: `annotation-${index + 1}`,
        findingId: item.id,
        document: input.document,
        sourceText: item.sourceText,
        severity: item.severity,
        label: item.title,
      });
      if (!annotation) return [];
      item.sourceStart = annotation.start;
      item.sourceEnd = annotation.end;
      return [annotation];
    });

    const sections = analyzeSections(input, readability);
    const base: AnalysisResult = {
      schemaVersion: 1,
      analyzerVersion: analyzerConfig.version,
      mode: this.deterministicMode,
      overallScore: weighted.score,
      confidence: round(
        clamp(
          input.document.extractionConfidence * 0.7 +
            Math.min(1, textWords.length / 350) * 0.2 +
            (input.jobDescription ? 0.1 : 0.06),
          0,
          1,
        ),
        2,
      ),
      completedAt: new Date().toISOString(),
      componentScores: {
        atsParse: round(parseability * 0.7 + formatting * 0.3),
        recruiterClarity: round(experience * 0.45 + impact * 0.3 + readability * 0.25),
        roleMatch: alignment,
      },
      dimensionScores: [
        {
          key: "parseability",
          label: "ATS parseability",
          score: round(parseability),
          explanation: "Extraction confidence, contact signals, section labels, and layout risk.",
        },
        ...(alignment === null
          ? []
          : [
              {
                key: "alignment",
                label: "Job & keyword alignment",
                score: alignment,
                explanation:
                  "Weighted explicit term coverage from the supplied job description.",
              },
            ]),
        {
          key: "experience",
          label: "Experience evidence",
          score: round(experience),
          explanation: "Bullet structure, action language, and concrete evidence density.",
        },
        {
          key: "impact",
          label: "Achievements & impact",
          score: round(impact),
          explanation: "Detected quantities and measurable scope in experience bullets.",
        },
        {
          key: "formatting",
          label: "Structure & formatting",
          score: round(formatting),
          explanation: "Reading order, layout signals, length, and date consistency.",
        },
        {
          key: "readability",
          label: "Readability & clarity",
          score: round(readability),
          explanation: "Sentence length and a deterministic readability estimate.",
        },
      ],
      metrics: {
        keywordMatch: alignment,
        impact: round(impact),
        readability: round(readability),
        achievementDensity,
        requirementCoverage,
        formatRisk: round(100 - formatting),
      },
      keywords,
      sections,
      requirements,
      findings,
      recommendations: deterministicRecommendation(
        weakestBullet,
        weakestBullet ? "finding-achievement-evidence" : undefined,
      ),
      annotations,
      benchmark: {
        label: "Curated strong-resume target",
        score: 85,
        explanation:
          "An illustrative product target for context, not a result derived from a proprietary resume dataset.",
      },
      scoreTrend: [{ label: "Current", score: weighted.score }],
      weightSnapshot: weighted.weights,
    };

    if (!this.semanticProvider) {
      await emitStage("complete", onStage);
      return analysisResultSchema.parse(base) as AnalysisResult;
    }

    await emitStage("semantic", onStage);
    try {
      const rawEnrichment = await this.semanticProvider.enrich(input, base);
      const enrichment = semanticDomainEnrichmentSchema.parse({
        requirements: rawEnrichment.requirements,
        findings: rawEnrichment.findings,
        recommendations: rawEnrichment.recommendations,
      });
      const enriched: AnalysisResult = {
        ...base,
        mode: "hybrid",
        requirements: enrichment.requirements ?? base.requirements,
        findings: enrichment.findings
          ? [...base.findings, ...enrichment.findings]
          : base.findings,
        recommendations: enrichment.recommendations
          ? [...base.recommendations, ...enrichment.recommendations]
          : base.recommendations,
      };
      await emitStage("complete", onStage);
      return analysisResultSchema.parse(enriched) as AnalysisResult;
    } catch {
      // Provider errors and invalid payloads fall back to the validated deterministic result.
      await emitStage("complete", onStage);
      return analysisResultSchema.parse(base) as AnalysisResult;
    }
  }
}

export { STAGE_MESSAGES };
