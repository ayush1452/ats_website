"use client";

import { CheckCircle2, Info, Send } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { TurnstileField } from "@/components/ui/turnstile-field";

type SubmissionState = "idle" | "loading" | "success" | "error";

const inputClassName =
  "mt-2 min-h-12 w-full rounded-[14px] border border-[var(--border-strong)] bg-white px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[color:rgba(14,107,73,.12)]";

export function ContactForm({ initialTopic = "product" }: { initialTopic?: string }) {
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
    const data = {
      ...Object.fromEntries(new FormData(form).entries()),
      ...(captchaToken ? { captchaToken } : {}),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
        persisted?: boolean;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "We could not send your message.");
      }
      form.reset();
      setState("success");
      setPersisted(result.persisted ?? null);
      setMessage(
        result.message ??
          (result.persisted === true
            ? "Message received. We’ll reply as soon as we can."
            : "This deployment accepted the form, but did not confirm that the message was saved or sent."),
      );
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
  }

  if (state === "success") {
    return (
      <div
        className="grid min-h-[420px] place-items-center rounded-[24px] border border-[var(--border)] bg-white p-8 text-center shadow-[var(--shadow-sm)]"
        role="status"
      >
        <div>
          <span
            className={`mx-auto grid size-14 place-items-center rounded-full ${
              persisted !== true
                ? "bg-[var(--info-soft)] text-[var(--info)]"
                : "bg-[var(--success-soft)] text-[var(--primary)]"
            }`}
          >
            {persisted !== true ? (
              <Info aria-hidden="true" className="size-7" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="size-7" />
            )}
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
            {persisted === true ? "Thanks for reaching out." : "Submission not confirmed."}
          </h2>
          <p className="mx-auto mt-3 max-w-sm leading-7 text-[var(--text-secondary)]">{message}</p>
          <Button className="mt-6" onClick={() => setState("idle")} variant="secondary">
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Name
          <input
            autoComplete="name"
            className={inputClassName}
            name="name"
            required
            type="text"
          />
        </label>
        <label className="text-sm font-semibold">
          Email
          <input
            autoComplete="email"
            className={inputClassName}
            name="email"
            required
            type="email"
          />
        </label>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Company or organization <span className="font-normal text-[var(--text-muted)]">(optional)</span>
          <input autoComplete="organization" className={inputClassName} name="company" type="text" />
        </label>
        <label className="text-sm font-semibold">
          What can we help with?
          <select className={inputClassName} defaultValue={initialTopic} name="topic">
            <option value="product">Product question</option>
            <option value="privacy">Privacy and data</option>
            <option value="teams">Teams and coaching</option>
            <option value="billing">Plans and billing</option>
            <option value="support">Technical support</option>
          </select>
        </label>
      </div>
      <label className="mt-5 block text-sm font-semibold">
        Message
        <textarea
          className={`${inputClassName} min-h-40 resize-y py-3`}
          maxLength={4000}
          name="message"
          required
        />
      </label>
      <div className="mt-5">
        <TurnstileField action="contact" onToken={setCaptchaToken} />
      </div>
      <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p
          aria-live="polite"
          className="text-sm text-[var(--danger)]"
          role={state === "error" ? "alert" : "status"}
        >
          {message}
        </p>
        <Button className="shrink-0" disabled={state === "loading"} type="submit">
          <Send aria-hidden="true" className="size-4" />
          {state === "loading" ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
