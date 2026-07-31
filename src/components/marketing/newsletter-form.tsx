"use client";

import { ArrowRight, CheckCircle2, Info } from "lucide-react";
import { type FormEvent, useState } from "react";

import { productConfig } from "@/config/product";
import { TurnstileField } from "@/components/ui/turnstile-field";

type SubmissionState = "idle" | "loading" | "success" | "error";

export function NewsletterForm() {
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    setPersisted(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          ...(captchaToken ? { captchaToken } : {}),
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
        persisted?: boolean;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "We could not save your email.");
      }
      form.reset();
      setState("success");
      setPersisted(result.persisted ?? null);
      setMessage(
        result.message ??
          (result.persisted === true
            ? "You’re on the list. We’ll keep it useful."
            : "This deployment accepted the form, but did not confirm a subscription."),
      );
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
  }

  return (
    <form className="mt-4" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="newsletter-email">
        Work or personal email
      </label>
      <div className="flex max-w-md items-center rounded-full border border-white/18 bg-white/[0.08] p-1 focus-within:ring-2 focus-within:ring-white/70">
        <input
          className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/50"
          disabled={state === "loading"}
          id="newsletter-email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
        <button
          aria-label={`Subscribe to the ${productConfig.name} newsletter`}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[var(--primary-dark)] transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
          disabled={state === "loading"}
          type="submit"
        >
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div className="mt-3">
        <TurnstileField action="newsletter" inverse onToken={setCaptchaToken} />
      </div>
      <p
        aria-live="polite"
        className="mt-2 min-h-5 text-xs text-white/70"
        role={state === "error" ? "alert" : "status"}
      >
        {state === "success" ? (
          <span className="inline-flex items-center gap-1.5">
            {persisted !== true ? (
              <Info aria-hidden="true" className="size-3.5" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="size-3.5" />
            )}
            {message}
          </span>
        ) : (
          message
        )}
      </p>
    </form>
  );
}
