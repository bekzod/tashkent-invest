import { describe, expect, it } from 'vitest';
import type { InvestmentObject } from '@/entities/investment-object/types';
import { homeStructuredData, objectStructuredData } from './structured-data';

const object: InvestmentObject = {
  id: '1',
  slug: 'promyshlennaya-ploshchadka',
  title: 'Промышленная площадка',
  shortDescription: 'Описание',
  address: 'Чинабад',
  district: 'Ташкентский район',
  type: 'land',
  status: 'available',
  landAreaHa: 5,
  investmentAmountUsd: 100_000,
  coordinates: [69.2, 41.3],
};

describe('localized structured data', () => {
  it('uses the localized homepage URL and language without a fake SearchAction', () => {
    const data = homeStructuredData('ru');

    expect(data[1]).toMatchObject({
      '@type': 'WebSite',
      url: 'https://toshkent-tuman-invest.uz/ru',
      inLanguage: 'ru',
    });
    expect(JSON.stringify(data)).not.toContain('SearchAction');
  });

  it('localizes object URLs, labels, region, and units', () => {
    const data = objectStructuredData(object, 'ru');

    expect(data).toMatchObject({
      url: 'https://toshkent-tuman-invest.uz/ru/objects/promyshlennaya-ploshchadka',
      inLanguage: 'ru',
      address: { addressRegion: 'Ташкентская область' },
    });
    expect(data.additionalProperty).toContainEqual(
      expect.objectContaining({ name: 'Площадь участка', unitText: 'га' }),
    );
  });
});
