import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient, requireUser } from "../../_lib/auth";
import { assertSameOrigin, errorResponse } from "../../_lib/security";

const confirmationSchema = z
  .object({ confirmation: z.literal("DELETE") })
  .strict();

export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    confirmationSchema.parse(await request.json());
    const { user } = await requireUser();
    const admin = createSupabaseAdminClient();

    const { data: ownedTeams, error: teamQueryError } = await admin
      .from("teams")
      .select("id")
      .eq("owner_id", user.id);
    if (teamQueryError) throw new Error("Account team inventory failed.");
    const teamIds = (ownedTeams ?? []).map((team) => String(team.id));
    const resumeFilter = [
      `user_id.eq.${user.id}`,
      ...(teamIds.length ? [`team_id.in.(${teamIds.join(",")})`] : []),
    ].join(",");
    const reportFilter = resumeFilter;

    const [
      { data: resumes, error: resumeQueryError },
      { data: reports, error: reportQueryError },
    ] = await Promise.all([
      admin.from("resumes").select("storage_path").or(resumeFilter),
      admin.from("report_exports").select("storage_path").or(reportFilter),
    ]);
    if (resumeQueryError || reportQueryError) {
      throw new Error("Account storage inventory failed.");
    }

    const resumePaths = (resumes ?? [])
      .map((row) => row.storage_path)
      .filter((path): path is string => typeof path === "string" && path.length > 0);
    const reportPaths = (reports ?? [])
      .map((row) => row.storage_path)
      .filter((path): path is string => typeof path === "string" && path.length > 0);

    if (resumePaths.length > 0) {
      const { error } = await admin.storage.from("resumes").remove(resumePaths);
      if (error) throw new Error("Resume storage cleanup failed.");
    }
    if (reportPaths.length > 0) {
      const { error } = await admin.storage.from("reports").remove(reportPaths);
      if (error) throw new Error("Report storage cleanup failed.");
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error("Account deletion failed.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
