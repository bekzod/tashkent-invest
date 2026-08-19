import { expect, test } from '@playwright/test';

test('landing keeps its hero controls inside a responsive viewport', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 1050 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expect(page.locator('.site-header')).toBeVisible();
    await expect(page.locator('.reference-filter')).toBeVisible();
    await expect(page.locator('.reference-map .maplibregl-ctrl')).toHaveCount(0);
    await expect(page.locator('.reference-map .map-actions button')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('desktop filter remains inside the landing hero and on its right side', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/');

  const geometry = await page.locator('.reference-filter').evaluate((filter) => {
    const filterBox = filter.getBoundingClientRect();
    const heroBox = document.querySelector('.reference-hero')!.getBoundingClientRect();

    return {
      insideHero: filterBox.top >= heroBox.top && filterBox.bottom <= heroBox.bottom,
      rightSide: filterBox.left >= heroBox.left + heroBox.width / 2,
    };
  });

  expect(geometry).toEqual({ insideHero: true, rightSide: true });
});

test('hero search and statistic cards use one aligned discovery grid', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/');

  const measurements = await page.evaluate(() => {
    const search = document.querySelector<HTMLElement>('.reference-search')!.getBoundingClientRect();
    const stats = document.querySelector<HTMLElement>('.reference-stats')!.getBoundingClientRect();
    const cards = [...document.querySelectorAll<HTMLElement>('.reference-stat')].map((card) => {
      const { width, height } = card.getBoundingClientRect();
      return { width: Math.round(width), height: Math.round(height) };
    });

    return { searchWidth: Math.round(search.width), statsWidth: Math.round(stats.width), cards };
  });

  expect(measurements.searchWidth).toBe(measurements.statsWidth);
  expect(new Set(measurements.cards.map(({ width }) => width)).size).toBe(1);
  expect(new Set(measurements.cards.map(({ height }) => height)).size).toBe(1);
});

test('landing renders unique popular cards without React duplicate-key warnings', async ({ page }) => {
  const duplicateKeyWarnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('same key'))
      duplicateKeyWarnings.push(message.text());
  });

  await page.goto('/');
  await expect.poll(() => page.locator('.reference-card-grid .object-card').count()).toBeGreaterThan(0);

  const objectIds = await page
    .locator('.reference-card-grid .object-card')
    .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-object-id')));

  expect(new Set(objectIds).size).toBe(objectIds.length);
  expect(duplicateKeyWarnings).toEqual([]);
});
