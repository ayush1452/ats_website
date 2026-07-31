import type { ConsoleMessage, Page } from "@playwright/test";

export const SEEDED_SCAN_PATH = "/app/scans/alex-morgan-product-lead";

export const publicRoutes = [
  "/",
  "/features",
  "/features/ats-parser",
  "/features/job-match",
  "/features/keyword-analysis",
  "/features/impact-analysis",
  "/features/ai-rewrite",
  "/features/version-comparison",
  "/how-it-works",
  "/scan",
  "/pricing",
  "/case-studies",
  "/case-studies/product-manager-platform-growth",
  "/case-studies/software-engineer-developer-platform",
  "/case-studies/marketing-manager-b2b-demand",
  "/resources",
  "/resources/read-your-resume-like-a-parser",
  "/resources/job-description-evidence-map",
  "/resources/keyword-matching-without-stuffing",
  "/resources/write-impact-without-inventing-metrics",
  "/resources/resume-formatting-risk-checklist",
  "/resources/privacy-questions-before-uploading-a-resume",
  "/faq",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/login",
  "/signup",
  "/forgot-password",
  "/auth/session-expired",
  "/auth/update-password",
  "/auth/verify",
  "/unauthorized",
  "/robots.txt",
  "/sitemap.xml",
] as const;

export const appRoutes = [
  "/app",
  "/app/overview",
  "/app/onboarding",
  "/app/scan",
  "/app/scans",
  SEEDED_SCAN_PATH,
  "/app/history",
  "/app/resumes",
  "/app/resumes/alex-morgan",
  "/app/jobs",
  "/app/compare",
  "/app/reports",
  "/app/billing",
  "/app/settings",
  "/app/settings/profile",
  "/app/settings/privacy",
  "/app/settings/notifications",
  "/app/team",
] as const;

const ignoredDevelopmentConsolePatterns = [
  /WebSocket connection to .*\/_next\/webpack-hmr.* failed/iu,
  /WebSocket is closed before the connection is established/iu,
];

function isIgnoredDevelopmentMessage(message: string): boolean {
  return ignoredDevelopmentConsolePatterns.some((pattern) => pattern.test(message));
}

export function captureBrowserErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (!isIgnoredDevelopmentMessage(text)) {
      errors.push(`console.error: ${text}`);
    }
  });

  return errors;
}

export function decodeHtmlAttribute(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"');
}
