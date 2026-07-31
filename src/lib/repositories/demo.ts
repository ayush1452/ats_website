import Dexie, { type EntityTable } from "dexie";

import {
  demoDocument,
  DEMO_RESUME_ID,
  DEMO_SCAN_ID,
  demoResult,
  demoScans,
  demoVersions,
} from "@/data/demo";
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

interface StoredScan {
  id: string;
  resumeId?: string;
  summary: ScanSummary;
  result: AnalysisResult;
  document?: CanonicalResumeDocument;
  scoreStale?: boolean;
  updatedAt: string;
}

interface StoredVersion {
  id: string;
  resumeId: string;
  value: ResumeVersion;
}

export interface DemoScanDraft {
  id: string;
  step: "resume" | "job" | "context" | "analysis";
  resumeText?: string;
  filename?: string;
  jobDescription?: string;
  jobTitle?: string;
  company?: string;
  targetRole?: string;
  seniority?: string;
  industry?: string;
  market?: string;
  goal?: "ats" | "match" | "general";
  updatedAt: string;
}

export interface DemoScanBundle {
  id: string;
  resumeId: string;
  summary: ScanSummary;
  result: AnalysisResult;
  document: CanonicalResumeDocument;
  versions: ResumeVersion[];
  scoreStale: boolean;
}

export interface DemoJobTarget {
  id: string;
  title: string;
  company: string;
  content: string;
  status: "Active" | "Saved";
  updatedAt: string;
  coverage: number | null;
}

const seededJobs: DemoJobTarget[] = [
  {
    id: "northstar",
    title: "Product Lead",
    company: "Northstar Labs",
    content: "Lead product strategy, experiments, analytics, and cross-functional delivery.",
    status: "Active",
    updatedAt: "2026-07-23T09:00:00.000Z",
    coverage: 68,
  },
  {
    id: "atlas",
    title: "Senior Product Manager",
    company: "Atlas Commerce",
    content: "Own a commerce roadmap and partner with engineering, design, sales, and support.",
    status: "Saved",
    updatedAt: "2026-07-18T09:00:00.000Z",
    coverage: 76,
  },
  {
    id: "kinetic",
    title: "Group Product Manager",
    company: "Kinetic Health",
    content: "Coach product managers and lead evidence-based platform strategy.",
    status: "Saved",
    updatedAt: "2026-07-12T09:00:00.000Z",
    coverage: 61,
  },
];

class ResumePilotDemoDatabase extends Dexie {
  scans!: EntityTable<StoredScan, "id">;
  versions!: EntityTable<StoredVersion, "id">;
  drafts!: EntityTable<DemoScanDraft, "id">;
  jobs!: EntityTable<DemoJobTarget, "id">;

  constructor() {
    super("resumepilot-demo");
    this.version(1).stores({
      scans: "id, updatedAt, summary.createdAt",
      versions: "id, resumeId, value.version",
      drafts: "id, updatedAt",
    });
    this.version(2).stores({
      scans: "id, updatedAt, summary.createdAt",
      versions: "id, resumeId, value.version",
      drafts: "id, updatedAt",
    });
    this.version(3).stores({
      scans: "id, updatedAt, summary.createdAt",
      versions: "id, resumeId, value.version",
      drafts: "id, updatedAt",
      jobs: "id, updatedAt, status",
    });
  }
}

function clone<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);
}

export class DemoRepository implements DataRepository {
  private database: ResumePilotDemoDatabase | null | undefined;
  private readonly memoryScans = new Map<string, StoredScan>();
  private readonly memoryVersions = new Map<string, StoredVersion>();
  private readonly memoryDrafts = new Map<string, DemoScanDraft>();

  constructor() {
    this.memoryScans.set(DEMO_SCAN_ID, {
      id: DEMO_SCAN_ID,
      resumeId: DEMO_RESUME_ID,
      summary: clone(demoScans[0] as ScanSummary),
      result: clone(demoResult),
      document: clone(demoDocument),
      scoreStale: false,
      updatedAt: demoScans[0]?.createdAt ?? new Date(0).toISOString(),
    });
    for (const version of demoVersions) {
      this.memoryVersions.set(version.id, {
        id: version.id,
        resumeId: DEMO_RESUME_ID,
        value: clone(version),
      });
    }
  }

  private db(): ResumePilotDemoDatabase | null {
    if (this.database !== undefined) return this.database;
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      this.database = null;
      return null;
    }
    this.database = new ResumePilotDemoDatabase();
    return this.database;
  }

  async listScans(): Promise<ScanSummary[]> {
    const database = this.db();
    if (!database) {
      const saved = [...this.memoryScans.values()].map((row) => clone(row.summary));
      const savedIds = new Set(saved.map((scan) => scan.id));
      return [...saved, ...demoScans.filter((scan) => !savedIds.has(scan.id))]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    const stored = await database.scans.toArray();
    const storedIds = new Set(stored.map((row) => row.id));
    return [
      ...stored.map((row) => row.summary),
      ...demoScans.filter((scan) => !storedIds.has(scan.id)),
    ]
      .map(clone)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getScan(id: string): Promise<AnalysisResult | null> {
    const database = this.db();
    const row = database
      ? await database.scans.get(id)
      : this.memoryScans.get(id);
    if (row) return analysisResultSchema.parse(clone(row.result)) as AnalysisResult;
    if (demoScans.some((scan) => scan.id === id)) {
      const scan = demoScans.find((candidate) => candidate.id === id);
      return {
        ...clone(demoResult),
        overallScore: scan?.overallScore ?? demoResult.overallScore,
        componentScores: {
          ...clone(demoResult.componentScores),
          atsParse: scan?.atsParse ?? demoResult.componentScores.atsParse,
          roleMatch: scan?.roleMatch ?? demoResult.componentScores.roleMatch,
        },
      };
    }
    return null;
  }

  async saveScan(
    id: string,
    summary: ScanSummary,
    result: AnalysisResult,
  ): Promise<void> {
    const validatedResult = analysisResultSchema.parse(result) as AnalysisResult;
    const database = this.db();
    const existing = database
      ? await database.scans.get(id)
      : this.memoryScans.get(id);
    const row: StoredScan = {
      id,
      resumeId: existing?.resumeId,
      summary: clone({ ...summary, id }),
      result: clone(validatedResult),
      document: existing?.document ? clone(existing.document) : undefined,
      scoreStale: existing?.scoreStale ?? false,
      updatedAt: new Date().toISOString(),
    };
    if (database) {
      await database.scans.put(row);
      return;
    }
    this.memoryScans.set(id, row);
  }

  async saveScanBundle(
    id: string,
    summary: ScanSummary,
    result: AnalysisResult,
    document: CanonicalResumeDocument,
    resumeId = id,
  ): Promise<void> {
    const validatedResult = analysisResultSchema.parse(result) as AnalysisResult;
    const validatedDocument = canonicalResumeDocumentSchema.parse(
      document,
    ) as CanonicalResumeDocument;
    const row: StoredScan = {
      id,
      resumeId,
      summary: clone({ ...summary, id }),
      result: clone(validatedResult),
      document: clone(validatedDocument),
      scoreStale: false,
      updatedAt: new Date().toISOString(),
    };
    const database = this.db();
    if (database) {
      await database.transaction(
        "rw",
        database.scans,
        database.versions,
        async () => {
          const existing = await database.scans.get(id);
          if (existing) return;
          const versionCount = await database.versions
            .where("resumeId")
            .equals(resumeId)
            .count();
          const versionNumber = versionCount + 1;
          const version: ResumeVersion = {
            id: `${id}-v${versionNumber}`,
            version: versionNumber,
            name:
              versionNumber === 1
                ? "Original scan input"
                : `Scanned resume version ${versionNumber}`,
            content: validatedDocument.normalizedText,
            source:
              validatedDocument.fileType === "pasted" ? "paste" : "upload",
            changeSummary: "Resume captured when this scan was created",
            createdAt: validatedResult.completedAt,
            score: validatedResult.overallScore,
          };
          await database.scans.put(row);
          await database.versions.put({
            id: version.id,
            resumeId,
            value: clone(version),
          });
        },
      );
      return;
    }
    this.memoryScans.set(id, row);
    const versionCount = [...this.memoryVersions.values()].filter(
      (version) => version.resumeId === resumeId,
    ).length;
    const versionNumber = versionCount + 1;
    const version: ResumeVersion = {
      id: `${id}-v${versionNumber}`,
      version: versionNumber,
      name:
        versionNumber === 1
          ? "Original scan input"
          : `Scanned resume version ${versionNumber}`,
      content: validatedDocument.normalizedText,
      source: validatedDocument.fileType === "pasted" ? "paste" : "upload",
      changeSummary: "Resume captured when this scan was created",
      createdAt: validatedResult.completedAt,
      score: validatedResult.overallScore,
    };
    this.memoryVersions.set(version.id, {
      id: version.id,
      resumeId,
      value: clone(version),
    });
  }

  async getScanBundle(id: string): Promise<DemoScanBundle | null> {
    const database = this.db();
    const row = database
      ? await database.scans.get(id)
      : this.memoryScans.get(id);
    const seededSummary = demoScans.find((scan) => scan.id === id);
    if (!row && !seededSummary) return null;

    const result = await this.getScan(id);
    if (!result) return null;
    const sourceDocument = row?.document ?? (seededSummary ? demoDocument : null);
    if (!sourceDocument) return null;
    const document = canonicalResumeDocumentSchema.parse(
      clone(sourceDocument),
    ) as CanonicalResumeDocument;
    const resumeId =
      row?.resumeId ?? (seededSummary ? DEMO_RESUME_ID : id);

    return {
      id,
      resumeId,
      summary: clone(row?.summary ?? seededSummary as ScanSummary),
      result,
      document,
      versions: await this.listVersions(resumeId),
      scoreStale: row?.scoreStale ?? false,
    };
  }

  async markScanStale(id: string): Promise<void> {
    const database = this.db();
    if (database) {
      const row = await database.scans.get(id);
      if (row) {
        await database.scans.put({
          ...row,
          scoreStale: true,
          updatedAt: new Date().toISOString(),
        });
      }
      return;
    }
    const row = this.memoryScans.get(id);
    if (row) {
      this.memoryScans.set(id, {
        ...row,
        scoreStale: true,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async listVersions(resumeId: string): Promise<ResumeVersion[]> {
    const database = this.db();
    const stored = database
      ? await database.versions.where("resumeId").equals(resumeId).toArray()
      : [...this.memoryVersions.values()].filter((row) => row.resumeId === resumeId);
    const values = stored.map((row) => row.value);
    if (resumeId === DEMO_RESUME_ID) {
      const ids = new Set(values.map((version) => version.id));
      values.push(...demoVersions.filter((version) => !ids.has(version.id)));
    }
    return values.map(clone).sort((a, b) => b.version - a.version);
  }

  async saveVersion(resumeId: string, version: ResumeVersion): Promise<void> {
    const row: StoredVersion = {
      id: version.id,
      resumeId,
      value: clone(version),
    };
    const database = this.db();
    if (database) {
      await database.versions.put(row);
      return;
    }
    this.memoryVersions.set(version.id, row);
  }

  async getDraft(id = "current"): Promise<DemoScanDraft | null> {
    const database = this.db();
    const draft = database
      ? await database.drafts.get(id)
      : this.memoryDrafts.get(id);
    return draft ? clone(draft) : null;
  }

  async saveDraft(draft: DemoScanDraft): Promise<void> {
    const value = clone({ ...draft, updatedAt: new Date().toISOString() });
    const database = this.db();
    if (database) {
      await database.drafts.put(value);
      return;
    }
    this.memoryDrafts.set(value.id, value);
  }

  async deleteDraft(id = "current"): Promise<void> {
    const database = this.db();
    if (database) {
      await database.drafts.delete(id);
      return;
    }
    this.memoryDrafts.delete(id);
  }

  async listJobs(): Promise<DemoJobTarget[]> {
    const database = this.db();
    if (!database) return seededJobs.map(clone);
    const stored = await database.jobs.toArray();
    const storedIds = new Set(stored.map((job) => job.id));
    return [
      ...stored,
      ...seededJobs.filter((job) => !storedIds.has(job.id)),
    ]
      .map(clone)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async saveJob(job: DemoJobTarget): Promise<void> {
    const value = clone(job);
    const database = this.db();
    if (database) {
      await database.jobs.put(value);
      return;
    }
  }
}
