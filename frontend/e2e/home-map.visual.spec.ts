import { expect, test } from "@playwright/test";
import { prepareVisualTest } from "./helpers/visual";

test.describe("homepage map visuals", () => {
  test.skip(!process.env.E2E_API_READY, "Requires the guarded seeded local API.");

  test("map-first and selected preview states stay stable", async ({ page }) => {
    await prepareVisualTest(page);
    const areasResponse = page.waitForResponse(
      (response) => response.url().includes("/api/areas") && response.status() === 200,
    );
    const districtMapResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/objects/map?") &&
        response.url().includes("areaSlug=tashkent-district") &&
        response.status() === 200,
    );
    await page.goto("/uz");
    await areasResponse;
    await districtMapResponse;
    await expect(page.getByTestId("home-map-result").first()).toBeVisible();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
    );
    // The district fit uses a short MapLibre camera transition. Let that
    // transition finish before capturing the stable visual contract.
    await page.waitForTimeout(1_500);
    await page.addStyleTag({
      content:
        "nextjs-portal { display: none !important; } .reference-card-grid img { visibility: hidden !important; }",
    });
    await expect(page.locator(".reference-hero")).toHaveScreenshot(
      "home-map-initial.png",
    );

    const firstResult = page.getByTestId("home-map-result").first();
    await firstResult.click();
    await expect(page.getByTestId("home-map-preview")).toBeVisible();
    await expect(page.locator(".reference-hero")).toHaveScreenshot(
      "home-map-selected.png",
    );
  });
});
