import { expect, test } from "@playwright/test";
import { expectVisualSnapshot, prepareVisualTest } from "./helpers/visual";

const adminApplication = {
  id: "visual-application-1",
  status: "in_review",
  name: "Dilnoza Karimova",
  company: "Toshkent Logistics",
  country: "O‘zbekiston",
  phone: "+998 90 123 45 67",
  email: "dilnoza@example.uz",
  investmentAmountUsd: 750000,
  projectDescription: "Logistika markazi va sovutish ombori loyihasi.",
  comment: "Yer hujjatlari bilan tanishishni istaymiz.",
  createdAt: "2026-09-28T10:00:00.000Z",
  reviewNote: "Hujjatlar ko‘rib chiqilmoqda.",
  object: { title: "Sanoat uchun yer uchastkasi 1", slug: "tashkent-invest-1" },
};

test.beforeEach(async ({ page }) => {
  await prepareVisualTest(page);
  await page.route(/picsum\.photos/, (route) => route.abort());
});

test("available-object application form is usable at the target viewport", async ({
  page,
}, testInfo) => {
  test.skip(!process.env.E2E_API_READY, "Requires the seeded Docker API.");
  await page.addInitScript(() => {
    localStorage.setItem(
      "tashkent-invest.session",
      JSON.stringify({
        token: "visual-token",
        user: {
          id: "visual-investor",
          name: "Dilnoza Karimova",
          email: "dilnoza@example.uz",
          role: "investor",
        },
      }),
    );
  });
  await page.goto("/uz/objects/tashkent-invest-1#application");
  await expect(
    page.getByRole("heading", { name: "Qiziqish bildirish" }),
  ).toBeVisible();
  await expectVisualSnapshot(
    page,
    `application-form-${testInfo.project.name}.png`,
  );
});

test("admin review inbox remains readable and actionable", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "tashkent-invest.session",
      JSON.stringify({
        token: "visual-admin-token",
        user: {
          id: "visual-admin",
          name: "Portal Admin",
          email: "admin@example.uz",
          role: "admin",
        },
      }),
    );
  });
  await page.route("**/api/admin/applications?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [adminApplication],
        meta: { page: 1, total: 1, totalPages: 1 },
      }),
    });
  });
  await page.goto("/dashboard/applications");
  await page.getByRole("button", { name: /Dilnoza Karimova/i }).click();
  await expect(page.getByRole("button", { name: "Tasdiqlash" })).toBeVisible();
  await expectVisualSnapshot(
    page,
    `application-admin-review-${testInfo.project.name}.png`,
  );
});
