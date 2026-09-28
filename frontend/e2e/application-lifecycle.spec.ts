import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, email: string) {
  await page.goto("/uz/login");
  await expect(page.getByTestId("login-form")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password|parol/i).fill("invest2026");
  await page.getByRole("button", { name: /kirish|войти/i }).click();
  await page.waitForURL(/\/dashboard(?:\/profile)?$/);
}

async function clearSession(page: Page) {
  await page.evaluate(() => localStorage.removeItem("tashkent-invest.session"));
}

test("investor submission is reviewed by an admin and reflected back in the investor dashboard", async ({
  page,
}, testInfo) => {
  test.skip(
    !process.env.E2E_API_READY,
    "Requires the seeded Docker API and PostgreSQL.",
  );
  const device = testInfo.project.name.startsWith("mobile")
    ? "mobile"
    : "desktop";
  const investorEmail = `application-${device}@demo.uz`;

  await login(page, investorEmail);
  await page.goto("/uz/objects/tashkent-invest-1#application");
  await expect(
    page.getByRole("heading", { name: /qiziqish bildirish/i }),
  ).toBeVisible();
  await expect(page.getByLabel("F.I.Sh.")).toHaveValue(
    new RegExp(`Application ${device}`, "i"),
  );
  await page.getByLabel(/telefon/i).fill("+998901234567");
  await page.getByLabel(/investitsiya hajmi/i).fill("500000");
  await page
    .getByLabel(/loyiha tavsifi/i)
    .fill("E2E logistika va ishlab chiqarish loyihasi");
  await page.getByRole("button", { name: /yuborish/i }).click();
  await expect(page.getByRole("status")).toContainText(/qabul qilindi/i);
  await expect(page.getByRole("button", { name: /yuborildi/i })).toBeDisabled();

  await page.goto("/dashboard/applications");
  await expect(page.getByText(/qabul qilindi/i).first()).toBeVisible();

  await clearSession(page);
  await login(page, "admin@demo.uz");
  await page.goto("/dashboard/applications");
  const row = page.getByRole("button", {
    name: new RegExp(`Application ${device}`, "i"),
  });
  await expect(row).toBeVisible();
  await row.click();
  await page
    .getByLabel(/ko‘rib chiqish izohi/i)
    .fill("E2E hujjatlar tekshirildi");
  await page
    .getByRole("button", { name: /ko‘rib chiqishni boshlash/i })
    .click();
  await expect(page.getByRole("status")).toContainText(/yangilandi/i);
  await page.getByRole("button", { name: /tasdiqlash/i }).click();
  await expect(page.getByRole("status")).toContainText(/yangilandi/i);
  await expect(
    page.locator(".application-status.approved").first(),
  ).toBeVisible();

  await clearSession(page);
  await login(page, investorEmail);
  await page.goto("/dashboard/applications");
  await expect(
    page.locator(".application-status.approved").first(),
  ).toBeVisible();
});

test("upcoming objects never expose the application form", async ({ page }) => {
  test.skip(
    !process.env.E2E_API_READY,
    "Requires the seeded Docker API and PostgreSQL.",
  );
  await page.goto("/uz/objects/tashkent-invest-3");
  await expect(
    page.getByText("Bu obyekt hozir ariza qabul qilmaydi."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Yuborish" })).toHaveCount(0);
});
