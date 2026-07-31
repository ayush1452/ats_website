export type AnalysisMode = "demo" | "deterministic" | "hybrid";
export type ScanStatus = "draft" | "processing" | "complete" | "failed";
export type Severity = "critical" | "high" | "medium" | "low" | "passed";
export type MatchStatus =
  | "strong"
  | "matched"
  | "partial"
  | "related"
  | "missing"
  | "uncertain"
  | "overused";
export type FindingCategory =
  | "format"
  | "keywords"
  | "experience"
  | "impact"
  | "readability"
  | "sections"
  | "job-match";
export type ReportTab =
  | "overview"
  | "keywords"
  | "sections"
  | "impact"
  | "ai-tools"
  | "format"
  | "job-match"
  | "reports";
export type ReportLens = "default" | "keywords" | "format" | "impact" | "job-match";

export interface TextSpan {
  id: string;
  page: number;
  text: string;
  start: number;
  end: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ResumeSection {
  id: string;
  name: string;
  heading: string;
  start: number;
  end: number;
  order: number;
  confidence: number;
}

export interface LayoutSignal {
  type: "column" | "table" | "text-box" | "header" | "footer" | "image" | "encoding";
  page: number;
  confidence: number;
  detail: string;
}

export interface CanonicalResumeDocument {
  version: 1;
  filename: string;
  fileType: "pdf" | "docx" | "txt" | "pasted";
  pageCount: number;
  normalizedText: string;
  spans: TextSpan[];
  sections: ResumeSection[];
  layoutSignals: LayoutSignal[];
  extractionConfidence: number;
}

export interface AnalysisInput {
  document: CanonicalResumeDocument;
  jobDescription?: string;
  jobTitle?: string;
  company?: string;
  targetRole: string;
  seniority: string;
  industry: string;
  market: string;
  goal: "ats" | "match" | "general";
}

export interface ScoreValue {
  key: string;
  label: string;
  score: number;
  explanation: string;
}

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  description: string;
  whyItMatters: string;
  recommendation: string;
  sourceText?: string;
  sourceSection?: string;
  sourceStart?: number;
  sourceEnd?: number;
  scoreImpact: number;
  effort: "low" | "medium" | "high";
  status: "open" | "resolved" | "dismissed";
  requiresVerification?: boolean;
}

export interface ResumeAnnotation {
  id: string;
  findingId: string;
  start: number;
  end: number;
  page: number;
  status: MatchStatus | Severity;
  label: string;
}

export interface KeywordMatch {
  keyword: string;
  status: MatchStatus;
  group: string;
  requirementType: "must-have" | "preferred" | "context";
  importance: number;
  resumeFrequency: number;
  jobFrequency: number;
  scoreImpact: number;
  recommendedSection?: string;
  evidence?: string;
}

export interface SectionAnalysis {
  name: string;
  status: "detected" | "missing" | "warning";
  confidence: number;
  order: number | null;
  length: number;
  relevance: number;
  readability: number;
  issue?: string;
  action: string;
}

export interface JobRequirement {
  requirement: string;
  type: "must-have" | "preferred";
  importance: number;
  status: MatchStatus;
  evidence?: string;
  evidenceLocation?: string;
  score: number;
  explanation: string;
  action: string;
}

export interface Recommendation {
  id: string;
  findingId?: string;
  title: string;
  originalText: string;
  suggestedText: string;
  rationale: string;
  changes: string[];
  requiresVerification: boolean;
  status: "pending" | "applied" | "rejected";
}

export interface AnalysisResult {
  schemaVersion: 1;
  analyzerVersion: string;
  mode: AnalysisMode;
  overallScore: number;
  confidence: number;
  completedAt: string;
  componentScores: {
    atsParse: number;
    recruiterClarity: number;
    roleMatch: number | null;
  };
  dimensionScores: ScoreValue[];
  metrics: {
    keywordMatch: number | null;
    impact: number;
    readability: number;
    achievementDensity: number;
    requirementCoverage: number | null;
    formatRisk: number;
  };
  keywords: KeywordMatch[];
  sections: SectionAnalysis[];
  requirements: JobRequirement[];
  findings: Finding[];
  recommendations: Recommendation[];
  annotations: ResumeAnnotation[];
  benchmark: {
    label: string;
    score: number;
    explanation: string;
  };
  scoreTrend: Array<{ label: string; score: number }>;
  weightSnapshot: Record<string, number>;
}

export interface ResumeVersion {
  id: string;
  version: number;
  name: string;
  content: string;
  source: "upload" | "paste" | "rewrite" | "restore";
  changeSummary: string;
  createdAt: string;
  score?: number;
}

export interface ScanSummary {
  id: string;
  resumeName: string;
  targetRole: string;
  company?: string;
  createdAt: string;
  overallScore: number;
  roleMatch: number | null;
  atsParse: number;
  status: ScanStatus;
  mode: AnalysisMode;
}

export interface AnalysisService {
  analyze(
    input: AnalysisInput,
    onStage?: (stage: string) => void | Promise<void>,
  ): Promise<AnalysisResult>;
}

export interface SemanticAnalysisProvider {
  readonly name: string;
  enrich(input: AnalysisInput, base: AnalysisResult): Promise<Partial<AnalysisResult>>;
  rewrite(input: {
    source: string;
    context: string;
    instruction: string;
  }): Promise<Recommendation>;
}

export interface DataRepository {
  listScans(): Promise<ScanSummary[]>;
  getScan(id: string): Promise<AnalysisResult | null>;
  saveScan(
    id: string,
    summary: ScanSummary,
    result: AnalysisResult,
    document?: CanonicalResumeDocument,
  ): Promise<void>;
  listVersions(resumeId: string): Promise<ResumeVersion[]>;
  saveVersion(resumeId: string, version: ResumeVersion): Promise<void>;
}

export interface BillingService {
  createCheckout(
    planId: string,
    billingPeriod: "monthly" | "annual",
    idempotencyKey?: string,
  ): Promise<{ url: string }>;
  createPortal(idempotencyKey?: string): Promise<{ url: string }>;
}
