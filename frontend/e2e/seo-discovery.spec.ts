import { expect, test } from '@playwright/test';

const origin = 'https://toshkent-tuman-invest.uz';

test('legacy home permanently redirects to the Uzbek canonical route', async ({ request }) => {
  const response = await request.get('/', { maxRedirects: 0 });

  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe('/uz');
});

for (const locale of ['uz', 'ru'] as const) {
  test(`${locale} home exposes localized canonical discovery metadata`, async ({ page }) => {
    await page.goto(`/${locale}`);

    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${origin}/${locale}`,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="uz"]')).toHaveAttribute(
      'href',
      `${origin}/uz`,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="ru"]')).toHaveAttribute(
      'href',
      `${origin}/ru`,
    );
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
      'href',
      `${origin}/uz`,
    );
  });

  test(`${locale} map has a real H1 and a valid large social card`, async ({ page, request }) => {
    await page.goto(`/${locale}/map`);
    await expect(page.locator('h1')).toContainText(locale === 'ru' ? 'Карта' : 'xaritasi');

    const response = await request.get(`/${locale}/map/opengraph-image`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
    const image = await response.body();
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
  });
}

test('search, AI, sitemap, and manifest endpoints expose only public canonical routes', async ({
  request,
}) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.headers()['content-type']).toContain('application/xml');
  expect(await sitemap.text()).toContain(`${origin}/sitemap-uz.xml`);
  expect(await sitemap.text()).toContain(`${origin}/sitemap-ru.xml`);

  for (const locale of ['uz', 'ru'] as const) {
    const localized = await request.get(`/sitemap-${locale}.xml`);
    const xml = await localized.text();
    expect(localized.ok()).toBe(true);
    expect(xml).toContain(`${origin}/${locale}`);
    expect(xml).toContain(`${origin}/${locale}/map`);
    expect(xml).not.toContain('/dashboard');
    expect(xml).not.toContain('/login');
  }

  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('User-Agent: OAI-SearchBot');
  expect(robots).toContain('User-Agent: GPTBot');
  expect(robots).toContain(`Sitemap: ${origin}/sitemap.xml`);

  const llms = await request.get('/llms.txt');
  expect(llms.headers()['content-type']).toContain('text/plain');
  expect(await llms.text()).toContain(`${origin}/ru/map`);

  const manifest = await request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBe(true);
  expect(manifest.headers()['content-type']).toContain('application/manifest+json');
  expect(await manifest.json()).toMatchObject({ start_url: '/uz', short_name: 'Invest Tuman' });
});

test('private dashboard remains out of the search index', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});
