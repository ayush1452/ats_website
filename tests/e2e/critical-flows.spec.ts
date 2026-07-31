import { expect, test } from "@playwright/test";

import { SEEDED_SCAN_PATH } from "./support";

const pastedResume = `ALEX MORGAN
alex.morgan@example.test · Chicago, IL

SUMMARY
Product manager with six years of experience building accessible B2B SaaS products.

EXPERIENCE
Led roadmap planning with engineering and design across two product squads.
Owned three launches, interviewed customers, and improved verified activation by 18%.
Partnered with sales and support to prioritize platform reliability work.

SKILLS
Product strategy, Agile, SQL, Figma, Jira, customer research

EDUCATION
B.S. Business Analytics`;

test("homepage preview and sample-report path open the real seeded workspace", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "See why your resume gets filtered out." }),
  ).toBeVisible();

  const preview = page.getByLabel(/Interactive sample .+ report/iu).first();
  await preview.getByRole("button", { name: "Keywords", exact: true }).click();
  await expect(preview.getByText("One important role signal is missing")).toBeVisible();
  await preview.getByRole("button", { name: "Format", exact: true }).click();
  await expect(preview.getByText("One layout choice needs attention")).toBeVisible();

  await page.getByRole("link", { name: "View sample report" }).click();
  await expect(page).toHaveURL(new RegExp(`${SEEDED_SCAN_PATH.replaceAll("/", "\\/")}(?:\\?.*)?$`, "u"));
  await expect(
    page.locator("#main-content").getByText("Demo analysis").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "This report is not saved on this device" }),
  ).toHaveCount(0);
});

test("demo login opens seeded data without pretending to create an account", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Explore demo as Alex/iu }).click();
  await expect(page).toHaveURL(/\/app$/u);
  await expect(page.getByRole("heading", { name: "Your resume workspace" })).toBeVisible();
  await expect(page.getByText("Demo analysis").first()).toBeVisible();
});

test("unconfigured signup stays honest and offers the demo path", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email address").fill("person@example.com");
  await page.getByLabel("Password", { exact: true }).fill("LocalTestOnly!2026");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByText(/Live authentication is not configured.+no real account will be created/iu),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/signup/u);
});

test("pricing cadence updates every configured plan and preserves the chosen cadence", async ({
  page,
}) => {
  await page.goto("/pricing");
  const annual = page.getByRole("button", { name: "Annual", exact: true });
  await annual.click();
  await expect(annual).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText("Annual prices are shown as a full-year total. No time-limited discount."),
  ).toBeVisible();

  const expectedPrices = new Map([
    ["Free", "$0"],
    ["Pro", "$190"],
    ["Career Plus", "$390"],
    ["Teams & Coaches", "$990"],
  ]);
  for (const [planName, price] of expectedPrices) {
    const plan = page.getByRole("article").filter({
      has: page.getByRole("heading", { name: planName, exact: true }),
    });
    await expect(plan.getByText(price, { exact: true })).toBeVisible();
  }

  const proPlan = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Pro", exact: true }),
  });
  await proPlan.getByRole("link", { name: "Choose Pro" }).click();
  await expect(page).toHaveURL(/\/signup\?plan=pro&billing=annual$/u);
});

test("a pasted optional-JD scan streams stages and opens its exact generated local report", async ({
  page,
}) => {
  await page.goto("/scan");
  await page.getByRole("button", { name: "Paste text" }).click();
  await page.getByLabel("Resume text").fill(pastedResume);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue without JD" }).click();
  await page.getByLabel("Target role").fill("Senior Product Manager");

  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/scans",
  );
  await page.getByRole("button", { name: "Analyze resume" }).click();
  await expect(page.getByRole("heading", { name: "Creating your evidence report" })).toBeVisible();

  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/x-ndjson");
  const records = (await response.text())
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as {
      type?: string;
      id?: string;
      stage?: string;
      document?: unknown;
    });
  const stageNames = records.flatMap((record) => record.stage ? [record.stage] : []);
  expect(stageNames).toEqual(
    expect.arrayContaining(["validate", "structure", "evidence", "match", "score", "complete"]),
  );
  const resultRecord = records.find((record) => record.type === "result");
  expect(resultRecord?.id).toMatch(/^[0-9a-f-]{36}$/iu);
  expect(resultRecord?.document).toBeTruthy();

  const generatedId = resultRecord?.id as string;
  expect(generatedId).not.toBe("alex-morgan-product-lead");
  await page.waitForURL(
    (url) => url.pathname === `/app/scans/${generatedId}`,
    { timeout: 30_000 },
  );
  await expect(page.getByText("Demo analysis").first()).toBeVisible();
  await page.getByRole("link", { name: "Methodology" }).click();
  await expect(page).toHaveURL(new RegExp(`/app/scans/${generatedId}\\?tab=reports$`, "u"));
  await expect(page.getByRole("heading", { name: "Score methodology" })).toBeVisible();
  await expect(page.getByText(/uses product heuristics/iu)).toBeVisible();

  const reportNav = page.getByRole("navigation", { name: "Report sections" }).first();
  await reportNav.getByRole("button", { name: "Job match", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Job match is unavailable" })).toBeVisible();
});

test("every report tab is URL-addressable and renders its primary surface", async ({
  page,
}) => {
  await page.goto(SEEDED_SCAN_PATH);
  const reportNav = page.getByRole("navigation", { name: "Report sections" }).first();
  const tabs = [
    ["Keywords", "keywords", "Weighted keyword match"],
    ["Sections", "sections", "Detected sections"],
    ["Impact", "impact", "Achievement density"],
    ["AI tools", "ai-tools", "Demo suggestions"],
    ["Format", "format", "Low-to-moderate parsing risk"],
    ["Job match", "job-match", "Requirements are partially covered"],
    ["Export & share", "reports", "Score methodology"],
  ] as const;

  for (const [label, slug, evidence] of tabs) {
    await reportNav.getByRole("button", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`[?&]tab=${slug}(?:&|$)`, "u"));
    await expect(page.getByText(evidence, { exact: false }).first()).toBeVisible();
  }

  await reportNav.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page).not.toHaveURL(/[?&]tab=/u);
  await expect(page.getByRole("heading", { name: "Prioritized findings" })).toBeVisible();
});

test("finding and resume annotation selection stay synchronized in both directions", async ({
  page,
  isMobile,
}) => {
  await page.goto(SEEDED_SCAN_PATH);
  const findingButton = page
    .getByRole("button", { name: /Skills table may change extraction order/iu })
    .first();
  const findingId = await findingButton.locator("xpath=ancestor::article[1]").getAttribute("id");
  const rawId = findingId?.replace(/^finding-/u, "");
  expect(rawId).toBeTruthy();

  await findingButton.click();

  const annotation = page.locator(`[data-finding-id="${rawId}"]`).first();
  if (isMobile) {
    await expect(page.getByRole("button", { name: "Resume", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(annotation).toBeVisible();
  } else {
    await expect(findingButton).toHaveAttribute("aria-expanded", "true");
  }
  await expect(annotation).toHaveAttribute("aria-pressed", "true");
  await annotation.click();
  if (isMobile) {
    await expect(page.getByRole("button", { name: "Analysis", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  await expect(findingButton).toHaveAttribute("aria-expanded", "true");
});

test("report export returns and downloads a PDF from the real endpoint", async ({ page }) => {
  await page.goto(`${SEEDED_SCAN_PATH}?tab=reports`);
  const responsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/reports/export",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export report PDF/iu }).click();

  const [response, download] = await Promise.all([responsePromise, downloadPromise]);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  expect(download.suggestedFilename()).toMatch(/report-.+\.pdf$/iu);
  await expect(page.getByRole("status")).toContainText("report PDF was downloaded");
});

test("mobile menu traps interaction and restores focus on Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Scan my resume" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
