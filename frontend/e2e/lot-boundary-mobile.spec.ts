import { expect, test, type Page } from "@playwright/test";
import { prepareVisualTest } from "./helpers/visual";

const title = "Sanoat uchun yer uchastkasi 127";

async function loginAsAdmin(page: Page) {
  await page.goto("/uz/login");
  await expect(page.getByTestId("login-form")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
  await page.getByLabel(/email/i).fill("admin@demo.uz");
  await page.getByLabel(/parol|password/i).fill("invest2026");
  await page.getByRole("button", { name: /kirish|войти/i }).tap();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function openBoundaryEditor(page: Page) {
  await page.goto("/dashboard/projects");
  await page.getByPlaceholder(/Nomi, tuman yoki kadastr/i).fill(title);
  await page.getByRole("button", { name: /Obyektlarni ko‘rsatish/ }).tap();
  const row = page
    .getByRole("row")
    .filter({ has: page.getByText(title, { exact: true }) });
  await expect(row).toBeVisible();
  await row.getByRole("link", { name: /tahrirlash/i }).tap();
  await page.getByRole("button", { name: /Joylashuv/ }).tap();
  await expect(page.locator(".lot-boundary-map canvas")).toBeVisible();
}

test.describe("mobile lot boundary drawing", () => {
  test.describe.configure({ timeout: 90_000 });
  test.skip(
    !process.env.E2E_API_READY,
    "Requires the guarded seeded local API.",
  );

  test("draws, moves a vertex, and remains usable on a touch screen", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Mobile contract.");
    await prepareVisualTest(page);
    await loginAsAdmin(page);
    await openBoundaryEditor(page);

    const clear = page.getByRole("button", { name: /Chegarani tozalash/ });
    if (await clear.isVisible()) {
      await clear.tap();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /Chegarani tozalash/ })
        .tap();
    }
    await page.getByRole("button", { name: /Chegarani (chizish|tahrirlash)/ }).tap();
    await expect(page.locator(".lot-boundary-map-overlay")).toBeHidden();

    const canvas = page.locator(".lot-boundary-map canvas").first();
    await expect(page.locator(".lot-boundary-map")).toHaveCSS("cursor", "crosshair");
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const session = await page.context().newCDPSession(page);
    const touch = (
      type: "touchStart" | "touchMove" | "touchEnd",
      x: number,
      y: number,
    ) =>
      session.send("Input.dispatchTouchEvent", {
        type,
        touchPoints:
          type === "touchEnd"
            ? []
            : [{ x, y, id: 1, force: 1, radiusX: 2, radiusY: 2 }],
      });
    const tapPoint = async (x: number, y: number) => {
      await touch("touchStart", x, y);
      await touch("touchEnd", x, y);
    };
    const points = [
      [0.36, 0.36],
      [0.64, 0.36],
      [0.64, 0.64],
      [0.36, 0.64],
    ] as const;
    for (const [x, y] of points) {
      await tapPoint(box!.x + box!.width * x, box!.y + box!.height * y);
    }
    await expect(page.getByText(/Nuqtalar soni:/)).toContainText("4");
    const lastPoint = points.at(-1)!;
    const lastX = box!.x + box!.width * lastPoint[0];
    const lastY = box!.y + box!.height * lastPoint[1];
    await touch("touchStart", lastX, lastY);
    await touch("touchMove", lastX + 20, lastY - 20);
    await touch("touchEnd", lastX + 20, lastY - 20);
    await expect(page.getByText(/Nuqtalar soni:/)).toContainText("4");
    await expect(page.getByRole("button", { name: /Chegarani yakunlash/ })).toBeEnabled();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    expect((await page.getByRole("button", { name: /Chegarani yakunlash/ }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.getByRole("button", { name: /Chegarani yakunlash/ }).tap();
    await expect(page.getByText(/Administrator chizgan/)).toBeVisible();
  });
});
