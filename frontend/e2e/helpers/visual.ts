import { expect, type Page } from "@playwright/test";

// MapLibre raster sources decode through ImageBitmap in Chromium, which does
// not reliably accept SVG responses. This tiny valid PNG keeps map screenshots
// deterministic while still allowing WebGL boundary layers to be asserted.
const mapTile = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

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
  await page.route(
    (url) =>
      /(?:openstreetmap|maptiler|mapbox|\.tile\.|\/tiles?\/)/i.test(url.href) &&
      !url.pathname.endsWith(".json"),
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        headers: { "access-control-allow-origin": "*", "cache-control": "no-store" },
        body: mapTile,
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
