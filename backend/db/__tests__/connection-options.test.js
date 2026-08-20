'use strict';

const { expect, test } = require('bun:test');
const { databaseConnectionOptions, shouldUseDatabaseSsl } = require('../connection-options');

test('uses SSL in production unless explicitly disabled', () => {
  expect(shouldUseDatabaseSsl({ NODE_ENV: 'production' })).toBe(true);
  expect(shouldUseDatabaseSsl({ NODE_ENV: 'production', DATABASE_SSL: 'false' })).toBe(false);
  expect(shouldUseDatabaseSsl({ NODE_ENV: 'development' })).toBe(false);
});

test('creates PostgreSQL SSL options that accept Render certificates', () => {
  expect(databaseConnectionOptions({ DATABASE_SSL: 'true' })).toEqual({
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  });
});
