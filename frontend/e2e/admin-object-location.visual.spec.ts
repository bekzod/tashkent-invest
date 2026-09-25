import { expect, test, type Page } from "@playwright/test";
import { prepareVisualTest } from "./helpers/visual";

async function openNewObjectLocation(page: Page) {
  await page.goto("/uz/login");
  await page.getByLabel(/email/i).fill("admin@demo.uz");
  await page.getByLabel(/parol|password/i).fill("invest2026");
  await page.getByRole("button", { name: /kirish|войти/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/dashboard/projects/new");
  await page.getByRole("button", { name: /Joylashuv/ }).click();
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await expect(page.locator(".admin-location-picker-canvas")).toBeVisible();
}

test.describe("admin object location visuals", () => {
  test.skip(!process.env.E2E_API_READY, "Requires the guarded seeded local API.");

  test("empty, selected and invalid states remain readable", async ({ page }) => {
    await prepareVisualTest(page);
    await openNewObjectLocation(page);
    const card = page.locator(".admin-form-card");

    await expect(card).toHaveScreenshot("admin-location-empty.png", {
      animations: "disabled",
    });

    await page.getByLabel("Kenglik").fill("41.391335");
    await page.getByLabel("Uzunlik").fill("69.220651");
    await expect(page.getByText(/Joylashuv tanlandi/)).toBeVisible();
    await expect(card).toHaveScreenshot("admin-location-selected.png", {
      animations: "disabled",
    });

    await page.getByLabel("Kenglik").fill("41.31");
    await page.getByLabel("Uzunlik").fill("69.28");
    await expect(
      page.getByText(/Tanlangan nuqta Toshkent tumani chegarasidan tashqarida/),
    ).toBeVisible();
    await expect(card).toHaveScreenshot("admin-location-error.png", {
      animations: "disabled",
    });

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
});
