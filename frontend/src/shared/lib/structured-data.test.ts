import { describe, expect, it } from 'vitest';
import type { InvestmentObject } from '@/entities/investment-object/types';
import {
  homeStructuredData,
  mapStructuredData,
  objectStructuredData,
} from './structured-data';

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

    expect(data['@graph'][1]).toMatchObject({
      '@type': 'WebSite',
      url: 'https://toshkent-tuman-invest.uz/ru',
      inLanguage: 'ru',
    });
    expect(JSON.stringify(data)).not.toContain('SearchAction');
    expect(JSON.stringify(data)).not.toContain('sameAs');
    expect(JSON.stringify(data)).not.toContain('telephone');
  });

  it('localizes object URLs, labels, region, and units', () => {
    const data = objectStructuredData(object, 'ru');

    const place = data['@graph'].find((entry) => entry['@type'] === 'Place');
    expect(place).toMatchObject({
      url: 'https://toshkent-tuman-invest.uz/ru/objects/promyshlennaya-ploshchadka',
      inLanguage: 'ru',
      address: { addressRegion: 'Ташкентская область' },
    });
    expect(place?.additionalProperty).toContainEqual(
      expect.objectContaining({ name: 'Площадь участка', unitText: 'га' }),
    );
    expect(JSON.stringify(data)).not.toContain('Offer');
  });

  it('builds a localized map collection with stable canonical item URLs', () => {
    const data = mapStructuredData([object], 'ru');
    const collection = data['@graph'].find((entry) => entry['@type'] === 'CollectionPage');
    const list = data['@graph'].find((entry) => entry['@type'] === 'ItemList');

    expect(collection).toMatchObject({
      url: 'https://toshkent-tuman-invest.uz/ru/map',
      inLanguage: 'ru',
    });
    expect(list?.itemListElement[0]).toMatchObject({
      position: 1,
      url: 'https://toshkent-tuman-invest.uz/ru/objects/promyshlennaya-ploshchadka',
    });
  });

  it('omits invalid or partial coordinates', () => {
    const data = objectStructuredData({ ...object, coordinates: [Number.NaN, 41.3] }, 'uz');
    const place = data['@graph'].find((entry) => entry['@type'] === 'Place');

    expect(place?.geo).toBeUndefined();
  });
});
