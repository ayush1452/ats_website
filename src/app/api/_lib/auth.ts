import { createClient as createAdminClient, type User } from "@supabase/supabase-js";

import { ApiError } from "./security";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireUser(): Promise<{
  user: User;
  client: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>;
}> {
  const client = await createServerSupabaseClient();
  if (!client) {
    throw new ApiError(
      "This action requires a configured backend.",
      503,
      "BACKEND_REQUIRED",
    );
  }
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) {
    throw new ApiError("Sign in to continue.", 401, "AUTH_REQUIRED");
  }
  return { user, client };
}

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new ApiError(
      "Secure server data access is not configured.",
      501,
      "ADMIN_NOT_CONFIGURED",
    );
  }
  return createAdminClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
