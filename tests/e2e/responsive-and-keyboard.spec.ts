import { expect, test } from "@playwright/test";

import { SEEDED_SCAN_PATH } from "./support";

test("390px report exposes explicit Analysis and Resume modes with bidirectional selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(SEEDED_SCAN_PATH);

  const analysisMode = page.getByRole("button", { name: "Analysis", exact: true });
  const resumeMode = page.getByRole("button", { name: "Resume", exact: true });
  await expect(analysisMode).toHaveAttribute("aria-pressed", "true");
  await expect(resumeMode).toHaveAttribute("aria-pressed", "false");

  const findingButton = page
    .getByRole("button", { name: /Skills table may change extraction order/iu })
    .first();
  const findingArticleId = await findingButton
    .locator("xpath=ancestor::article[1]")
    .getAttribute("id");
  const findingId = findingArticleId?.replace(/^finding-/u, "");
  expect(findingId).toBeTruthy();

  await findingButton.click();
  await expect(resumeMode).toHaveAttribute("aria-pressed", "true");
  const selectedAnnotation = page.locator(`[data-finding-id="${findingId}"]`).first();
  await expect(selectedAnnotation).toBeVisible();
  await expect(selectedAnnotation).toHaveAttribute("aria-pressed", "true");

  await selectedAnnotation.click();
  await expect(analysisMode).toHaveAttribute("aria-pressed", "true");
  await expect(findingButton).toHaveAttribute("aria-expanded", "true");

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});

test("keyboard users can skip navigation and operate the public scan controls", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The touch-device project does not expose desktop keyboard tab traversal.");
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/u);

  await page.goto("/scan");
  const pasteMode = page.getByRole("button", { name: "Paste text" });
  await pasteMode.focus();
  await page.keyboard.press("Enter");
  await expect(pasteMode).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Resume text")).toBeVisible();
});

test.describe("reduced motion", () => {
  test("motion-heavy entry styles collapse to an immediate equivalent", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const motion = await page.locator(".animate-rise").first().evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        animationDuration: style.animationDuration,
        animationIterationCount: style.animationIterationCount,
        scrollBehavior: window.getComputedStyle(document.documentElement).scrollBehavior,
      };
    });
    expect(motion.animationDuration).toBe("0s");
    expect(motion.animationIterationCount).toBe("1");
    expect(motion.scrollBehavior).toBe("auto");

    await page.goto(SEEDED_SCAN_PATH);
    const scoreAnimation = page.locator(".animate-score").first();
    if (await scoreAnimation.count()) {
      await expect(scoreAnimation).toHaveCSS("animation-duration", "0s");
    }
  });
});
