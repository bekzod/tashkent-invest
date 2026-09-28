import { expect, test } from "@playwright/test";
import { expectVisualSnapshot, prepareVisualTest } from "./helpers/visual";

test.describe("responsive investment map visuals", () => {
  test.skip(!process.env.E2E_API_READY, "Requires the guarded seeded local API.");

  test("initial, filtered and selected states stay stable", async ({ page }) => {
    await prepareVisualTest(page);
    await page.goto("/uz/map");
    await expect(page.getByTestId("map-result-card").first()).toBeVisible();
    await page.addStyleTag({
      content:
        "nextjs-portal { display: none !important; } .object-card-image img, .selected-object-media img { visibility: hidden !important; }",
    });
    await expectVisualSnapshot(page, "mobile-map-initial.png");

    const filterToggle = page.getByRole("button", { name: "Filtrlarni ochish" });
    if (await filterToggle.isVisible()) await filterToggle.click();
    const response = page.waitForResponse(
      (item) => item.url().includes("/api/objects/map?") && item.status() === 200,
    );
    await page.getByRole("button", { name: "Yer uchastkasi" }).click();
    await response;
    await expect(page.getByRole("button", { name: "Yer uchastkasi" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expectVisualSnapshot(page, "mobile-map-filtered.png");

    const closeFilters = page.getByRole("button", { name: "Filtrlarni yopish" });
    if (await closeFilters.isVisible()) await closeFilters.click();
    await page.getByTestId("map-result-card").first().click({ position: { x: 80, y: 100 } });
    await expect(page.getByTestId("selected-object-panel")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expectVisualSnapshot(page, "mobile-map-selected.png");
  });
});
