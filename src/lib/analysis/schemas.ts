import { z } from "zod";

const finiteScore = z.number().finite().min(0).max(100);
const unitScore = z.number().finite().min(0).max(1);

export const textSpanSchema = z
  .object({
    id: z.string().min(1).max(128),
    page: z.number().int().min(1),
    text: z.string(),
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
    width: z.number().finite().nonnegative().optional(),
    height: z.number().finite().nonnegative().optional(),
  })
  .strict()
  .refine((span) => span.end >= span.start, {
    message: "Text span end must not precede start",
    path: ["end"],
  });

export const resumeSectionSchema = z
  .object({
    id: z.string().min(1).max(128),
    name: z.string().min(1).max(80),
    heading: z.string().min(1).max(160),
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
    order: z.number().int().nonnegative(),
    confidence: unitScore,
  })
  .strict()
  .refine((section) => section.end >= section.start, {
    message: "Section end must not precede start",
    path: ["end"],
  });

export const layoutSignalSchema = z
  .object({
    type: z.enum(["column", "table", "text-box", "header", "footer", "image", "encoding"]),
    page: z.number().int().min(1),
    confidence: unitScore,
    detail: z.string().min(1).max(500),
  })
  .strict();

export const canonicalResumeDocumentSchema = z
  .object({
    version: z.literal(1),
    filename: z.string().min(1).max(255),
    fileType: z.enum(["pdf", "docx", "txt", "pasted"]),
    pageCount: z.number().int().min(1).max(1_000),
    normalizedText: z.string().min(1).max(1_500_000),
    spans: z.array(textSpanSchema).max(100_000),
    sections: z.array(resumeSectionSchema).max(100),
    layoutSignals: z.array(layoutSignalSchema).max(1_000),
    extractionConfidence: unitScore,
  })
  .strict();

export const analysisInputSchema = z
  .object({
    document: canonicalResumeDocumentSchema,
    jobDescription: z.string().trim().max(200_000).optional(),
    jobTitle: z.string().trim().max(160).optional(),
    company: z.string().trim().max(160).optional(),
    targetRole: z.string().trim().min(1).max(160),
    seniority: z.string().trim().min(1).max(80),
    industry: z.string().trim().min(1).max(120),
    market: z.string().trim().min(1).max(120),
    goal: z.enum(["ats", "match", "general"]),
  })
  .strict();

export const scoreValueSchema = z
  .object({
    key: z.string().min(1).max(80),
    label: z.string().min(1).max(120),
    score: finiteScore,
    explanation: z.string().min(1).max(2_000),
  })
  .strict();

export const findingSchema = z
  .object({
    id: z.string().min(1).max(128),
    category: z.enum([
      "format",
      "keywords",
      "experience",
      "impact",
      "readability",
      "sections",
      "job-match",
    ]),
    severity: z.enum(["critical", "high", "medium", "low", "passed"]),
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(4_000),
    whyItMatters: z.string().min(1).max(4_000),
    recommendation: z.string().min(1).max(4_000),
    sourceText: z.string().max(20_000).optional(),
    sourceSection: z.string().max(120).optional(),
    sourceStart: z.number().int().nonnegative().optional(),
    sourceEnd: z.number().int().nonnegative().optional(),
    scoreImpact: z.number().finite().min(0).max(100),
    effort: z.enum(["low", "medium", "high"]),
    status: z.enum(["open", "resolved", "dismissed"]),
    requiresVerification: z.boolean().optional(),
  })
  .strict()
  .refine(
    (finding) =>
      finding.sourceStart === undefined ||
      finding.sourceEnd === undefined ||
      finding.sourceEnd >= finding.sourceStart,
    { message: "Finding source end must not precede start", path: ["sourceEnd"] },
  );

export const annotationSchema = z
  .object({
    id: z.string().min(1).max(128),
    findingId: z.string().min(1).max(128),
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    status: z.enum([
      "strong",
      "matched",
      "partial",
      "related",
      "missing",
      "uncertain",
      "overused",
      "critical",
      "high",
      "medium",
      "low",
      "passed",
    ]),
    label: z.string().min(1).max(240),
  })
  .strict()
  .refine((annotation) => annotation.end >= annotation.start, {
    message: "Annotation end must not precede start",
    path: ["end"],
  });

export const keywordMatchSchema = z
  .object({
    keyword: z.string().min(1).max(160),
    status: z.enum([
      "strong",
      "matched",
      "partial",
      "related",
      "missing",
      "uncertain",
      "overused",
    ]),
    group: z.string().min(1).max(120),
    requirementType: z.enum(["must-have", "preferred", "context"]),
    importance: z.number().finite().min(0).max(10),
    resumeFrequency: z.number().int().nonnegative(),
    jobFrequency: z.number().int().nonnegative(),
    scoreImpact: z.number().finite().min(0).max(100),
    recommendedSection: z.string().max(120).optional(),
    evidence: z.string().max(2_000).optional(),
  })
  .strict();

export const sectionAnalysisSchema = z
  .object({
    name: z.string().min(1).max(120),
    status: z.enum(["detected", "missing", "warning"]),
    confidence: unitScore,
    order: z.number().int().nonnegative().nullable(),
    length: z.number().int().nonnegative(),
    relevance: finiteScore,
    readability: finiteScore,
    issue: z.string().max(1_000).optional(),
    action: z.string().min(1).max(1_000),
  })
  .strict();

export const jobRequirementSchema = z
  .object({
    requirement: z.string().min(1).max(500),
    type: z.enum(["must-have", "preferred"]),
    importance: z.number().finite().min(0).max(10),
    status: z.enum([
      "strong",
      "matched",
      "partial",
      "related",
      "missing",
      "uncertain",
      "overused",
    ]),
    evidence: z.string().max(2_000).optional(),
    evidenceLocation: z.string().max(240).optional(),
    score: finiteScore,
    explanation: z.string().min(1).max(2_000),
    action: z.string().min(1).max(2_000),
  })
  .strict();

export const recommendationSchema = z
  .object({
    id: z.string().min(1).max(128),
    findingId: z.string().min(1).max(128),
    title: z.string().min(1).max(240),
    originalText: z.string().max(20_000),
    suggestedText: z.string().max(20_000),
    rationale: z.string().min(1).max(4_000),
    changes: z.array(z.string().min(1).max(1_000)).max(20),
    requiresVerification: z.boolean(),
    status: z.enum(["pending", "applied", "rejected"]),
  })
  .strict();

export const analysisResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    analyzerVersion: z.string().min(1).max(40),
    mode: z.enum(["demo", "deterministic", "hybrid"]),
    overallScore: finiteScore,
    confidence: unitScore,
    completedAt: z.string().datetime({ offset: true }),
    componentScores: z
      .object({
        atsParse: finiteScore,
        recruiterClarity: finiteScore,
        roleMatch: finiteScore.nullable(),
      })
      .strict(),
    dimensionScores: z.array(scoreValueSchema).min(1).max(30),
    metrics: z
      .object({
        keywordMatch: finiteScore.nullable(),
        impact: finiteScore,
        readability: finiteScore,
        achievementDensity: finiteScore,
        requirementCoverage: finiteScore.nullable(),
        formatRisk: finiteScore,
      })
      .strict(),
    keywords: z.array(keywordMatchSchema).max(250),
    sections: z.array(sectionAnalysisSchema).max(100),
    requirements: z.array(jobRequirementSchema).max(100),
    findings: z.array(findingSchema).max(500),
    recommendations: z.array(recommendationSchema).max(100),
    annotations: z.array(annotationSchema).max(1_000),
    benchmark: z
      .object({
        label: z.string().min(1).max(160),
        score: finiteScore,
        explanation: z.string().min(1).max(1_000),
      })
      .strict(),
    scoreTrend: z
      .array(
        z
          .object({
            label: z.string().min(1).max(80),
            score: finiteScore,
          })
          .strict(),
      )
      .max(100),
    weightSnapshot: z.record(z.string().min(1).max(80), z.number().finite().min(0).max(1)),
  })
  .strict();

export const semanticDomainEnrichmentSchema = z
  .object({
    requirements: z.array(jobRequirementSchema).max(100).optional(),
    findings: z.array(findingSchema).max(100).optional(),
    recommendations: z.array(recommendationSchema).max(50).optional(),
  })
  .strict();

const structuredRequirementSchema = z
  .object({
    requirement: z.string().min(1).max(500),
    type: z.enum(["must-have", "preferred"]),
    importance: z.number().finite().min(0).max(10),
    status: z.enum([
      "strong",
      "matched",
      "partial",
      "related",
      "missing",
      "uncertain",
      "overused",
    ]),
    evidence: z.string().max(2_000).nullable(),
    evidenceLocation: z.string().max(240).nullable(),
    score: finiteScore,
    explanation: z.string().min(1).max(2_000),
    action: z.string().min(1).max(2_000),
  })
  .strict();

const structuredFindingSchema = z
  .object({
    id: z.string().min(1).max(128),
    category: z.enum([
      "format",
      "keywords",
      "experience",
      "impact",
      "readability",
      "sections",
      "job-match",
    ]),
    severity: z.enum(["critical", "high", "medium", "low", "passed"]),
    title: z.string().min(1).max(240),
    description: z.string().min(1).max(4_000),
    whyItMatters: z.string().min(1).max(4_000),
    recommendation: z.string().min(1).max(4_000),
    sourceText: z.string().max(20_000).nullable(),
    sourceSection: z.string().max(120).nullable(),
    sourceStart: z.number().int().nonnegative().nullable(),
    sourceEnd: z.number().int().nonnegative().nullable(),
    scoreImpact: z.number().finite().min(0).max(100),
    effort: z.enum(["low", "medium", "high"]),
    status: z.enum(["open", "resolved", "dismissed"]),
    requiresVerification: z.boolean(),
  })
  .strict();

export const semanticEnrichmentSchema = z
  .object({
    requirements: z.array(structuredRequirementSchema).max(100),
    findings: z.array(structuredFindingSchema).max(100),
    recommendations: z.array(recommendationSchema).max(50),
  })
  .strict();

export const rewriteRequestSchema = z
  .object({
    source: z.string().trim().min(1).max(20_000),
    context: z.string().trim().max(20_000).default(""),
    instruction: z.string().trim().min(1).max(2_000),
  })
  .strict();

export const scanJsonRequestSchema = z
  .object({
    resumeText: z.string().trim().min(40).max(1_500_000),
    filename: z.string().trim().min(1).max(255).default("pasted-resume.txt"),
    resumeId: z.string().uuid().optional(),
    jobDescription: z.string().trim().max(200_000).optional(),
    jobTitle: z.string().trim().max(160).optional(),
    company: z.string().trim().max(160).optional(),
    targetRole: z.string().trim().min(1).max(160).default("Target role"),
    seniority: z.string().trim().min(1).max(80).default("Not specified"),
    industry: z.string().trim().min(1).max(120).default("Not specified"),
    market: z.string().trim().min(1).max(120).default("Not specified"),
    goal: z.enum(["ats", "match", "general"]).default("general"),
  })
  .strict();

export type SemanticEnrichment = z.infer<typeof semanticDomainEnrichmentSchema>;
