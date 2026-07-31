import { AppShell } from "@/components/app/app-shell";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const client = await createServerSupabaseClient();
  if (!client) {
    return (
      <AppShell
        viewer={{
          displayName: "Alex Morgan",
          email: "Browser-local demo",
          demoSession: true,
        }}
      >
        {children}
      </AppShell>
    );
  }

  const {
    data: { user },
  } = await client.auth.getUser();
  const { data: profile } = user
    ? await client
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const demoSession = Boolean(user?.is_anonymous || user?.user_metadata?.demo_session);
  return (
    <AppShell
      viewer={{
        displayName:
          (typeof profile?.display_name === "string" && profile.display_name.trim()) ||
          (demoSession ? "Demo explorer" : "Resume workspace"),
        email: user?.email ?? (demoSession ? "Anonymous live session" : "Verified account"),
        demoSession,
      }}
    >
      {children}
    </AppShell>
  );
}
