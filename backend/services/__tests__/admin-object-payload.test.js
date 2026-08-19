'use strict';

const { test, expect } = require('bun:test');
const { normalizeObjectPayload } = require('../admin-object-payload');

const publishPayload = {
  slug: 'logistics-hub-2026',
  type: 'land',
  status: 'available',
  district: 'Yunusobod',
  cadastralNumber: '10:01:01:0001',
  latitude: 41.37,
  longitude: 69.29,
  landAreaHa: 5,
  investmentAmountUsd: 500000,
  sectors: ['logistics'],
  translations: {
    uz: {
      title: 'Logistika markazi',
      shortDescription: 'Qisqa tavsif',
      description: 'Batafsil tavsif',
      address: 'Yunusobod',
    },
    ru: {
      title: 'Логистический центр',
      shortDescription: 'Краткое описание',
      description: 'Подробное описание',
      address: 'Юнусабад',
    },
  },
};

test('accepts an incomplete draft but requires publishing fields', () => {
  expect(
    normalizeObjectPayload({ status: 'draft', translations: { uz: { title: 'Qoralama' } } })
      .translations.uz.title,
  ).toBe('Qoralama');
  expect(() =>
    normalizeObjectPayload({ ...publishPayload, status: 'available', sectors: [] }),
  ).toThrow('sector');
});

test('normalizes safe media and rejects unsafe or duplicate virtual tours', () => {
  const normalized = normalizeObjectPayload({
    ...publishPayload,
    media: [
      { kind: 'image', url: 'https://cdn.example.com/hero.webp', title: 'Asosiy foto' },
      { kind: 'virtual_tour', url: 'https://cdn.example.com/tour.jpg' },
    ],
  });

  expect(normalized.media).toHaveLength(2);
  expect(() =>
    normalizeObjectPayload({
      ...publishPayload,
      media: [{ kind: 'image', url: 'http://unsafe.example/image.jpg' }],
    }),
  ).toThrow('HTTPS');
  expect(() =>
    normalizeObjectPayload({
      ...publishPayload,
      media: [
        { kind: 'virtual_tour', url: 'https://a.example/1.jpg' },
        { kind: 'virtual_tour', url: 'https://a.example/2.jpg' },
      ],
    }),
  ).toThrow('virtual tour');
});

test('validates point and polygon coordinates', () => {
  expect(() => normalizeObjectPayload({ ...publishPayload, latitude: 100 })).toThrow('Latitude');
  expect(() =>
    normalizeObjectPayload({
      ...publishPayload,
      siteGeometry: {
        type: 'Polygon',
        coordinates: [
          [
            [69, 41],
            [70, 41],
            [70, 42],
            [69, 42],
          ],
        ],
      },
    }),
  ).toThrow('closed');
});
