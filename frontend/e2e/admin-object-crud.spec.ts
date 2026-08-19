import { expect, test } from "@playwright/test";

test("admin has a distinct workspace and can save an object draft", async ({
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

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.locator(".admin-sidebar")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /yangi obyekt qo‘shish/i }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: /yangi obyekt qo‘shish/i })
    .first()
    .click();
  await page.getByLabel("O‘zbekcha nom").fill("E2E qoralama obyekt");
  await page.getByLabel("Tuman").fill("Yunusobod");
  await page.getByRole("button", { name: /qoralama saqlash/i }).click();
  await expect(page).toHaveURL(/\/admin\/objects\/[^/]+\/edit$/);
});

test("investor is not allowed into the admin workspace", async ({ page }) => {
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
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard$/);
});
