import { test, expect } from "@playwright/test";

test("investor can log in, inspect a map object, and submit an application", async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_API_READY,
    "Requires the Docker-backed API and seeded PostgreSQL.",
  );
  await page.goto("/login");
  await expect(page.getByTestId("login-form")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
  await page.getByLabel(/email/i).fill("investor@demo.uz");
  await page.getByLabel(/password|parol/i).fill("invest2026");
  await page.getByRole("button", { name: /kirish|войти/i }).click();
  await page.waitForURL(/\/dashboard\/profile$/);
  await page.goto("/map");
  await page
    .locator('[data-testid="map-result-card"][data-object-status="available"]')
    .first()
    .getByRole("link", { name: /batafsil|подробнее/i })
    .click();
  await page.waitForURL(/\/objects\//);
  await expect(
    page.getByRole("heading", { name: /qiziqish bildirish|интерес/i }),
  ).toBeVisible();
  await page.getByLabel(/f\.i\.sh\.|ism|имя/i).fill("Demo Investor");
  await page.getByLabel(/telefon|телефон/i).fill("+998901234567");
  await page.getByLabel(/email/i).fill("investor@demo.uz");
  await page.getByRole("button", { name: /yuborish|отправить/i }).click();
  await expect(page.getByText(/qabul qilindi|принята/i)).toBeVisible();
});
