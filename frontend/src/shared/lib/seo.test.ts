import { describe, expect, test } from 'vitest';
import type { InvestmentObject } from '@/entities/investment-object/types';
import {
  compactText,
  loginMetadata,
  objectMetadata,
  publicPageMetadata,
  site,
} from './seo';

const object: InvestmentObject = {
  id: 'object-1',
  slug: 'yangi-sanoat-zonasi',
  title: 'Yangi sanoat zonasi',
  shortDescription: 'Ishlab chiqarish loyihalari uchun tayyor yer maydoni.',
  description: 'Muhandislik tarmoqlariga yaqin istiqbolli investitsiya maydoni.',
  address: 'Toshkent tumani',
  district: 'Toshkent',
  type: 'land',
  status: 'available',
  landAreaHa: 12.5,
  investmentAmountUsd: 2_500_000,
};

function firstImage(metadata: ReturnType<typeof publicPageMetadata>) {
  const images = metadata.openGraph?.images;
  return Array.isArray(images) ? images[0] : images;
}

describe('localized SEO metadata', () => {
  test('uses the public production origin by default', () => {
    expect(site.url).toBe('https://toshkent-tuman-invest.uz');
  });

  test('builds canonical and reciprocal language alternates', () => {
    const page = publicPageMetadata({
      locale: 'ru',
      title: 'Инвестиционная карта',
      description: 'Инвестиционные объекты Ташкентского района на интерактивной карте.',
      path: '/map',
      imageAlt: 'Инвестиционная карта Ташкентского района',
    });

    expect(page.alternates?.canonical).toBe('https://toshkent-tuman-invest.uz/ru/map');
    expect(page.alternates?.languages).toEqual({
      uz: 'https://toshkent-tuman-invest.uz/uz/map',
      ru: 'https://toshkent-tuman-invest.uz/ru/map',
      'x-default': 'https://toshkent-tuman-invest.uz/uz/map',
    });
    expect(page.openGraph?.locale).toBe('ru_RU');
    expect(page.openGraph?.alternateLocale).toEqual(['uz_UZ']);
    expect(firstImage(page)).toMatchObject({
      url: 'https://toshkent-tuman-invest.uz/ru/map/opengraph-image',
      width: 1200,
      height: 630,
      alt: 'Инвестиционная карта Ташкентского района',
    });
    expect(page.twitter?.card).toBe('summary_large_image');
  });

  test.each([
    ['uz' as const, 'Toshkent tumani', 'maydoni 12.5 ga', 'investitsiya hajmi $2,500,000'],
    ['ru' as const, 'район Toshkent', 'площадь 12.5 га', 'объём инвестиций $2,500,000'],
  ])('localizes object metadata for %s', (locale, district, area, amount) => {
    const metadata = objectMetadata(object, locale);

    expect(metadata.alternates?.canonical).toBe(
      `https://toshkent-tuman-invest.uz/${locale}/objects/yangi-sanoat-zonasi`,
    );
    expect(metadata.description).toContain(district);
    expect(metadata.description).toContain(area);
    expect(metadata.description).toContain(amount);
    expect(String(metadata.description).length).toBeLessThanOrEqual(155);
    expect(firstImage(metadata)).toMatchObject({
      url: `https://toshkent-tuman-invest.uz/${locale}/objects/yangi-sanoat-zonasi/opengraph-image`,
      width: 1200,
      height: 630,
    });
  });

  test('uses localized image alt text for an object', () => {
    expect(firstImage(objectMetadata(object, 'uz'))).toMatchObject({
      alt: 'Yangi sanoat zonasi investitsiya obyekti',
    });
    expect(firstImage(objectMetadata(object, 'ru'))).toMatchObject({
      alt: 'Инвестиционный объект «Yangi sanoat zonasi»',
    });
  });

  test.each(['uz', 'ru'] as const)('keeps the %s login page out of search results', (locale) => {
    const metadata = loginMetadata(locale);

    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(metadata.alternates?.canonical).toBe(
      `https://toshkent-tuman-invest.uz/${locale}/login`,
    );
  });

  test('compacts descriptions without exceeding the requested limit', () => {
    const compact = compactText(`  ${'long text '.repeat(30)}  `, 80);

    expect(compact).toHaveLength(80);
    expect(compact.endsWith('…')).toBe(true);
    expect(compact).not.toMatch(/\s{2,}/);
  });
});
