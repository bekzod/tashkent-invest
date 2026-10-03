import { expect, test } from '@playwright/test';

test('landing keeps its hero controls inside a responsive viewport', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 1050 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/uz');

    await expect(page.locator('.site-header')).toBeVisible();
    await expect(page.locator('.reference-filter')).toBeVisible();
    await expect(page.locator('.reference-map .maplibregl-ctrl-zoom-in')).toHaveCount(0);
    await expect(page.locator('.reference-map .maplibregl-ctrl-zoom-out')).toHaveCount(0);
    await expect(page.locator('.reference-map .maplibregl-ctrl-geolocate')).toHaveCount(0);
    await expect(page.locator('.reference-map .maplibregl-ctrl-compass')).toHaveCount(0);
    await expect(page.locator('.reference-map .map-actions button')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('desktop filter remains inside the landing hero and on its right side', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/uz');

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
  await page.goto('/uz');

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

  await page.goto('/uz');
  await expect.poll(() => page.locator('.reference-card-grid .object-card').count()).toBeGreaterThan(0);

  const objectIds = await page
    .locator('.reference-card-grid .object-card')
    .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-object-id')));

  expect(new Set(objectIds).size).toBe(objectIds.length);
  expect(duplicateKeyWarnings).toEqual([]);
});

test('compact header and category labels stay visually contained', async ({ page }) => {
  await page.setViewportSize({ width: 1156, height: 961 });
  await page.goto('/uz');

  const category = page.locator('.category-card').filter({ hasText: 'IT va texnologiyalar' }).first();
  await expect(category).toBeVisible();

  const measurements = await page.evaluate(() => {
    const locale = document.querySelector<HTMLElement>('.site-header .locale-trigger')!;
    const actions = document.querySelector<HTMLElement>('.site-header .header-actions')!;
    const menu = document.querySelector<HTMLElement>('.site-header .mobile-menu')!;
    const card = [...document.querySelectorAll<HTMLElement>('.category-card')].find(
      (element) => element.textContent?.includes('IT va texnologiyalar'),
    )!;
    const title = card.querySelector<HTMLElement>('strong')!;
    const localeStyle = getComputedStyle(locale);
    const actionsBox = actions.getBoundingClientRect();
    const menuBox = menu.getBoundingClientRect();
    const titleBox = title.getBoundingClientRect();
    const cardBox = card.getBoundingClientRect();

    return {
      localeHasBorder: localeStyle.borderTopWidth !== '0px',
      verticalCenterDelta: Math.abs(
        actionsBox.top + actionsBox.height / 2 - (menuBox.top + menuBox.height / 2),
      ),
      titleInsideCard: titleBox.right <= cardBox.right + 0.5 && titleBox.bottom <= cardBox.bottom + 0.5,
    };
  });

  expect(measurements.localeHasBorder).toBe(false);
  expect(measurements.verticalCenterDelta).toBeLessThanOrEqual(1);
  expect(measurements.titleInsideCard).toBe(true);
});

test('desktop public header keeps navigation centered without the mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 1305, height: 961 });
  await page.goto('/uz');

  const measurements = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('.site-header')!.getBoundingClientRect();
    const nav = document.querySelector<HTMLElement>('.site-header .public-navigation')!.getBoundingClientRect();
    const brand = document.querySelector<HTMLElement>('.site-header .brand')!.getBoundingClientRect();
    const actions = document.querySelector<HTMLElement>('.site-header .header-actions')!.getBoundingClientRect();
    const menu = document.querySelector<HTMLElement>('.site-header .mobile-menu')!;
    const navCenter = nav.left + nav.width / 2;
    const headerCenter = header.left + header.width / 2;

    return {
      mobileMenuHidden: getComputedStyle(menu).display === 'none',
      navCentered: Math.abs(navCenter - headerCenter),
      brandCentered: Math.abs(brand.top + brand.height / 2 - (header.top + header.height / 2)),
      actionsCentered: Math.abs(actions.top + actions.height / 2 - (header.top + header.height / 2)),
    };
  });

  expect(measurements.mobileMenuHidden).toBe(true);
  expect(measurements.navCentered).toBeLessThanOrEqual(1);
  expect(measurements.brandCentered).toBeLessThanOrEqual(1);
  expect(measurements.actionsCentered).toBeLessThanOrEqual(1);
});
