import { describe, expect, test } from 'vitest';
import type { InvestmentObject } from '@/entities/investment-object/types';
import { buildLocaleSitemap, buildSitemapIndex, escapeXml } from './sitemap';

const object = {
  id: '1',
  slug: 'yer-&-bino',
  title: 'Yer <va> bino',
  shortDescription: 'Tasdiqlangan obyekt',
  address: 'Toshkent',
  district: 'Toshkent',
  type: 'land',
  status: 'available',
  investmentAmountUsd: 0,
  updatedAt: '2026-09-24T10:20:30.000Z',
} satisfies InvestmentObject;

describe('localized XML sitemaps', () => {
  test('builds an index with exactly the two locale sitemap URLs', () => {
    const xml = buildSitemapIndex();

    expect(xml.match(/<loc>/g)).toHaveLength(2);
    expect(xml).toContain('<loc>https://toshkent-tuman-invest.uz/sitemap-uz.xml</loc>');
    expect(xml).toContain('<loc>https://toshkent-tuman-invest.uz/sitemap-ru.xml</loc>');
  });

  test('includes static and all verified object URLs with reciprocal alternates', () => {
    const xml = buildLocaleSitemap('ru', [object]);

    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain('<loc>https://toshkent-tuman-invest.uz/ru</loc>');
    expect(xml).toContain('<loc>https://toshkent-tuman-invest.uz/ru/map</loc>');
    expect(xml).toContain('https://toshkent-tuman-invest.uz/ru/objects/yer-&amp;-bino');
    expect(xml).toContain('hreflang="uz"');
    expect(xml).toContain('hreflang="ru"');
    expect(xml).toContain('hreflang="x-default"');
    expect(xml).toContain('<lastmod>2026-09-24T10:20:30.000Z</lastmod>');
    expect(xml).not.toContain('/login');
    expect(xml).not.toContain('/dashboard');
    expect(xml).not.toContain('/api');
  });

  test('escapes all XML-sensitive characters', () => {
    expect(escapeXml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&apos;');
  });

  test('omits unverified records without a truthful update timestamp', () => {
    const xml = buildLocaleSitemap('uz', [{ ...object, slug: 'stale', updatedAt: undefined }]);

    expect(xml).not.toContain('/objects/stale');
  });
});
