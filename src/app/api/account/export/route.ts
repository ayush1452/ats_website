import { productConfig } from "@/config/product";

import { requireUser } from "../../_lib/auth";
import { errorResponse } from "../../_lib/security";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const { user, client } = await requireUser();
    const [
      profile,
      resumes,
      resumeVersions,
      jobDescriptions,
      scans,
      scanResults,
      dimensionScores,
      keywordMatches,
      findings,
      recommendations,
      exports,
      shares,
      comments,
      notifications,
      privacy,
      subscription,
    ] = await Promise.all([
      client.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      client.from("resumes").select("*").eq("user_id", user.id),
      client.from("resume_versions").select("*").eq("user_id", user.id),
      client.from("job_descriptions").select("*").eq("user_id", user.id),
      client.from("scans").select("*").eq("user_id", user.id),
      client.from("scan_results").select("*").eq("user_id", user.id),
      client
        .from("dimension_scores")
        .select("*,scans!inner(user_id)")
        .eq("scans.user_id", user.id),
      client
        .from("keyword_matches")
        .select("*,scans!inner(user_id)")
        .eq("scans.user_id", user.id),
      client.from("findings").select("*").eq("user_id", user.id),
      client.from("recommendations").select("*").eq("user_id", user.id),
      client.from("report_exports").select("*").eq("user_id", user.id),
      client
        .from("report_shares")
        .select("id,scan_id,expires_at,revoked_at,created_at")
        .eq("user_id", user.id),
      client.from("comments").select("*").eq("user_id", user.id),
      client
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      client
        .from("privacy_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      client
        .from("subscriptions")
        .select("plan,status,scans_used,scan_limit,current_period_end")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    const firstError = [
      profile,
      resumes,
      resumeVersions,
      jobDescriptions,
      scans,
      scanResults,
      dimensionScores,
      keywordMatches,
      findings,
      recommendations,
      exports,
      shares,
      comments,
      notifications,
      privacy,
      subscription,
    ].find((result) => result.error)?.error;
    if (firstError) throw new Error("Account export query failed.");

    const payload = {
      exportedAt: new Date().toISOString(),
      formatVersion: 2,
      account: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      profile: profile.data,
      resumes: resumes.data ?? [],
      resumeVersions: resumeVersions.data ?? [],
      jobDescriptions: jobDescriptions.data ?? [],
      scans: scans.data ?? [],
      scanResults: scanResults.data ?? [],
      dimensionScores: dimensionScores.data ?? [],
      keywordMatches: keywordMatches.data ?? [],
      findings: findings.data ?? [],
      recommendations: recommendations.data ?? [],
      reportExports: exports.data ?? [],
      reportShares: shares.data ?? [],
      comments: comments.data ?? [],
      notificationPreferences: notifications.data,
      privacySettings: privacy.data,
      subscription: subscription.data,
    };
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${productConfig.slug}-account-data.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
