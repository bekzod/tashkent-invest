import { expect, test, type Page } from "@playwright/test";
import { prepareVisualTest } from "./helpers/visual";

const title = "Sanoat uchun yer uchastkasi 127";
const rectanglePoints = [
  [0.42, 0.42],
  [0.58, 0.42],
  [0.58, 0.58],
  [0.42, 0.58],
] as const;

type CanvasBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

async function getCanvasBox(page: Page, editor: ReturnType<Page["locator"]>) {
  const canvas = editor.locator(".lot-boundary-map canvas").first();
  await expect(canvas).toBeVisible();
  await expect(editor.locator(".lot-boundary-map-overlay")).toBeHidden();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  return { canvas, box: box as CanvasBox };
}

async function clickBoundaryPoints(
  page: Page,
  box: CanvasBox,
  points: readonly (readonly [number, number])[],
) {
  for (const [x, y] of points) {
    await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
  }
}

async function loginAndOpen(page: Page) {
  await page.goto("/uz/login");
  await expect(page.getByTestId("login-form")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
  await page.getByLabel(/email/i).fill("admin@demo.uz");
  await page.getByLabel(/parol|password/i).fill("invest2026");
  await page.getByRole("button", { name: /kirish|войти/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/dashboard/projects");
  await page
    .getByPlaceholder(/Nomi, tuman yoki kadastr/i)
    .fill(title);
  await page.getByRole("button", { name: /Obyektlarni ko‘rsatish/ }).click();
  const row = page.getByRole("row").filter({
    has: page.getByText(title, { exact: true }),
  });
  await row.getByRole("link", { name: /tahrirlash/i }).click();
  await page.getByRole("button", { name: /Joylashuv/ }).click();
  const editor = page.locator(".lot-boundary-editor");
  await expect(editor).toBeVisible();
  await page.addStyleTag({
    content:
      "nextjs-portal, [data-sonner-toaster] { display: none !important; } .admin-editor-actions { position: static !important; }",
  });
}

async function replaceBoundaryWithRectangle(page: Page) {
  const editor = page.locator(".lot-boundary-editor");
  const clear = editor.getByRole("button", { name: /Chegarani tozalash/ });
  if (await clear.isVisible()) {
    await clear.click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Chegarani tozalash/ })
      .click();
  }

  await editor
    .getByRole("button", { name: /Chegarani (chizish|tahrirlash)/ })
    .click();
  const { box } = await getCanvasBox(page, editor);
  await clickBoundaryPoints(page, box, rectanglePoints);
  await expect(editor.getByText(/Nuqtalar soni:/)).toContainText("4");
  await editor
    .getByRole("button", { name: /Chegarani yakunlash/ })
    .click();
  await expect(editor.locator(".lot-boundary-source")).toContainText(
    /Administrator chizgan/,
  );
}

async function publishObject(page: Page) {
  await page.getByRole("button", { name: /Ko‘rib chiqish/ }).click();
  const saveResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      /\/api\/admin\/objects\//.test(response.url()),
  );
  await page.getByRole("button", { name: /^Nashr qilish$/ }).click();
  expect((await saveResponse).status()).toBe(200);
}

test.describe("lot boundary visuals", () => {
  test.describe.configure({ timeout: 90_000 });
  test.skip(
    !process.env.E2E_API_READY,
    "Requires the guarded seeded local API.",
  );

  test("editor and public selected boundary remain readable", async ({
    page,
  }) => {
    await prepareVisualTest(page);
    await loginAndOpen(page);
    const editor = page.locator(".lot-boundary-editor");
    await replaceBoundaryWithRectangle(page);
    await expect(editor).toHaveScreenshot("lot-boundary-editor.png", {
      animations: "disabled",
    });
    await publishObject(page);

    await page.goto("/uz/map");
    await page.addStyleTag({
      content: "nextjs-portal { display: none !important; }",
    });
    const openFilters = page.getByRole("button", { name: "Filtrlarni ochish" });
    if (await openFilters.isVisible()) await openFilters.click();
    await page.getByLabel("Qidiruv").fill(title);
    const card = page.getByTestId("map-result-card").filter({
      has: page.getByRole("heading", {
        name: title,
        exact: true,
      }),
    });
    await expect(card).toBeVisible();
    await card.click({ position: { x: 80, y: 120 } });
    await expect(page.getByTestId("selected-object-panel")).toBeVisible();
    await expect(page.locator(".map-page")).toHaveScreenshot(
      "lot-boundary-public-selected.png",
      {
        animations: "disabled",
        mask: [page.locator("img")],
        maskColor: "#e8edf3",
      },
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });

  test("idle, first-point, and ready-polygon states remain clear", async ({
    page,
  }) => {
    await prepareVisualTest(page);
    await page.goto("/uz/login");
    await expect(page.getByTestId("login-form")).toHaveAttribute(
      "data-hydrated",
      "true",
    );
    await page.getByLabel(/email/i).fill("admin@demo.uz");
    await page.getByLabel(/parol|password/i).fill("invest2026");
    await page.getByRole("button", { name: /kirish|войти/i }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/dashboard/projects/new");
    await page.getByRole("button", { name: /Joylashuv/ }).click();
    await page.getByLabel("Kenglik").fill("41.391335");
    await page.getByLabel("Uzunlik").fill("69.220651");
    await expect(page.getByText(/Joylashuv tanlandi/)).toBeVisible();
    await page.addStyleTag({
      content:
        "nextjs-portal { display: none !important; } .admin-editor-actions { position: static !important; }",
    });

    const editor = page.locator(".lot-boundary-editor");
    const { box } = await getCanvasBox(page, editor);
    await expect(editor).toHaveScreenshot("lot-boundary-idle.png", {
      animations: "disabled",
    });

    await editor.getByRole("button", { name: /Chegarani chizish/ }).click();
    await clickBoundaryPoints(page, box, rectanglePoints.slice(0, 1));
    await expect(editor.getByText(/Nuqtalar soni:/)).toContainText("1");
    await expect(editor).toHaveScreenshot("lot-boundary-one-point.png", {
      animations: "disabled",
    });

    await clickBoundaryPoints(page, box, rectanglePoints.slice(1));
    await expect(editor.getByText(/Nuqtalar soni:/)).toContainText("4");
    await expect(
      editor.getByRole("button", { name: /Chegarani yakunlash/ }),
    ).toBeEnabled();
    await expect(editor).toHaveScreenshot("lot-boundary-ready-polygon.png", {
      animations: "disabled",
    });

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});
