import { expect, test } from '@playwright/test';

for (const locale of ['uz', 'ru'] as const) {
  test(`${locale} social card visual`, async ({ page }) => {
    await page.goto(`/${locale}/opengraph-image`);
    const image = page.locator('img');
    await expect(image).toBeVisible();
    await expect(image).toHaveScreenshot(`seo-social-card-${locale}.png`, {
      animations: 'disabled',
    });
  });
}
