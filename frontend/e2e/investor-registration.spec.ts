import { expect, test } from "@playwright/test";

const registrationResponse = {
  token: "e2e-registration-token",
  user: {
    id: "e2e-registration-user",
    name: "E2E New Investor",
    email: "e2e-new-investor@invest.test",
    role: "investor",
    emailVerified: false,
  },
  emailVerification: "not_configured",
};

async function fillRegistration(
  page: import("@playwright/test").Page,
  locale: "uz" | "ru",
) {
  await page
    .getByLabel(locale === "uz" ? "F.I.Sh." : "Ф.И.О.")
    .fill("  E2E   New Investor ");
  await page.getByLabel("Email").fill(" E2E-NEW-INVESTOR@INVEST.TEST ");
  await page
    .getByLabel(locale === "uz" ? "Parol" : "Пароль", { exact: true })
    .fill("E2E-invest-2026!");
  await page
    .getByLabel(locale === "uz" ? "Parolni tasdiqlang" : "Подтвердите пароль")
    .fill("E2E-invest-2026!");
  await page.getByRole("checkbox").check();
}

test("investor registration normalizes input, stores the session, and safely returns", async ({
  page,
}) => {
  let requestBody: Record<string, unknown> | undefined;
  await page.route("**/api/auth/register", async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(registrationResponse),
    });
  });
  await page.goto(
    "/uz/register?returnTo=%2Fuz%2Fobjects%2Fe2e-available-land%23application",
  );
  await fillRegistration(page, "uz");
  await page.getByRole("button", { name: "Hisob yaratish" }).click();

  await expect(page).toHaveURL(
    /\/uz\/objects\/e2e-available-land#application$/,
  );
  expect(requestBody).toEqual({
    name: "E2E New Investor",
    email: "e2e-new-investor@invest.test",
    password: "E2E-invest-2026!",
    consent: true,
    locale: "uz",
  });
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("tashkent-invest.session")),
    )
    .toContain("e2e-registration-user");
});

test("registration shows localized validation and duplicate errors", async ({
  page,
}) => {
  await page.goto("/ru/register");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(
    page.getByText("Введите корректный адрес электронной почты."),
  ).toBeVisible();
  await expect(
    page.getByText("Для регистрации необходимо согласие."),
  ).toBeVisible();

  await page.route("**/api/auth/register", (route) =>
    route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ code: "ACCOUNT_EXISTS", error: "ACCOUNT_EXISTS" }),
    }),
  );
  await fillRegistration(page, "ru");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await expect(page.locator(".auth-status[role=alert]")).toContainText(
    "Аккаунт с этим email уже существует.",
  );
});

test("registration refuses an external returnTo destination", async ({
  page,
}) => {
  await page.route("**/api/auth/register", (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(registrationResponse),
    }),
  );
  await page.goto("/uz/register?returnTo=https%3A%2F%2Fevil.example%2Fsteal");
  await fillRegistration(page, "uz");
  await page.getByRole("button", { name: "Hisob yaratish" }).click();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("tashkent-invest.session")))
    .toContain("e2e-registration-user");
  await expect.poll(() => page.url()).not.toContain("/uz/register");
  expect(page.url()).toMatch(/localhost:3000\/dashboard\/profile$/);
});

test("real registration API completes the browser flow", async ({ page }) => {
  test.skip(
    !process.env.E2E_API_READY,
    "Requires the Docker-backed API and seeded PostgreSQL.",
  );
  const unique = `e2e-register-${Date.now()}@invest.test`;
  await page.goto("/uz/register");
  await page.getByLabel("F.I.Sh.").fill("E2E Registered Investor");
  await page.getByLabel("Email").fill(unique);
  await page.getByLabel("Parol", { exact: true }).fill("E2E-invest-2026!");
  await page.getByLabel("Parolni tasdiqlang").fill("E2E-invest-2026!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Hisob yaratish" }).click();
  await expect(page).toHaveURL(/\/dashboard\/profile$/);
  await expect(
    page.getByRole("heading", { name: "E2E Registered Investor" }),
  ).toBeVisible();
});
