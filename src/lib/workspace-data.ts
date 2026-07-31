import {
  DEMO_RESUME_ID,
  demoResult,
  demoScans,
  demoVersions,
} from "@/data/demo";
import { SupabaseRepository } from "@/lib/repositories";
import {
  createServerSupabaseClient,
  isSupabaseServerConfigured,
} from "@/lib/supabase/server";
import type { PlanId } from "@/config/plans";
import type {
  AnalysisResult,
  ResumeVersion,
  ScanSummary,
} from "@/types/domain";

export interface ResumeLibraryItem {
  id: string;
  name: string;
  updatedAt: string;
  versionCount: number;
  latestScore: number | null;
  scoreChange: number | null;
  isDemo: boolean;
}

export interface WorkspaceQuota {
  plan: PlanId;
  used: number;
  limit: number;
}

export async function loadWorkspaceScans(): Promise<ScanSummary[]> {
  if (!isSupabaseServerConfigured()) return demoScans;
  const client = await createServerSupabaseClient();
  if (!client) return [];
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return [];
  return new SupabaseRepository(client).listScans();
}

export async function loadWorkspaceDashboard(): Promise<{
  scans: ScanSummary[];
  result: AnalysisResult | null;
  isDemo: boolean;
  quota: WorkspaceQuota;
}> {
  if (!isSupabaseServerConfigured()) {
    return {
      scans: demoScans,
      result: demoResult,
      isDemo: true,
      quota: { plan: "free", used: 1, limit: 3 },
    };
  }

  const client = await createServerSupabaseClient();
  if (!client) {
    return {
      scans: [],
      result: null,
      isDemo: false,
      quota: { plan: "free", used: 0, limit: 3 },
    };
  }
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return {
      scans: [],
      result: null,
      isDemo: false,
      quota: { plan: "free", used: 0, limit: 3 },
    };
  }

  const repository = new SupabaseRepository(client);
  const [scans, subscription] = await Promise.all([
    repository.listScans(),
    client
      .from("subscriptions")
      .select("plan,scans_used,scan_limit")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  const result = scans[0] ? await repository.getScan(scans[0].id) : null;
  const rawPlan = subscription.data?.plan;
  const plan: PlanId =
    rawPlan === "pro" || rawPlan === "career" || rawPlan === "teams"
      ? rawPlan
      : "free";
  return {
    scans,
    result,
    isDemo: false,
    quota: {
      plan,
      used: Math.max(0, Number(subscription.data?.scans_used ?? 0)),
      limit: Math.max(1, Number(subscription.data?.scan_limit ?? 3)),
    },
  };
}

export async function loadWorkspaceResumes(): Promise<ResumeLibraryItem[]> {
  if (!isSupabaseServerConfigured()) {
    return [
      {
        id: DEMO_RESUME_ID,
        name: "Alex Morgan — Product Lead",
        updatedAt: demoVersions[0]?.createdAt ?? demoScans[0]!.createdAt,
        versionCount: demoVersions.length,
        latestScore: demoVersions[0]?.score ?? null,
        scoreChange:
          demoVersions.length > 1 &&
          demoVersions[0]?.score !== undefined &&
          demoVersions.at(-1)?.score !== undefined
            ? demoVersions[0].score - demoVersions.at(-1)!.score!
            : null,
        isDemo: true,
      },
    ];
  }

  const client = await createServerSupabaseClient();
  if (!client) return [];
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return [];
  const { data: resumes, error } = await client
    .from("resumes")
    .select("id,name,updated_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error || !resumes?.length) return [];

  const resumeIds = resumes.map((resume) => String(resume.id));
  const { data: versions } = await client
    .from("resume_versions")
    .select("resume_id,version_number,score,created_at")
    .in("resume_id", resumeIds)
    .order("version_number", { ascending: false });

  return resumes.map((resume) => {
    const matching = (versions ?? []).filter(
      (version) => String(version.resume_id) === String(resume.id),
    );
    const latestScore =
      matching[0]?.score === null || matching[0]?.score === undefined
        ? null
        : Number(matching[0].score);
    const oldest = matching.at(-1);
    const oldestScore =
      oldest?.score === null || oldest?.score === undefined
        ? null
        : Number(oldest.score);
    return {
      id: String(resume.id),
      name: String(resume.name),
      updatedAt: String(resume.updated_at),
      versionCount: matching.length,
      latestScore,
      scoreChange:
        latestScore === null || oldestScore === null
          ? null
          : latestScore - oldestScore,
      isDemo: false,
    };
  });
}

export async function loadWorkspaceResume(id: string): Promise<{
  item: ResumeLibraryItem;
  versions: ResumeVersion[];
} | null> {
  if (!isSupabaseServerConfigured()) {
    if (id !== DEMO_RESUME_ID && id !== "alex-morgan") return null;
    return {
      item: (await loadWorkspaceResumes())[0]!,
      versions: demoVersions,
    };
  }

  const client = await createServerSupabaseClient();
  if (!client) return null;
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data: resume, error } = await client
    .from("resumes")
    .select("id,name,updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !resume) return null;

  const versions = await new SupabaseRepository(client).listVersions(id);
  const latestScore = versions[0]?.score ?? null;
  const oldestScore = versions.at(-1)?.score ?? null;
  return {
    item: {
      id: String(resume.id),
      name: String(resume.name),
      updatedAt: String(resume.updated_at),
      versionCount: versions.length,
      latestScore,
      scoreChange:
        latestScore === null || oldestScore === null
          ? null
          : latestScore - oldestScore,
      isDemo: false,
    },
    versions,
  };
}

export async function loadDefaultWorkspaceVersions(): Promise<ResumeVersion[]> {
  const resumes = await loadWorkspaceResumes();
  const first = resumes[0];
  if (!first) return [];
  return (await loadWorkspaceResume(first.id))?.versions ?? [];
}
