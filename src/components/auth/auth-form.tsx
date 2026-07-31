"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { productConfig } from "@/config/product";
import { getBrowserSupabase, isSupabaseConfigured, startDemoSession } from "@/lib/auth/client";

type Mode = "login" | "signup" | "forgot" | "update";

const authSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters.").optional(),
});

type AuthValues = z.infer<typeof authSchema>;

const copy: Record<Mode, { title: string; body: string; submit: string }> = {
  login: {
    title: "Welcome back",
    body: "Open your saved scans, versions, and role targets.",
    submit: "Log in",
  },
  signup: {
    title: "Create your workspace",
    body: "Start with the full demo report, then scan your own resume.",
    submit: "Create account",
  },
  forgot: {
    title: "Reset your password",
    body: "We’ll send a secure password-reset link to your email.",
    submit: "Send reset link",
  },
  update: {
    title: "Choose a new password",
    body: "Use at least eight characters and avoid reused passwords.",
    submit: "Update password",
  },
};

export function AuthForm({ mode, nextPath = "/app" }: { mode: Mode; nextPath?: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [complete, setComplete] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const needsPassword = mode === "login" || mode === "signup" || mode === "update";
  const form = useForm<AuthValues>({
    resolver: zodResolver(
      needsPassword
        ? authSchema.refine((value) => Boolean(value.password), {
            message: "Enter your password.",
            path: ["password"],
          })
        : authSchema,
    ),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: AuthValues) {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setStatusMessage(
        "Live authentication is not configured in this preview. Use Explore demo below; no real account will be created.",
      );
      return;
    }

    setStatusMessage("");
    const redirectTo = `${window.location.origin}/auth/callback?next=/app/onboarding`;

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password ?? "",
      });
      if (error) throw new Error(error.message);
      toast.success("Logged in securely.");
      router.push(nextPath);
      router.refresh();
      return;
    }

    if (mode === "signup") {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      const { error } = currentUser?.is_anonymous
        ? await supabase.auth.updateUser(
            {
              email: values.email,
              password: values.password ?? "",
            },
            { emailRedirectTo: redirectTo },
          )
        : await supabase.auth.signUp({
            email: values.email,
            password: values.password ?? "",
            options: { emailRedirectTo: redirectTo },
          });
      if (error) throw new Error(error.message);
      setComplete(true);
      setStatusMessage(
        currentUser?.is_anonymous
          ? "Check your email to verify the account. Your anonymous workspace keeps the same identity while you confirm it."
          : "Check your email to verify your account, then return to your saved scan.",
      );
      return;
    }

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      });
      if (error) throw new Error(error.message);
      setComplete(true);
      setStatusMessage("If an account exists for that address, a reset link is on its way.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: values.password ?? "" });
    if (error) throw new Error(error.message);
    toast.success("Password updated.");
    router.push("/app/settings/profile");
  }

  async function exploreDemo() {
    const supabase = getBrowserSupabase();
    if (supabase) {
      const { error } = await supabase.auth.signInAnonymously({
        options: { data: { demo_session: true } },
      });
      if (error) {
        setStatusMessage(
          "The live deployment has not enabled anonymous demo sessions. Ask the operator to enable anonymous sign-ins, or use a demo-only deployment.",
        );
        return;
      }
    }
    startDemoSession();
    toast.success("Demo workspace ready.");
    router.push(nextPath);
    router.refresh();
  }

  const { title, body, submit } = copy[mode];

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-8">
        <p className="eyebrow mb-3">{productConfig.name}</p>
        <h1 className="text-4xl font-bold tracking-[-0.04em] text-[var(--text)]">{title}</h1>
        <p className="mt-3 leading-7 text-[var(--text-secondary)]">{body}</p>
      </div>

      {complete ? (
        <div
          className="rounded-[18px] border border-[var(--border)] bg-white p-6"
          role="status"
        >
          <CheckCircle2 className="mb-4 size-7 text-[var(--success)]" aria-hidden="true" />
          <p className="font-semibold">{statusMessage}</p>
          <Button asChild className="mt-6 w-full" variant="secondary">
            <Link href="/login">Return to login</Link>
          </Button>
        </div>
      ) : (
        <form
          className="space-y-5"
          noValidate
          onSubmit={form.handleSubmit((values) =>
            onSubmit(values).catch((error: unknown) => {
              const message = error instanceof Error ? error.message : "Authentication failed.";
              setStatusMessage(message);
            }),
          )}
        >
          {mode !== "update" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Email address</span>
              <span className="relative block">
                <Mail
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <input
                  className="min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-white py-3 pl-11 pr-4 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#0e6b4920]"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...form.register("email")}
                />
              </span>
              {form.formState.errors.email ? (
                <span className="mt-2 block text-sm text-[var(--danger)]" role="alert">
                  {form.formState.errors.email.message}
                </span>
              ) : null}
            </label>
          ) : (
            <input type="hidden" value="reset@session.local" {...form.register("email")} />
          )}

          {needsPassword ? (
            <div className="block">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                <label htmlFor="auth-password">Password</label>
                {mode === "login" ? (
                  <Link
                    className="font-semibold text-[var(--primary)] hover:underline"
                    href="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                ) : null}
              </div>
              <span className="relative block">
                <LockKeyhole
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <input
                  id="auth-password"
                  className="min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-white py-3 pl-11 pr-12 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#0e6b4920]"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="At least 8 characters"
                  {...form.register("password")}
                />
                <button
                  className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[var(--text-muted)] hover:text-[var(--text)]"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
              </span>
              {form.formState.errors.password ? (
                <span className="mt-2 block text-sm text-[var(--danger)]" role="alert">
                  {form.formState.errors.password.message}
                </span>
              ) : null}
            </div>
          ) : null}

          {statusMessage ? (
            <p
              className="rounded-xl bg-[var(--warning-soft)] px-4 py-3 text-sm leading-6 text-[#704a0e]"
              role="alert"
            >
              {statusMessage}
            </p>
          ) : null}

          <Button className="w-full" size="lg" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                {submit}
                <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </form>
      )}

      {mode === "login" || mode === "signup" ? (
        <>
          <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            <span className="h-px flex-1 bg-[var(--border)]" />
            Preview safely
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <Button
            className="w-full"
            variant="secondary"
            size="lg"
            onClick={() => void exploreDemo()}
          >
            Explore demo as Alex
          </Button>
          <p className="mt-3 text-center text-xs leading-5 text-[var(--text-muted)]">
            Demo data stays in this browser. Do not enter real credentials in demo mode.
          </p>
        </>
      ) : null}

      <p className="mt-7 text-center text-sm text-[var(--text-secondary)]">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link className="font-bold text-[var(--primary)] hover:underline" href="/signup">
              Create an account
            </Link>
          </>
        ) : mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link className="font-bold text-[var(--primary)] hover:underline" href="/login">
              Log in
            </Link>
          </>
        ) : (
          <Link className="font-bold text-[var(--primary)] hover:underline" href="/login">
            Back to login
          </Link>
        )}
      </p>

      {!isSupabaseConfigured() && (mode === "login" || mode === "signup") ? (
        <p className="sr-only">Live Supabase authentication is not configured.</p>
      ) : null}
    </div>
  );
}
