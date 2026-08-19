'use strict';

const { test, expect } = require('bun:test');
const buildApp = require('../../app');

test('GET /health returns a ready payload', async () => {
  const app = await buildApp({ logger: false });
  const response = await app.inject({ method: 'GET', url: '/health' });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ status: 'ok' });
  await app.close();
});

test('allows the production Vercel frontend through CORS', async () => {
  const app = await buildApp({ logger: false });
  const response = await app.inject({
    method: 'OPTIONS',
    url: '/health',
    headers: {
      origin: 'https://tashkent-invest.vercel.app',
      'access-control-request-method': 'GET',
    },
  });

  expect(response.statusCode).toBe(204);
  expect(response.headers['access-control-allow-origin']).toBe(
    'https://tashkent-invest.vercel.app',
  );
  await app.close();
});
