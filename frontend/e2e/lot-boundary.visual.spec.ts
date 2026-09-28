import { expect, test, type Page } from "@playwright/test";
import { prepareVisualTest } from "./helpers/visual";

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
    .fill("10:01:01:0011");
  const row = page.getByRole("row").filter({
    has: page.getByText("Sanoat uchun yer uchastkasi 1", { exact: true }),
  });
  await row.getByRole("link", { name: /tahrirlash/i }).click();
  await page.getByRole("button", { name: /Joylashuv/ }).click();
  const editor = page.locator(".lot-boundary-editor");
  await expect(editor).toBeVisible();

  // The functional boundary test legitimately persists an admin-drawn source.
  // Normalize the standalone visual test to that same business state so its
  // layout cannot depend on whether another spec ran first.
  const source = editor.locator(".lot-boundary-source");
  if (
    await source.getAttribute("class").then((value) => value?.includes("demo"))
  ) {
    await page.getByRole("button", { name: /Chegarani tahrirlash/ }).click();
    await page.getByRole("button", { name: /Shaklni yopish/ }).click();
  }
  await expect(source).toContainText(/Administrator chizgan/);
  await page.addStyleTag({
    content:
      "nextjs-portal { display: none !important; } .admin-editor-actions { position: static !important; }",
  });
}

test.describe("lot boundary visuals", () => {
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
    await expect(editor).toHaveScreenshot("lot-boundary-editor.png", {
      animations: "disabled",
    });

    await page.goto("/uz/map");
    await page.addStyleTag({
      content: "nextjs-portal { display: none !important; }",
    });
    const openFilters = page.getByRole("button", { name: "Filtrlarni ochish" });
    if (await openFilters.isVisible()) await openFilters.click();
    await page.getByLabel("Qidiruv").fill("10:01:01:0011");
    const card = page.getByTestId("map-result-card").filter({
      has: page.getByRole("heading", {
        name: "Sanoat uchun yer uchastkasi 1",
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
});
