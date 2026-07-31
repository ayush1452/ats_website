import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { SEEDED_SCAN_PATH } from "./support";

const pages = [
  "/",
  "/pricing",
  "/scan",
  "/login",
  "/app",
  SEEDED_SCAN_PATH,
  "/app/settings/privacy",
] as const;

for (const route of pages) {
  test(`${route} has no serious or critical automated accessibility violations`, async ({
    page,
  }) => {
    await page.goto(route);
    await page.locator("body").waitFor();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    const severe = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );

    expect(
      severe,
      severe
        .map((violation) => {
          const targets = violation.nodes
            .flatMap((node) => node.target)
            .slice(0, 5)
            .join(", ");
          return `${violation.id}: ${violation.help} (${targets})`;
        })
        .join("\n"),
    ).toEqual([]);
  });
}
