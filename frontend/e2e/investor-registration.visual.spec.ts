import { expect, test } from "@playwright/test";
import { expectVisualSnapshot, prepareVisualTest } from "./helpers/visual";

test.beforeEach(async ({ page }) => {
  await prepareVisualTest(page);
});

test("registration empty state", async ({ page }, testInfo) => {
  await page.goto("/uz/register");
  await expect(
    page.getByRole("heading", { name: "Investor hisobini yarating" }),
  ).toBeVisible();
  await expectVisualSnapshot(
    page,
    `registration-empty-${testInfo.project.name}.png`,
  );
});

test("registration validation state", async ({ page }, testInfo) => {
  await page.goto("/ru/register");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(
    page.getByText("Для регистрации необходимо согласие."),
  ).toBeVisible();
  await expectVisualSnapshot(
    page,
    `registration-validation-${testInfo.project.name}.png`,
  );
});

test("registration duplicate state", async ({ page }, testInfo) => {
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ code: "ACCOUNT_EXISTS", error: "ACCOUNT_EXISTS" }),
    }),
  );
  await page.goto("/uz/register");
  await page.getByLabel("F.I.Sh.").fill("E2E Existing Investor");
  await page.getByLabel("Email").fill("e2e-existing@invest.test");
  await page.getByLabel("Parol", { exact: true }).fill("E2E-invest-2026!");
  await page.getByLabel("Parolni tasdiqlang").fill("E2E-invest-2026!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Hisob yaratish" }).click();
  await expect(page.locator(".auth-status[role=alert]")).toBeVisible();
  await expectVisualSnapshot(
    page,
    `registration-duplicate-${testInfo.project.name}.png`,
  );
});
