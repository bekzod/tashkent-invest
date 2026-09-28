import { expect, test } from "@playwright/test";

test("Uzbek and Russian public routes render the requested language end-to-end", async ({
  page,
}) => {
  await page.goto("/uz");
  await expect(page.locator("html")).toHaveAttribute("lang", "uz");
  await expect(
    page.getByRole("heading", {
      name: "Tuman kelajagiga investitsiya kiriting",
    }),
  ).toBeVisible();

  await page.goto("/ru");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(
    page.getByRole("heading", { name: "Инвестируйте в будущее района" }),
  ).toBeVisible();
  await expect(page.getByText("45 объектов")).toBeVisible();

  const jsonLd = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  expect(jsonLd).toContain('"inLanguage":"ru"');
  expect(jsonLd).toContain("https://toshkent-tuman-invest.uz/ru");
  expect(jsonLd).not.toContain("SearchAction");
});

test("Russian map, login, and 404 keep localized copy and URLs", async ({
  page,
}) => {
  await page.goto("/ru/map?types=land");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByText("1 активный фильтр")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Фильтры" })).toBeVisible();

  await page.goto("/ru/login");
  await expect(
    page.getByRole("heading", { name: "Вход в кабинет инвестора" }),
  ).toBeVisible();

  await page.goto("/ru/missing-page");
  await expect(page.getByText("Страница не найдена.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Главная" })).toHaveAttribute(
    "href",
    "/ru",
  );
});

test("the locale cookie controls private-route server rendering", async ({
  request,
}) => {
  const response = await request.get("/dashboard", {
    headers: { cookie: "tashkent-invest.locale=ru" },
  });

  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain('<html lang="ru"');
});

test("admin can submit complete Russian translation fields", async ({
  page,
}) => {
  test.skip(!process.env.E2E_API_READY, "Requires the seeded local API.");
  await page.goto("/ru/login");
  await page.getByLabel(/email/i).fill("admin@demo.uz");
  await page.getByLabel(/пароль/i).fill("invest2026");
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL(/\/dashboard$/);
  await page.goto("/dashboard/projects/new");

  await page.getByLabel("Название на узбекском").fill("E2E o‘zbekcha obyekt");
  await page.getByLabel("Адрес на узбекском").fill("Chinobod");
  await page
    .getByLabel("Краткое описание", { exact: true })
    .fill("Qisqa tavsif");
  await page
    .getByLabel("Подробное описание", { exact: true })
    .fill("Batafsil tavsif");
  await page
    .getByLabel("Название на русском (необязательно)")
    .fill("E2E русский объект");
  await page.getByLabel("Адрес на русском").fill("Чинабад");
  await page
    .getByLabel("Краткое описание на русском", { exact: true })
    .fill("Краткое описание");
  await page
    .getByLabel("Подробное описание на русском", { exact: true })
    .fill("Подробное описание");
  await page.getByRole("button", { name: /Сохранить черновик/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/projects\/[^/]+\/edit$/);
});
