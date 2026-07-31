import { NextResponse } from "next/server";

import { requireUser } from "../../_lib/auth";
import { assertSameOrigin, errorResponse } from "../../_lib/security";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const { id } = await context.params;
    const { user, client } = await requireUser();
    const { data, error } = await client
      .from("resumes")
      .select("id,storage_path")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new Error("Resume lookup failed.");
    if (!data) {
      return NextResponse.json(
        { error: "Resume not found.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    if (data.storage_path) {
      const { error: storageError } = await client.storage
        .from("resumes")
        .remove([data.storage_path]);
      if (storageError) throw new Error("Resume storage cleanup failed.");
    }
    const { error: deleteError } = await client
      .from("resumes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (deleteError) throw new Error("Resume deletion failed.");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
