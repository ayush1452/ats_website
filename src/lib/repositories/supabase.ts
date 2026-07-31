import type { SupabaseClient } from "@supabase/supabase-js";

import {
  analysisResultSchema,
  canonicalResumeDocumentSchema,
} from "@/lib/analysis/schemas";
import type {
  AnalysisResult,
  CanonicalResumeDocument,
  DataRepository,
  ResumeVersion,
  ScanSummary,
} from "@/types/domain";

export interface SupabaseScanBundle {
  id: string;
  resumeId?: string;
  summary: ScanSummary;
  result: AnalysisResult;
  document: CanonicalResumeDocument;
  versions: ResumeVersion[];
  scoreStale: boolean;
}

async function authenticatedUserId(client: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new Error("Authentication is required.");
  return user.id;
}

export class SupabaseRepository implements DataRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly trustedUserId?: string,
  ) {}

  private userId(): Promise<string> {
    return this.trustedUserId
      ? Promise.resolve(this.trustedUserId)
      : authenticatedUserId(this.client);
  }

  async listScans(): Promise<ScanSummary[]> {
    const userId = await this.userId();
    const { data, error } = await this.client
      .from("scans")
      .select(
        "id,target_role,company,created_at,overall_score,role_match_score,ats_parse_score,status,analysis_mode,resumes(name)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Scans could not be loaded.");

    return (data ?? []).map((row) => {
      const relation = row.resumes as { name?: string } | Array<{ name?: string }> | null;
      const resumeName = Array.isArray(relation)
        ? relation[0]?.name
        : relation?.name;
      return {
        id: String(row.id),
        resumeName: resumeName ?? "Resume",
        targetRole: String(row.target_role ?? "Target role"),
        company: row.company ? String(row.company) : undefined,
        createdAt: String(row.created_at),
        overallScore: Number(row.overall_score ?? 0),
        roleMatch:
          row.role_match_score === null || row.role_match_score === undefined
            ? null
            : Number(row.role_match_score),
        atsParse: Number(row.ats_parse_score ?? 0),
        status: row.status as ScanSummary["status"],
        mode: row.analysis_mode as ScanSummary["mode"],
      };
    });
  }

  async getScan(id: string): Promise<AnalysisResult | null> {
    const userId = await this.userId();
    const { data, error } = await this.client
      .from("scan_results")
      .select("result")
      .eq("scan_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error("The report could not be loaded.");
    if (!data) return null;
    return analysisResultSchema.parse(data.result) as AnalysisResult;
  }

  async getScanBundle(id: string): Promise<SupabaseScanBundle | null> {
    const userId = await this.userId();
    const [{ data: scan, error: scanError }, { data: stored, error: resultError }] =
      await Promise.all([
        this.client
          .from("scans")
          .select(
            "id,resume_id,target_role,company,created_at,overall_score,role_match_score,ats_parse_score,status,analysis_mode,score_stale,resumes(name)",
          )
          .eq("id", id)
          .eq("user_id", userId)
          .maybeSingle(),
        this.client
          .from("scan_results")
          .select("result,canonical_document")
          .eq("scan_id", id)
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
    if (scanError || resultError) throw new Error("The report could not be loaded.");
    if (!scan || !stored?.canonical_document) return null;

    const result = analysisResultSchema.parse(stored.result) as AnalysisResult;
    const document = canonicalResumeDocumentSchema.parse(
      stored.canonical_document,
    ) as CanonicalResumeDocument;
    const relation = scan.resumes as
      | { name?: string }
      | Array<{ name?: string }>
      | null;
    const resumeName = Array.isArray(relation)
      ? relation[0]?.name
      : relation?.name;
    const resumeId =
      typeof scan.resume_id === "string" ? scan.resume_id : undefined;
    return {
      id: String(scan.id),
      resumeId,
      summary: {
        id: String(scan.id),
        resumeName: resumeName ?? document.filename,
        targetRole: String(scan.target_role || "Target role"),
        company: scan.company ? String(scan.company) : undefined,
        createdAt: String(scan.created_at),
        overallScore: Number(scan.overall_score ?? result.overallScore),
        roleMatch:
          scan.role_match_score === null ||
          scan.role_match_score === undefined
            ? null
            : Number(scan.role_match_score),
        atsParse: Number(
          scan.ats_parse_score ?? result.componentScores.atsParse,
        ),
        status: scan.status as ScanSummary["status"],
        mode: scan.analysis_mode as ScanSummary["mode"],
      },
      result,
      document,
      versions: resumeId ? await this.listVersions(resumeId) : [],
      scoreStale: Boolean(scan.score_stale),
    };
  }

  async saveScan(
    id: string,
    summary: ScanSummary,
    result: AnalysisResult,
    document?: CanonicalResumeDocument,
  ): Promise<void> {
    const userId = await this.userId();
    const validatedResult = analysisResultSchema.parse(result);
    const { error: scanError } = await this.client.from("scans").upsert({
      id,
      user_id: userId,
      target_role: summary.targetRole,
      company: summary.company ?? null,
      status: summary.status,
      overall_score: summary.overallScore,
      role_match_score: summary.roleMatch,
      ats_parse_score: summary.atsParse,
      confidence: result.confidence,
      analysis_mode: summary.mode,
      analyzer_version: result.analyzerVersion,
      schema_version: result.schemaVersion,
      weight_snapshot: result.weightSnapshot,
      completed_at: result.completedAt,
    });
    if (scanError) throw new Error("The scan could not be saved.");

    const validatedDocument = document
      ? canonicalResumeDocumentSchema.parse(document)
      : undefined;
    const { error: resultError } = await this.client
      .from("scan_results")
      .upsert({
        scan_id: id,
        user_id: userId,
        result: validatedResult,
        confidence: result.confidence,
        ...(validatedDocument
          ? { canonical_document: validatedDocument }
          : {}),
      });
    if (resultError) throw new Error("The report could not be saved.");
  }

  async listVersions(resumeId: string): Promise<ResumeVersion[]> {
    const userId = await this.userId();
    const { data, error } = await this.client
      .from("resume_versions")
      .select("id,version_number,name,content,source,change_summary,created_at,score")
      .eq("resume_id", resumeId)
      .eq("user_id", userId)
      .order("version_number", { ascending: false });
    if (error) throw new Error("Resume versions could not be loaded.");
    return (data ?? []).map((row) => ({
      id: String(row.id),
      version: Number(row.version_number),
      name: String(row.name),
      content: String(row.content),
      source: row.source as ResumeVersion["source"],
      changeSummary: String(row.change_summary),
      createdAt: String(row.created_at),
      score: row.score === null ? undefined : Number(row.score),
    }));
  }

  async saveVersion(resumeId: string, version: ResumeVersion): Promise<void> {
    const userId = await this.userId();
    const { error } = await this.client.from("resume_versions").insert({
      id: version.id,
      resume_id: resumeId,
      user_id: userId,
      version_number: version.version,
      name: version.name,
      content: version.content,
      source: version.source,
      change_summary: version.changeSummary,
      score: version.score ?? null,
    });
    if (error) throw new Error("The resume version could not be saved.");
  }
}
