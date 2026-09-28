import { expect, test, type Page } from "@playwright/test";
import { prepareVisualTest } from "./helpers/visual";

const title = "Sanoat uchun yer uchastkasi 1";
const cadastralNumber = "10:01:01:0011";
const vertices = [
  ["69.20276", "41.400898"],
  ["69.20316", "41.400898"],
  ["69.20316", "41.401298"],
  ["69.20276", "41.401298"],
] as const;

async function loginAsAdmin(page: Page) {
  await page.goto("/uz/login");
  await expect(page.getByTestId("login-form")).toHaveAttribute("data-hydrated", "true");
  await page.getByLabel(/email/i).fill("admin@demo.uz");
  await page.getByLabel(/parol|password/i).fill("invest2026");
  await page.getByRole("button", { name: /kirish|войти/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function openBoundaryEditor(page: Page) {
  await page.goto("/dashboard/projects");
  await page.getByPlaceholder(/Nomi, tuman yoki kadastr/i).fill(cadastralNumber);
  const row = page.getByRole("row").filter({ has: page.getByText(title, { exact: true }) });
  await expect(row).toBeVisible();
  await row.getByRole("link", { name: /tahrirlash/i }).click();
  await page.getByRole("button", { name: /Joylashuv/ }).click();
  await expect(page.locator(".lot-boundary-map")).toBeVisible();
}

async function addVertex(page: Page, longitude: string, latitude: string) {
  await page.getByLabel("Yangi nuqta uzunligi").fill(longitude);
  await page.getByLabel("Yangi nuqta kengligi").fill(latitude);
  await page.getByRole("button", { name: /Nuqta qo‘shish/ }).click();
}

async function beginCleanDrawing(page: Page) {
  const clear = page.getByRole("button", { name: /Chegarani tozalash/ });
  if (await clear.isVisible()) await clear.click();
  await page.getByRole("button", { name: /Chegarani (chizish|tahrirlash)/ }).click();
}

test.describe("verified lot boundary workflow", () => {
  test.skip(!process.env.E2E_API_READY, "Requires the guarded seeded local API.");

  test("admin rejects an invalid boundary, publishes a valid one, and the public map renders it", async ({ page }) => {
    await prepareVisualTest(page);
    await loginAsAdmin(page);
    await openBoundaryEditor(page);
    await beginCleanDrawing(page);

    for (const [longitude, latitude] of [
      ["69.20276", "41.400898"],
      ["69.20316", "41.401298"],
      ["69.20276", "41.401298"],
      ["69.20316", "41.400898"],
    ] as const) await addVertex(page, longitude, latitude);
    await page.getByRole("button", { name: /Shaklni yopish/ }).click();
    await expect(page.locator(".lot-boundary-editor [role=alert]")).toContainText(/kesishmasligi/);
    await expect(page.getByRole("button", { name: /Qoralama saqlash/ })).toBeDisabled();

    await page.getByRole("button", { name: /^Bekor qilish$/ }).click();
    await beginCleanDrawing(page);
    for (const [longitude, latitude] of vertices) await addVertex(page, longitude, latitude);
    await page.getByRole("button", { name: /Shaklni yopish/ }).click();
    await expect(page.getByText(/Administrator chizgan/)).toBeVisible();
    await expect(page.getByText(/Chegara saqlash uchun tayyor/)).toBeVisible();

    await page.getByRole("button", { name: /Ko‘rib chiqish/ }).click();
    const saveResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        /\/api\/admin\/objects\//.test(response.url()),
    );
    await page.getByRole("button", { name: /^Nashr qilish$/ }).click();
    expect((await saveResponse).status()).toBe(200);

    await page.reload();
    await page.getByRole("button", { name: /Joylashuv/ }).click();
    await expect(page.getByText(/Administrator chizgan/)).toBeVisible();
    await expect(page.getByText(/Nuqtalar soni:/)).toContainText("4");

    await page.goto("/uz/map");
    await page.getByLabel("Qidiruv").fill(cadastralNumber);
    const card = page.getByTestId("map-result-card").filter({
      has: page.getByRole("heading", { name: title, exact: true }),
    });
    await expect(card).toBeVisible();
    await expect.poll(async () => Number(await page.locator(".map-canvas").getAttribute("data-boundary-count"))).toBeGreaterThan(0);
    await card.click({ position: { x: 80, y: 120 } });
    await expect(page.locator(".map-canvas")).toHaveAttribute(
      "data-selected-boundary-source",
      "admin_drawn",
    );
  });
});
