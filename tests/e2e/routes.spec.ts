import { expect, test } from "@playwright/test";

import {
  appRoutes,
  decodeHtmlAttribute,
  publicRoutes,
} from "./support";

test("every public, authentication, and metadata route resolves", async ({
  request,
}, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), "Route integrity runs once in the desktop project.");

  for (const route of publicRoutes) {
    const response = await request.get(route);
    expect(response.status(), `${route} returned ${response.status()}`).toBeLessThan(400);
  }
});

test("every application route resolves in deterministic demo mode", async ({
  request,
}, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), "Route integrity runs once in the desktop project.");

  for (const route of appRoutes) {
    const response = await request.get(route);
    expect(response.status(), `${route} returned ${response.status()}`).toBeLessThan(400);
  }
});

test("rendered internal links have concrete destinations and resolve", async ({
  request,
}, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), "The link crawl runs once in the desktop project.");

  const sourceRoutes = [...publicRoutes, ...appRoutes].filter(
    (route) => !route.endsWith(".txt") && !route.endsWith(".xml"),
  );
  const links = new Map<string, string>();

  for (const sourceRoute of sourceRoutes) {
    const response = await request.get(sourceRoute);
    expect(response.ok(), `Could not crawl ${sourceRoute}`).toBeTruthy();
    const html = await response.text();

    for (const match of html.matchAll(/\shref="([^"]*)"/gu)) {
      const rawHref = decodeHtmlAttribute(match[1] ?? "").trim();
      expect(
        rawHref,
        `${sourceRoute} contains an empty or placeholder href`,
      ).not.toMatch(/^(?:#?$|javascript:)/iu);
      if (!rawHref.startsWith("/") || rawHref.startsWith("//")) continue;
      const destination = rawHref.split("#", 1)[0] ?? "";
      if (!destination || destination.startsWith("/api/")) continue;
      links.set(destination, sourceRoute);
    }
  }

  expect(links.size, "The crawl did not discover any internal links").toBeGreaterThan(20);
  for (const [destination, sourceRoute] of links) {
    const response = await request.get(destination);
    expect(
      response.status(),
      `${sourceRoute} links to ${destination}, which returned ${response.status()}`,
    ).toBeLessThan(400);
  }
});

test("unknown routes use the professional 404 experience", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "This path is not in your report." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a scan" })).toBeVisible();
});
