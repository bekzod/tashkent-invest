import { expect, test } from "@playwright/test";
import {
  assertE2ECleanupTarget,
  E2E_OBJECTS,
  e2eCleanupTargets,
} from "./fixtures/test-data";
import { installDeterministicMapTiles, prepareVisualTest } from "./helpers/visual";

test("runs with the deterministic desktop or mobile Chromium contract", async ({ page }, testInfo) => {
  const expected =
    testInfo.project.name === "mobile-chromium"
      ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }
      : { viewport: { width: 1440, height: 900 }, hasTouch: false, isMobile: false };

  expect(testInfo.project.use.browserName).toBe("chromium");
  expect(testInfo.project.use.viewport).toEqual(expected.viewport);
  expect(testInfo.project.use.hasTouch).toBe(expected.hasTouch);
  expect(testInfo.project.use.isMobile).toBe(expected.isMobile);
  expect(testInfo.project.use.contextOptions?.reducedMotion).toBe("reduce");
  expect(page.viewportSize()).toEqual(expected.viewport);

  await prepareVisualTest(page);
  await page.goto(
    `data:text/html,${encodeURIComponent(`
      <style>@keyframes pulse { from { opacity: 0 } to { opacity: 1 } }</style>
      <main style="animation: pulse 5s infinite">E2E configuration ready</main>
    `)}`,
  );
  await expect
    .poll(() => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches))
    .toBe(true);
  await expect
    .poll(() => page.locator("main").evaluate((node) => getComputedStyle(node).animationDuration))
    .toBe("0s");
});

test("fixtures cover public statuses and expose only guarded cleanup targets", () => {
  expect(E2E_OBJECTS.map(({ status }) => status).sort()).toEqual([
    "auction",
    "available",
    "upcoming",
  ]);
  expect(e2eCleanupTargets()).toEqual({
    emails: ["e2e-admin@invest.test", "e2e-investor@invest.test"],
    slugs: ["e2e-available-land", "e2e-upcoming-object", "e2e-auction-object"],
  });
  expect(() => assertE2ECleanupTarget("investor@demo.uz")).toThrow(/Unsafe E2E cleanup/);
  expect(() => assertE2ECleanupTarget("e2e-%")).toThrow(/Unsafe E2E cleanup/);
});

test("serves the local SVG for remote map tile requests", async ({ page }) => {
  await installDeterministicMapTiles(page);
  await page.setContent(
    '<img alt="deterministic map tile" src="https://tile.openstreetmap.org/0/0/0.png">',
  );
  const tile = page.getByAltText("deterministic map tile");
  await expect(tile).toHaveJSProperty("naturalWidth", 256);
  await expect(tile).toHaveJSProperty("naturalHeight", 256);
});
