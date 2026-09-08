'use strict';

const { test, expect } = require('bun:test');
const buildApp = require('../../app');

test('GET /health returns a ready payload', async () => {
  const app = await buildApp({ logger: false });
  const response = await app.inject({ method: 'GET', url: '/health' });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ status: 'ok' });
  expect(response.headers['server-timing']).toBeUndefined();
  await app.close();
});

test('GET /api/filters reports application processing time', async () => {
  const app = await buildApp({ logger: false });
  const response = await app.inject({ method: 'GET', url: '/api/filters' });
  expect(response.statusCode).toBe(200);
  expect(response.headers['server-timing']).toMatch(/^app;dur=\d+\.\d$/);
  await app.close();
});

for (const origin of [
  'https://tashkent-invest.vercel.app',
  'https://toshkent-tuman-invest.uz',
  'https://www.toshkent-tuman-invest.uz',
]) {
  test(`allows ${origin} through CORS`, async () => {
    const app = await buildApp({ logger: false });
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        origin,
        'access-control-request-method': 'GET',
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    await app.close();
  });
}
