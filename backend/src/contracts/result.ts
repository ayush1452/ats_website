import { z } from "zod";

export const ScoreComponentIdSchema = z.enum([
  "parseability",
  "jobAlignment",
  "experienceEvidence",
  "impact",
  "structure",
  "readability"
]);
export type ScoreComponentId = z.infer<typeof ScoreComponentIdSchema>;

export const ScoreComponentSchema = z.object({
  id: ScoreComponentIdSchema,
  label: z.string(),
  score: z.number().min(0).max(100).nullable(),
  status: z.enum(["scored", "unavailable"]),
  weight: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  note: z.string(),
  signals: z.record(z.string(), z.number().min(0).max(100))
});
export type ScoreComponent = z.infer<typeof ScoreComponentSchema>;

export const ResumeDimensionIdSchema = z.enum([
  "workExperience",
  "skillsMatch",
  "education",
  "achievements",
  "formatting",
  "certifications"
]);
export type ResumeDimensionId = z.infer<typeof ResumeDimensionIdSchema>;

export const ResumeDimensionSchema = z.object({
  id: ResumeDimensionIdSchema,
  label: z.string(),
  score: z.number().min(0).max(100).nullable(),
  status: z.enum(["scored", "unavailable"]),
  confidence: z.number().min(0).max(1),
  note: z.string()
});
export type ResumeDimension = z.infer<typeof ResumeDimensionSchema>;

export const FindingSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  category: ScoreComponentIdSchema,
  severity: z.enum(["critical", "warning", "info", "positive"]),
  title: z.string(),
  description: z.string(),
  estimatedGain: z.number().min(0).max(20).nullable(),
  annotationIds: z.array(z.string()),
  evidence: z.string().optional()
});
export type Finding = z.infer<typeof FindingSchema>;

export const AnnotationSchema = z.object({
  id: z.string(),
  findingId: z.string(),
  page: z.number().int().positive(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  excerpt: z.string(),
  sourceSpanIds: z.array(z.string()).optional(),
  boxes: z.array(z.lazy(() => SourceBoxSchema)).optional()
});
export type Annotation = z.infer<typeof AnnotationSchema>;

export const RecommendationSchema = z.object({
  id: z.string(),
  findingId: z.string(),
  priority: z.number().int().positive(),
  title: z.string(),
  action: z.string(),
  estimatedGain: z.number().min(0).max(20).nullable()
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const AiSuggestionSchema = z.object({
  id: z.string(),
  findingId: z.string().nullable(),
  original: z.string().max(1_000),
  proposed: z.string().max(1_000),
  rationale: z.string().max(600),
  changes: z.array(z.string().max(160)).max(6),
  factualityWarning: z.string().max(300)
});
export type AiSuggestion = z.infer<typeof AiSuggestionSchema>;

export const AiAssessmentSchema = z.object({
  status: z.enum(["disabled", "not_configured", "completed", "fallback"]),
  score: z.number().min(0).max(100).nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  provider: z.literal("openai").nullable(),
  model: z.string().nullable(),
  summary: z.string().nullable(),
  fallbackCode: z.enum(["AI_NOT_CONFIGURED", "AI_TIMEOUT", "AI_PROVIDER_ERROR", "AI_INVALID_RESPONSE"]).nullable(),
  suggestions: z.array(AiSuggestionSchema)
});
export type AiAssessment = z.infer<typeof AiAssessmentSchema>;

export const KeywordResultSchema = z.object({
  available: z.boolean(),
  coverage: z.number().min(0).max(100).nullable(),
  matched: z.array(z.string()),
  partial: z.array(z.string()),
  missing: z.array(
    z.object({
      term: z.string(),
      priority: z.enum(["critical", "high", "medium"])
    })
  ),
  stuffing: z.array(z.string()),
  requirements: z.array(z.object({
    term: z.string(),
    kind: z.enum(["keyword", "phrase"]),
    priority: z.enum(["critical", "high", "medium"]),
    status: z.enum(["matched", "partial", "missing"]),
    jobOccurrences: z.number().int().positive(),
    resumeEvidence: z.array(z.object({
      start: z.number().int().nonnegative(),
      end: z.number().int().nonnegative(),
      excerpt: z.string()
    }))
  }))
});

export const SourceBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative()
});

const CanonicalPageGeometrySchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number(),
  viewBox: z.tuple([
    z.number(),
    z.number(),
    z.number(),
    z.number()
  ]),
  transform: z.tuple([
    z.number(),
    z.number(),
    z.number(),
    z.number(),
    z.number(),
    z.number()
  ]),
  userUnit: z.number().positive(),
  coordinateSpace: z.literal("pdf-user-space"),
  unit: z.literal("pdf-point"),
  origin: z.literal("bottom-left")
});

const CanonicalTextSpanSchema = z.object({
  id: z.string(),
  page: z.number().int().positive(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  text: z.string(),
  kind: z.enum(["text", "heading", "list-item", "table-cell"]),
  box: SourceBoxSchema.optional()
});

const LayoutSignalsSchema = z.object({
  tableCount: z.number().int().nonnegative(),
  textBoxCount: z.number().int().nonnegative(),
  columnCount: z.number().int().positive(),
  explicitPageBreaks: z.number().int().nonnegative(),
  hasHeadersOrFooters: z.boolean(),
  readingOrderRisk: z.boolean()
});

const CanonicalPageSchema = z.object({
  number: z.number().int().positive(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  text: z.string(),
  spans: z.array(CanonicalTextSpanSchema),
  geometry: CanonicalPageGeometrySchema.optional()
});

export const ExtractionWarningSchema = z.enum([
  "MULTI_COLUMN_LAYOUT",
  "TABLE_LAYOUT",
  "TEXT_BOX_CONTENT",
  "LOW_TEXT_DENSITY",
  "READING_ORDER_UNCERTAIN"
]);

export const SourceDocumentSchema = z.object({
  text: z.string(),
  pages: z.array(CanonicalPageSchema),
  spans: z.array(CanonicalTextSpanSchema),
  layoutSignals: LayoutSignalsSchema,
  warnings: z.array(ExtractionWarningSchema)
});
export type SourceDocument = z.infer<typeof SourceDocumentSchema>;

export const ExtractionMetadataSchema = z.object({
  pageCount: z.number().int().positive(),
  sourceSpanCount: z.number().int().nonnegative(),
  positionedSpanCount: z.number().int().nonnegative(),
  positionedSpanCoverage: z.number().min(0).max(1),
  warnings: z.array(ExtractionWarningSchema),
  layoutSignals: LayoutSignalsSchema
});
export type ExtractionMetadata = z.infer<typeof ExtractionMetadataSchema>;

export const AnalysisResultSchema = z.object({
  schemaVersion: z.literal("1.0"),
  analyzerVersion: z.string(),
  analysisId: z.string(),
  createdAt: z.iso.datetime(),
  requestedMode: z.enum(["algorithm", "ai"]),
  effectiveMode: z.enum(["algorithm", "ai"]),
  input: z.object({
    fileName: z.string(),
    fileType: z.enum(["pdf", "docx", "txt"]),
    privacyMode: z.enum(["vault", "review", "manual"]),
    jobDescriptionIncluded: z.boolean(),
    wordCount: z.number().int().nonnegative()
  }),
  scores: z.object({
    overall: z.number().min(0).max(100),
    algorithmOverall: z.number().min(0).max(100),
    confidence: z.number().min(0).max(1),
    components: z.array(ScoreComponentSchema),
    baseWeights: z.record(ScoreComponentIdSchema, z.number()),
    effectiveWeights: z.record(ScoreComponentIdSchema, z.number())
  }),
  dimensions: z.array(ResumeDimensionSchema).optional(),
  summary: z.object({
    verdict: z.enum(["needs_work", "developing", "strong", "excellent"]),
    headline: z.string(),
    strengths: z.array(z.string()),
    priorities: z.array(z.string())
  }),
  keywords: KeywordResultSchema,
  findings: z.array(FindingSchema),
  recommendations: z.array(RecommendationSchema),
  annotations: z.array(AnnotationSchema),
  sourceDocument: SourceDocumentSchema.optional(),
  extraction: ExtractionMetadataSchema.optional(),
  aiAssessment: AiAssessmentSchema,
  disclaimer: z.string()
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
