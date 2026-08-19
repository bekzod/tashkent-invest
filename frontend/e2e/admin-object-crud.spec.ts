import { expect, test } from "@playwright/test";

test("admin uses the common dashboard and can save an object draft", async ({
  page,
}) => {
  test.skip(!process.env.E2E_API_READY, "Requires seeded local API.");
  await page.goto("/login");
  await expect(page.getByTestId("login-form")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
  await page.getByLabel(/email/i).fill("admin@demo.uz");
  await page.getByLabel(/password|parol/i).fill("invest2026");
  await page.getByRole("button", { name: /kirish|войти/i }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator('.invest-dashboard[data-dashboard-role="admin"]')).toBeVisible();
  await expect(page.locator('.admin-shell')).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /yangi obyekt/i }).first(),
  ).toBeVisible();

  await page
    .getByRole("link", { name: /yangi obyekt/i })
    .first()
    .click();
  await page.getByLabel("O‘zbekcha nom").fill("E2E qoralama obyekt");
  await page.getByLabel("Tuman").fill("Yunusobod");
  await page.getByRole("button", { name: /qoralama saqlash/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects\/[^/]+\/edit$/);
});

test("investor cannot access an admin-only dashboard route", async ({ page }) => {
  test.skip(!process.env.E2E_API_READY, "Requires seeded local API.");
  await page.goto("/login");
  await expect(page.getByTestId("login-form")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
  await page.getByLabel(/email/i).fill("investor@demo.uz");
  await page.getByLabel(/password|parol/i).fill("invest2026");
  await page.getByRole("button", { name: /kirish|войти/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/profile$/);
  await page.goto("/dashboard/projects/new");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator('.invest-dashboard[data-dashboard-role="investor"]')).toBeVisible();
});
