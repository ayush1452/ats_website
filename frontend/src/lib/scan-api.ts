export type PrivacyMode = "vault" | "review" | "manual";

export type ScanStatus = "queued" | "processing" | "completed" | "failed" | "deleted" | "expired";

export type ImportSourceType =
  | "linkedin"
  | "google_drive"
  | "dropbox"
  | "job_board"
  | "browser_extension"
  | "api";

export type SectionId =
  | "summary"
  | "experience"
  | "skills"
  | "projects"
  | "education"
  | "certifications"
  | "other";

export type MatchEngine = "deterministic" | "hybrid-ollama";
export type MatchLlmStatus = "applied" | "fallback" | "disabled";
export type MatchTier = "must-have" | "preferred";
export type MatchType = "exact" | "synonym" | "semantic" | "missing";

export interface ScoreCard {
  value: number;
  note: string;
}

export interface ParsedContactDetails {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  github: string | null;
}

export interface SectionBreakdownItem {
  id: SectionId;
  label: string;
  score: number;
  summary: string;
  evidenceCount: number;
  bulletCount: number;
}

export interface KeywordCoverage {
  matchedTerms: string[];
  missingTerms: string[];
  partialTerms: string[];
}

export interface MatchCoverageDetail {
  requirement: string;
  tier: MatchTier;
  weight: number;
  matchType: MatchType;
  sectionId: SectionId | null;
  sectionLabel: string | null;
  snippet: string | null;
  confidence: number;
  explanation: string;
}

export interface MatchSectionCoverage {
  sectionId: SectionId;
  label: string;
  matchedCount: number;
  semanticCount: number;
  missingCount: number;
  strongestEvidence: string[];
  coverageScore: number;
}

export interface MatchAnalysis {
  engine: MatchEngine;
  llmStatus: MatchLlmStatus;
  model: string | null;
  requirements: {
    mustHave: string[];
    preferred: string[];
  };
  coverageDetails: MatchCoverageDetail[];
  sectionCoverage: MatchSectionCoverage[];
  topStrengths: string[];
  topGaps: string[];
  overallExplanation: string;
}

export interface RewriteCue {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
}

export interface RetentionMetadata {
  privacyMode: PrivacyMode;
  expiresAt: string;
  ttlLabel: string;
  autoDeleteLabel: string;
  manualDeleteAvailable: boolean;
}

export interface ParsePreviewField {
  label: string;
  value: string | null;
  status: "parsed" | "missing" | "warning";
}

export interface ParsePreview {
  rawTextPreview: string[];
  extractedFields: ParsePreviewField[];
  extractionWarnings: string[];
}

export interface XRayFinding {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high";
}

export interface HeatmapTerm {
  label: string;
  strength: "match" | "partial" | "missing";
  evidence: "exact" | "synonym" | "semantic" | "none";
}

export interface RoleFitSummary {
  verdict: "strong-fit" | "borderline" | "needs-repositioning";
  rationale: string[];
}

export interface SeniorityAlignment {
  target: "entry" | "mid" | "senior" | "lead" | "unknown";
  detected: "entry" | "mid" | "senior" | "lead" | "unknown";
  alignment: "aligned" | "undersold" | "overreaching" | "unknown";
  signals: string[];
}

export interface FormattingIssue {
  label: string;
  meta: string;
  tone: "critical" | "high" | "medium" | "low";
}

export interface AnalysisModule {
  parsePreview: ParsePreview;
  xrayFindings: XRayFinding[];
  gapHeatmap: HeatmapTerm[];
  roleFitSummary: RoleFitSummary;
  seniorityAlignment: SeniorityAlignment;
  formattingAudit: {
    compatibilityScore: number;
    issues: FormattingIssue[];
  };
}

export interface BulletRewriteSuggestion {
  before: string;
  after: string;
  rationale: string;
  grounded: boolean;
}

export interface AchievementQuantifierCue {
  bullet: string;
  suggestedMetric: string;
  reason: string;
}

export interface ActionVerbSuggestion {
  phrase: string;
  replacement: string;
  reason: string;
}

export interface MissingSkillItem {
  term: string;
  priority: "critical" | "high" | "medium";
  occurrences: number;
  evidenceStatus: "missing" | "partial";
}

export interface KeywordDensityItem {
  term: string;
  count: number;
  status: "healthy" | "watch" | "stuffed";
}

export interface SectionOrderOptimizer {
  currentOrder: string[];
  recommendedOrder: string[];
  rationale: string[];
}

export interface AiToolsModule {
  bulletRewriteSuggestions: BulletRewriteSuggestion[];
  achievementQuantifier: AchievementQuantifierCue[];
  actionVerbReview: ActionVerbSuggestion[];
  missingSkillsDetection: MissingSkillItem[];
  keywordDensityWatch: KeywordDensityItem[];
  sectionOrderOptimizer: SectionOrderOptimizer;
  coverLetterAlignmentEndpoint: string;
}

export interface ScoreDiffView {
  atsParse: number;
  clarity: number;
  roleMatch: number | null;
  readiness: number;
}

export interface VersionSummary {
  versionId: string;
  createdAt: string;
  label: string | null;
  filename: string;
  scoreDiff: ScoreDiffView;
}

export interface ReportingModule {
  sectionBySectionBreakdown: SectionBreakdownItem[];
  scoreDiffView: ScoreDiffView | null;
  versionComparison: {
    available: boolean;
    versionCount: number;
    compareEndpoint: string;
    versions: VersionSummary[];
  };
  interviewReadinessMeter: {
    value: number;
    verdict: string;
  };
  pdfExport: {
    endpoint: string;
  };
  formattingAuditSummary: string;
}

export interface PrivacyAuditEvent {
  label: string;
  detail: string;
  timestamp: string;
}

export interface PrivacyModule {
  vaultModeEnabled: boolean;
  autoDeleteWindow: string;
  encryption: {
    inTransit: boolean;
    atRest: boolean;
    provider: string;
  };
  deletionControls: {
    autoDelete: boolean;
    manualDelete: boolean;
  };
  auditTrail: PrivacyAuditEvent[];
}

export interface CoverLetterAlignment {
  alignmentScore: number;
  alignedThemes: string[];
  missingThemes: string[];
  consistencyNotes: string[];
}

export interface CoverLetterAlignmentResponse {
  analysisId: string;
  scanId: string;
  alignment: CoverLetterAlignment;
}

export interface ScanReportPayload {
  parsedContactDetails: ParsedContactDetails;
  sectionBreakdown: SectionBreakdownItem[];
  scoreSummary: {
    atsParse: ScoreCard;
    clarity: ScoreCard;
    roleMatch: ScoreCard | null;
    readiness: ScoreCard;
  };
  keywordCoverage: KeywordCoverage;
  matchAnalysis: MatchAnalysis;
  rewriteCues: RewriteCue[];
  firstPassActions: string[];
  retention: RetentionMetadata;
  extractedRoleTitle: string | null;
  analysis: AnalysisModule;
  aiTools: AiToolsModule;
  reporting: ReportingModule;
  privacy: PrivacyModule;
}

export interface ScanResponse {
  scanId: string;
  status: ScanStatus;
  expiresAt: string;
  pollUrl: string;
  errorMessage: string | null;
  retention: RetentionMetadata;
  report: ScanReportPayload | null;
}

export interface CreateScanResponse {
  scanId: string;
  status: ScanStatus;
  expiresAt: string;
  pollUrl: string;
  scanToken: string;
}

export interface ScanVersionResponse {
  versionId: string;
  scanId: string;
  createdAt: string;
  label: string | null;
  filename: string;
  report: ScanReportPayload;
  scoreDiff: ScoreDiffView;
}

export interface IntegrationCapability {
  sourceType: ImportSourceType;
  label: string;
  mode: "manual" | "preview" | "planned";
  description: string;
  endpoint: string;
}

export interface ImportRecordResponse {
  importId: string;
  sourceType: ImportSourceType;
  sourceLabel: string;
  normalized: {
    title: string;
    summary: string;
    contentPreview: string[];
  };
  createdAt: string;
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}
