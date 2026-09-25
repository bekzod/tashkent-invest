import { expect, test, type Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/uz/login");
  await page.getByLabel(/email/i).fill("admin@demo.uz");
  await page.getByLabel(/parol|password/i).fill("invest2026");
  await page.getByRole("button", { name: /kirish|войти/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function openSeededLocationEditor(page: Page) {
  const title = "Sanoat uchun yer uchastkasi 127";
  await page.goto("/dashboard/projects");
  await page
    .getByPlaceholder(/Nomi, tuman yoki kadastr/i)
    .fill(title);
  const row = page.getByRole("row").filter({
    hasText: title,
  });
  await expect(row).toBeVisible();
  await row.getByRole("link", { name: /tahrirlash/i }).click();
  await page.getByRole("button", { name: /Joylashuv/ }).click();
}

async function saveDraft(page: Page) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      /\/api\/admin\/objects\//.test(response.url()),
  );
  await page.getByRole("button", { name: /Qoralama saqlash/ }).click();
  expect((await responsePromise).ok()).toBe(true);
}

test.describe("admin object location", () => {
  test.skip(!process.env.E2E_API_READY, "Requires the guarded seeded local API.");

  test("admin selects, saves, reloads, geolocates and clears a point", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition: (success: PositionCallback) =>
            success({
              coords: {
                accuracy: 5,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                latitude: 41.391335,
                longitude: 69.220651,
                speed: null,
                toJSON: () => ({}),
              },
              timestamp: Date.now(),
              toJSON: () => ({}),
            }),
        },
      });
    });
    await loginAsAdmin(page);
    await openSeededLocationEditor(page);

    const latitudeInput = page.getByLabel("Kenglik");
    const longitudeInput = page.getByLabel("Uzunlik");
    await latitudeInput.selectText();
    await latitudeInput.pressSequentially("41.391335");
    await longitudeInput.selectText();
    await longitudeInput.pressSequentially("69.220651");
    await saveDraft(page);
    await page.reload();
    await page.getByRole("button", { name: /Joylashuv/ }).click();
    expect(Number(await page.getByLabel("Kenglik").inputValue())).toBeCloseTo(41.391335, 6);
    expect(Number(await page.getByLabel("Uzunlik").inputValue())).toBeCloseTo(69.220651, 6);

    await page.getByRole("button", { name: /Joriy joyim/ }).click();
    await expect(page.getByLabel("Kenglik")).toHaveValue("41.391335");
    await expect(page.getByLabel("Uzunlik")).toHaveValue("69.220651");

    await page.getByLabel("Kenglik").fill("41.31");
    await page.getByLabel("Uzunlik").fill("69.28");
    await expect(
      page.getByText(/Tanlangan nuqta Toshkent tumani chegarasidan tashqarida/),
    ).toBeVisible();

    await page.getByRole("button", { name: /Joylashuvni tozalash/ }).click();
    await expect(page.getByLabel("Kenglik")).toHaveValue("");
    await expect(page.getByLabel("Uzunlik")).toHaveValue("");
    await saveDraft(page);
    await page.reload();
    await page.getByRole("button", { name: /Joylashuv/ }).click();
    await expect(page.getByLabel("Kenglik")).toHaveValue("");
    await expect(page.locator(".maplibregl-marker")).toHaveCount(0);

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
});
