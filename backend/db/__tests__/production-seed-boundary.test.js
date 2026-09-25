'use strict';

const { expect, test } = require('bun:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const backendRoot = process.cwd();

test('production container startup migrates but never creates demo inventory', () => {
  const dockerfile = readFileSync(join(backendRoot, 'Dockerfile'), 'utf8');

  expect(dockerfile).toContain('npm run db:migrate');
  expect(dockerfile).not.toContain('db:seed');
});

test('demo fixtures are isolated behind the explicit E2E seed command', () => {
  const packageJson = require('../../package.json');
  const productionSeed = readFileSync(join(backendRoot, 'db', 'seed.js'), 'utf8');
  const e2eSeed = readFileSync(join(backendRoot, 'db', 'seed-e2e.js'), 'utf8');

  expect(packageJson.scripts['db:seed:e2e']).toBe('node db/seed-e2e.js');
  expect(productionSeed).not.toContain('picsum.photos');
  expect(productionSeed).not.toContain('tashkent-invest-${index + 1}');
  expect(e2eSeed).toContain('picsum.photos');
  expect(e2eSeed).toContain('isDemo: true');
  expect(e2eSeed).toContain("process.env.ALLOW_E2E_SEED !== 'true'");
});

test('the E2E seeder refuses to touch a database without the explicit safety flag', async () => {
  const previous = process.env.ALLOW_E2E_SEED;
  delete process.env.ALLOW_E2E_SEED;
  const { seedE2E } = require('../seed-e2e');

  try {
    await expect(seedE2E({})).rejects.toThrow(
      'Refusing to seed demo inventory without ALLOW_E2E_SEED=true',
    );
  } finally {
    if (previous === undefined) delete process.env.ALLOW_E2E_SEED;
    else process.env.ALLOW_E2E_SEED = previous;
  }
});
