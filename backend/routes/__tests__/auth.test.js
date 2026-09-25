'use strict';

const Fastify = require('fastify');
const { afterEach, beforeEach, describe, expect, test } = require('bun:test');
const authRoutes = require('../api/auth');

const originalJwtSecret = process.env.JWT_SECRET;
const apps = [];

function fakeDatabase() {
  const users = [];
  return {
    users,
    Sequelize: {
      col: (name) => ({ name }),
      fn: (name, column) => ({ name, column }),
      where: (_expression, value) => ({ normalizedEmail: value }),
    },
    User: {
      findOne: async ({ where }) => {
        const email = where.normalizedEmail || where.email;
        return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
      },
      findByPk: async (id) => users.find((user) => user.id === id) || null,
      create: async (values) => {
        const user = { id: `user-${users.length + 1}`, ...values };
        users.push(user);
        return user;
      },
    },
  };
}

async function buildAuthApp() {
  const app = Fastify({ logger: false });
  const db = fakeDatabase();
  app.decorate('db', db);
  await app.register(authRoutes, { prefix: '/api/auth' });
  apps.push(app);
  return { app, db };
}

beforeEach(() => {
  process.env.JWT_SECRET = 'registration-route-test-secret';
});

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});

describe('POST /api/auth/register', () => {
  test('creates only an investor session and never returns a password hash', async () => {
    const { app, db } = await buildAuthApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: '  Nodira Investor ',
        email: ' NODIRA@EXAMPLE.UZ ',
        password: 'investor2026',
        consent: true,
        locale: 'ru',
        role: 'admin',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      user: {
        name: 'Nodira Investor',
        email: 'nodira@example.uz',
        role: 'investor',
        emailVerified: false,
      },
      emailVerification: 'not_configured',
    });
    expect(response.json().token).toBeString();
    expect(response.json().user.passwordHash).toBeUndefined();
    expect(db.users[0].passwordHash).not.toBe('investor2026');
    expect(db.users[0].consentedAt).toBeInstanceOf(Date);
  });

  test('returns stable validation and duplicate error codes', async () => {
    const { app } = await buildAuthApp();
    const invalid = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { name: 'N', email: 'bad', password: 'short', consent: false },
    });

    expect(invalid.statusCode).toBe(400);
    expect(invalid.json()).toEqual({
      code: 'INVALID_REGISTRATION',
      error: 'INVALID_REGISTRATION',
      fieldErrors: {
        name: 'INVALID_NAME',
        email: 'INVALID_EMAIL',
        password: 'WEAK_PASSWORD',
        consent: 'CONSENT_REQUIRED',
      },
    });

    const payload = {
      name: 'Existing Investor',
      email: 'existing@example.uz',
      password: 'investor2026',
      consent: true,
    };
    expect(
      (await app.inject({ method: 'POST', url: '/api/auth/register', payload })).statusCode,
    ).toBe(201);
    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { ...payload, email: ' Existing@Example.UZ ' },
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json()).toEqual({ code: 'ACCOUNT_EXISTS', error: 'ACCOUNT_EXISTS' });
  });

  test('does not leak unexpected persistence errors', async () => {
    const { app, db } = await buildAuthApp();
    db.User.create = async () => {
      throw new Error('password database connection and table detail');
    };
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Safe Failure',
        email: 'safe-failure@example.uz',
        password: 'investor2026',
        consent: true,
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      code: 'REGISTRATION_FAILED',
      error: 'Unable to create account',
    });
    expect(response.body).not.toContain('database');
  });
});
