import { expect, test } from "@playwright/test";
import { installDeterministicMapTiles } from "./helpers/visual";

test.describe("bounded responsive investment map", () => {
  test.skip(
    !process.env.E2E_API_READY,
    "Requires the guarded seeded local API.",
  );

  test("map is visible first and results work with touch and keyboard", async ({
    page,
  }, testInfo) => {
    await installDeterministicMapTiles(page);
    await page.goto("/uz/map");
    await expect(page.locator(".map-canvas")).toBeVisible();
    await expect(page.getByTestId("map-result-card").first()).toBeVisible();

    expect(
      await page.getByTestId("map-result-card").count(),
    ).toBeLessThanOrEqual(12);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);

    if (testInfo.project.name === "mobile-chromium") {
      const box = await page.locator(".map-shell").boundingBox();
      expect(box).not.toBeNull();
      const visibleHeight =
        Math.min(844, box!.y + box!.height) - Math.max(0, box!.y);
      expect(visibleHeight).toBeGreaterThanOrEqual(box!.height / 2);

      const filterToggle = page.getByRole("button", {
        name: "Filtrlarni ochish",
      });
      await expect(filterToggle).toHaveAttribute("aria-expanded", "false");
      expect((await filterToggle.boundingBox())!.height).toBeGreaterThanOrEqual(
        44,
      );
      await filterToggle.tap();
      await expect(
        page.getByRole("button", { name: "Filtrlarni yopish" }),
      ).toHaveAttribute("aria-expanded", "true");
      const landFilter = page.getByRole("button", { name: "Yer uchastkasi" });
      expect((await landFilter.boundingBox())!.height).toBeGreaterThanOrEqual(
        44,
      );
    }

    const firstCard = page.getByTestId("map-result-card").first();
    const objectId = await firstCard.getAttribute("data-object-id");
    await firstCard.focus();
    await firstCard.press("Enter");
    await expect(page.getByTestId("selected-object-panel")).toBeVisible();
    await expect(page.locator(".map-canvas")).toHaveAttribute(
      "data-selected-object-id",
      objectId!,
    );
  });

  test("pointer drawing cancels safely and orientation changes resize the map", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-chromium",
      "Mobile interaction contract.",
    );
    await installDeterministicMapTiles(page);
    await page.goto("/uz/map");
    await expect(page.locator(".map-canvas")).toBeVisible();

    const original = await page.locator(".map-shell").boundingBox();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect
      .poll(async () => (await page.locator(".map-shell").boundingBox())?.width)
      .toBeGreaterThan(700);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(async () => (await page.locator(".map-shell").boundingBox())?.width)
      .toBeLessThan(500);
    expect(original?.width).toBeLessThan(500);

    await page.getByRole("button", { name: "Hudud chizish" }).tap();
    await expect(page.locator(".map-canvas")).toHaveAttribute(
      "data-drawing",
      "true",
    );
    const canvas = page.locator(".map-canvas canvas").first();
    // React commits data-drawing before the effect installs pointer capture.
    // The crosshair is owned by that effect, so it is the readiness signal.
    await expect(canvas).toHaveCSS("cursor", "crosshair");
    await expect(canvas).toHaveCSS("touch-action", "none");
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
    const settleInput = () =>
      page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          ),
      );
    await touch("touchStart", box!.x + 80, box!.y + 90);
    await touch("touchMove", box!.x + 170, box!.y + 90);
    await settleInput();
    await touch("touchMove", box!.x + 170, box!.y + 180);
    await settleInput();
    await touch("touchMove", box!.x + 80, box!.y + 180);
    await expect(
      page.getByRole("button", { name: "Chizishni yakunlash" }),
    ).toBeEnabled();
    await touch("touchMove", box!.x + 20, box!.y + 180);
    await settleInput();
    await touch("touchEnd", box!.x + 20, box!.y + 180);
    await expect(
      page.getByRole("button", { name: "Chizishni yakunlash" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Bekor qilish" }).tap();
    await expect(page.locator(".map-canvas")).not.toHaveAttribute(
      "data-drawing",
      "true",
    );

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
});
