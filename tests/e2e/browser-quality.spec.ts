import { expect, test } from "@playwright/test";

import { captureBrowserErrors, SEEDED_SCAN_PATH } from "./support";

test("core pages emit no browser console errors or uncaught exceptions", async ({
  context,
}) => {
  const routes = [
    "/",
    "/pricing",
    "/scan",
    "/login",
    "/app",
    SEEDED_SCAN_PATH,
  ] as const;

  for (const route of routes) {
    const page = await context.newPage();
    const errors = captureBrowserErrors(page);
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(400);
    await page.locator("body").waitFor();
    await page.waitForTimeout(100);
    expect(errors, `Browser errors on ${route}`).toEqual([]);
    await page.close();
  }
});

test("invalid private-share tokens fail closed without leaking a report", async ({ page }) => {
  await page.goto("/share/invalid-demo-token-that-cannot-match-a-live-share");
  await expect(
    page.getByRole("heading", { name: /Shared report unavailable/iu }),
  ).toBeVisible();
  await expect(page.getByText(/Alex Morgan/iu)).toHaveCount(0);
});
