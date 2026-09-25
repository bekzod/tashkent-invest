import { describe, expect, test } from 'vitest';
import type { InvestmentObject } from '@/entities/investment-object/types';
import { SOCIAL_CARD_SIZE, buildSocialCardModel } from './social-card';

const object: InvestmentObject = {
  id: 'object-1',
  slug: 'yangi-sanoat-zonasi',
  title: 'Yangi sanoat zonasi',
  shortDescription: 'Ishlab chiqarish uchun tayyor yer maydoni.',
  address: 'Chinobod mahallasi',
  district: 'Toshkent',
  type: 'land',
  status: 'auction',
  landAreaHa: 12.5,
  investmentAmountUsd: 2_500_000,
  imageUrl: 'https://cdn.example.com/object.webp',
};

describe('social card model', () => {
  test('uses the exact large social-card dimensions', () => {
    expect(SOCIAL_CARD_SIZE).toEqual({ width: 1200, height: 630 });
  });

  test.each([
    ['uz' as const, 'Investitsiya obyektlari xaritasi', 'Toshkent tumani'],
    ['ru' as const, 'Карта инвестиционных объектов', 'Ташкентский район'],
  ])('localizes the %s map card', (locale, title, location) => {
    const model = buildSocialCardModel({ kind: 'map', locale });

    expect(model.title).toBe(title);
    expect(model.location).toBe(location);
    expect(model.imageUrl).toBeNull();
  });

  test.each([
    ['uz' as const, 'Auksion', '12,5 ga', 'Investitsiya'],
    ['ru' as const, 'Аукцион', '12,5 га', 'Инвестиции'],
  ])('localizes object facts for %s', (locale, status, area, investmentLabel) => {
    const model = buildSocialCardModel({ kind: 'object', locale, object });

    expect(model.title).toBe(object.title);
    expect(model.facts).toEqual([
      { label: locale === 'uz' ? 'Holati' : 'Статус', value: status },
      { label: locale === 'uz' ? 'Maydoni' : 'Площадь', value: area },
      { label: investmentLabel, value: '$2,500,000' },
    ]);
    expect(model.imageUrl).toBe('https://cdn.example.com/object.webp');
  });

  test('falls back to the branded layout when an object image is absent or unsafe', () => {
    const withoutImage = buildSocialCardModel({
      kind: 'object',
      locale: 'uz',
      object: { ...object, imageUrl: null, media: [] },
    });
    const unsafeImage = buildSocialCardModel({
      kind: 'object',
      locale: 'uz',
      object: {
        ...object,
        imageUrl: 'javascript:alert(1)',
        media: [{ kind: 'image', url: 'http://internal.example/object.jpg' }],
      },
    });

    expect(withoutImage.imageUrl).toBeNull();
    expect(unsafeImage.imageUrl).toBeNull();
  });
});
