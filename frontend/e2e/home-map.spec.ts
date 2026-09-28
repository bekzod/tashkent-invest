import { expect, test } from "@playwright/test";
import { installDeterministicMapTiles } from "./helpers/visual";

test.describe("homepage map discovery", () => {
  test.skip(!process.env.E2E_API_READY, "Requires the guarded seeded local API.");

  test("filters the embedded map and opens an accessible object preview", async ({
    page,
  }) => {
    await installDeterministicMapTiles(page);
    await page.goto("/uz");
    await expect(page.getByTestId("home-map-result").first()).toBeVisible();
    const openFilters = page.getByRole("button", { name: "Filtrlarni ochish" });
    if (await openFilters.isVisible()) await openFilters.click();

    const mapResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/objects/map?") &&
        response.url().includes("limit=20") &&
        response.url().includes("types=building") &&
        response.url().includes("statuses=auction") &&
        response.url().includes("q=Tayyor") &&
        response.url().includes("sectors=logistics") &&
        response.url().includes("areaMin=2") &&
        response.status() === 200,
    );
    await page
      .getByRole("textbox", { name: /Nomi, tuman yoki kadastr/ })
      .fill("Tayyor");
    await page.getByRole("checkbox", { name: "Tayyor bino" }).check();
    await page.getByRole("checkbox", { name: "Auksionda", exact: true }).check();
    await page.getByRole("combobox", { name: "Yo‘nalish" }).selectOption("logistics");
    await page.getByRole("slider", { name: /Maydon/ }).fill("2");
    await mapResponse;

    const mapLink = page.getByRole("link", { name: "Obyektlarni ko‘rsatish" });
    await expect(mapLink).toHaveAttribute(
      "href",
      "/uz/map?q=Tayyor&types=building&statuses=auction&sectors=logistics&areaMin=2",
    );
    const result = page.getByTestId("home-map-result").first();
    await expect(result).toBeVisible();
    const selectedTitle = (await result.locator("strong").textContent()) || "";
    await result.focus();
    await result.press("Enter");
    const preview = page.getByTestId("home-map-preview");
    await expect(preview).toContainText(selectedTitle);
    await expect(preview.getByRole("link", { name: "Batafsil", exact: true })).toHaveAttribute(
      "href",
      /\/uz\/objects\/tashkent-invest-/,
    );

    await page.getByRole("button", { name: "Ro‘yxatga qaytish" }).click();
    await page.getByRole("button", { name: "Tozalash" }).click();
    await expect(mapLink).toHaveAttribute("href", "/uz/map");
    await expect(page.getByRole("combobox", { name: "Yo‘nalish" })).toHaveValue("");
    await expect(page.getByRole("slider", { name: /Maydon/ })).toHaveValue("0");
    await expect(page.getByRole("checkbox", { name: "Tayyor bino" })).not.toBeChecked();
    await expect(
      page.getByRole("checkbox", { name: "Auksionda", exact: true }),
    ).not.toBeChecked();
  });

  test("mobile keeps a useful map above collapsed filter controls", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "Mobile layout contract.");
    await installDeterministicMapTiles(page);
    await page.goto("/ru");
    await expect(page.getByTestId("home-map-result").first()).toBeVisible();

    const map = await page.locator(".reference-map .map-shell").boundingBox();
    const filterToggle = page.getByRole("button", { name: "Открыть фильтры" });
    const toggle = await filterToggle.boundingBox();
    expect(map).not.toBeNull();
    expect(toggle).not.toBeNull();
    expect(map!.height).toBeGreaterThanOrEqual(300);
    expect(map!.y + map!.height).toBeLessThanOrEqual(toggle!.y);
    expect(toggle!.height).toBeGreaterThanOrEqual(44);
    await expect(filterToggle).toHaveAttribute("aria-expanded", "false");
    await filterToggle.tap();
    await expect(page.getByRole("button", { name: "Закрыть фильтры" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
});
