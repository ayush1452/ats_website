"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render(
        container: HTMLElement,
        options: {
          sitekey: string;
          action: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
          theme: "light";
        },
      ): string;
      remove(widgetId: string): void;
    };
  }
}

export function TurnstileField({
  action,
  onToken,
  inverse = false,
}: {
  action: string;
  onToken: (token: string | null) => void;
  inverse?: boolean;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.turnstile),
  );

  const renderWidget = useCallback(() => {
    if (
      !siteKey ||
      !containerRef.current ||
      !window.turnstile ||
      widgetRef.current
    ) {
      return;
    }
    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(null),
      "error-callback": () => onToken(null),
      theme: "light",
    });
  }, [action, onToken, siteKey]);

  useEffect(() => {
    if (scriptReady) renderWidget();
    return () => {
      if (widgetRef.current && window.turnstile) {
        window.turnstile.remove(widgetRef.current);
        widgetRef.current = null;
      }
    };
  }, [renderWidget, scriptReady]);

  if (!siteKey) return null;

  return (
    <div className="space-y-2">
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div
        ref={containerRef}
        aria-label="Human verification"
        className="min-h-[65px]"
      />
      <p
        className={
          inverse
            ? "text-[11px] leading-4 text-white/55"
            : "text-[11px] leading-4 text-[var(--text-muted)]"
        }
      >
        Verification is enabled only when this deployment configures production
        abuse protection.
      </p>
    </div>
  );
}
