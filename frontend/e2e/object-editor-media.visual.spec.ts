import { expect, test, type Page } from "@playwright/test";
import { disableDynamicVisuals } from "./helpers/visual";

async function loginAndOpenMedia(page: Page) {
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
  await page.getByRole("button", { name: /Media$/ }).click();
  await page.addStyleTag({
    content:
      "nextjs-portal { display: none !important; } .admin-editor-actions { position: static !important; }",
  });
}

test.describe("object editor media input group", () => {
  test.describe.configure({ timeout: 60_000 });
  test.skip(
    !process.env.E2E_API_READY,
    "Requires the guarded seeded local API.",
  );

  test("groups type, URL, and remove action on desktop and mobile", async ({
    page,
  }) => {
    await disableDynamicVisuals(page);
    await loginAndOpenMedia(page);
    await page.getByRole("button", { name: /Media qo‘shish/ }).click();

    const group = page.locator('[data-slot="input-group"]').first();
    const type = group.getByRole("combobox", { name: /Media turi 1/ });
    const url = group.getByRole("textbox", { name: /Media havolasi 1/ });
    const remove = group.getByRole("button", { name: /Olib tashlash/ });

    await expect(group).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator(".admin-media-error")).toContainText(/HTTPS/);
    await url.fill("https://cdn.example.com/object.webp");
    await expect(group).not.toHaveAttribute("aria-invalid", "true");

    await type.click();
    await page.getByRole("option", { name: "Video" }).click();
    await expect(type).toContainText("Video");

    await type.focus();
    await type.press("Tab");
    await expect(url).toBeFocused();
    await url.press("Tab");
    await expect(remove).toBeFocused();

    expect((await remove.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(group).toHaveScreenshot(
      "object-editor-media-group.png",
      { animations: "disabled" },
    );

    await remove.click();
    await expect(group).toHaveCount(0);
  });
});
