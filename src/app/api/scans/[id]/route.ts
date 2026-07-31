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
      .from("scans")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error("Scan deletion failed.");
    if (!data) {
      return NextResponse.json(
        { error: "Scan not found.", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
