import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, type Page } from "@playwright/test";

const mapTilePath = resolve(__dirname, "../fixtures/map-tile.svg");

const disabledMotionCss = `
  *, *::before, *::after {
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    animation-iteration-count: 1 !important;
    caret-color: transparent !important;
    scroll-behavior: auto !important;
    transition-delay: 0s !important;
    transition-duration: 0s !important;
  }
`;

export async function installDeterministicMapTiles(page: Page) {
  const tile = await readFile(mapTilePath);
  await page.route(
    (url) =>
      /(?:openstreetmap|maptiler|mapbox|\.tile\.|\/tiles?\/)/i.test(url.href) &&
      !url.pathname.endsWith(".json"),
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        headers: { "access-control-allow-origin": "*", "cache-control": "no-store" },
        body: tile,
      });
    },
  );
}

export async function disableDynamicVisuals(page: Page) {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addInitScript((css) => {
    const apply = () => {
      if (!document.head || document.querySelector("style[data-e2e-static-visuals]")) return;
      const style = document.createElement("style");
      style.dataset.e2eStaticVisuals = "true";
      style.textContent = css;
      document.head.append(style);
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", apply, { once: true });
    } else {
      apply();
    }
  }, disabledMotionCss);
  await page.addStyleTag({ content: disabledMotionCss });
}

export async function prepareVisualTest(page: Page) {
  await installDeterministicMapTiles(page);
  await disableDynamicVisuals(page);
}

export async function expectVisualSnapshot(page: Page, name: string) {
  await disableDynamicVisuals(page);
  await expect(page).toHaveScreenshot(name, {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
  });
}
