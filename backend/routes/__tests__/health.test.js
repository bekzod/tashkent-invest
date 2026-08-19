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
