'use strict';

const { expect, test } = require('bun:test');
const { preview } = require('../investment-object-presenter');

test('public previews expose the database-backed update timestamp', () => {
  const updatedAt = new Date('2026-09-24T10:20:30.000Z');
  const result = preview(
    {
      id: 'object-1',
      slug: 'verified-lot',
      type: 'land',
      status: 'available',
      district: 'Toshkent',
      longitude: '69.2000000',
      latitude: '41.3000000',
      updatedAt,
      translations: [{ locale: 'uz', title: 'Tasdiqlangan lot' }],
      media: [],
    },
    'uz',
  );

  expect(result.updatedAt).toBe('2026-09-24T10:20:30.000Z');
});
