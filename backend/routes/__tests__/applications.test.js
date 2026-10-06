'use strict';

const Fastify = require('fastify');
const jwt = require('jsonwebtoken');
const { afterEach, beforeEach, expect, test } = require('bun:test');
const investorRoutes = require('../api/investor-actions');

const secretBefore = process.env.JWT_SECRET;
const apps = [];
const objectId = '11111111-1111-4111-8111-111111111111';
const investorId = '22222222-2222-4222-8222-222222222222';

function database() {
  const applications = [];
  return {
    applications,
    sequelize: { transaction: async (callback) => callback({ id: 'transaction' }) },
    User: { findByPk: async () => ({ id: investorId, role: 'investor', isActive: true }) },
    InvestmentObject: {
      findByPk: async () => ({ id: objectId, status: 'available' }),
    },
    Application: {
      findOne: async () => applications[0] || null,
      create: async (values) => {
        const application = { id: 'application-1', createdAt: new Date(), ...values };
        applications.push(application);
        return application;
      },
      findAndCountAll: async ({ where }) => ({
        count: applications.filter((item) => item.userId === where.userId).length,
        rows: [],
      }),
    },
    ApplicationStatusHistory: { create: async () => undefined },
    Favorite: {},
    NotificationSubscription: {},
  };
}

async function build(telegramNotifier) {
  const app = Fastify({ logger: false });
  const db = database();
  app.decorate('db', db);
  if (telegramNotifier) app.decorate('telegramNotifier', telegramNotifier);
  await app.register(investorRoutes, { prefix: '/api' });
  apps.push(app);
  return { app, db };
}

beforeEach(() => {
  process.env.JWT_SECRET = 'application-route-secret';
});

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  if (secretBefore === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = secretBefore;
});

test('POST /api/applications is idempotent and rejects non-investor tokens', async () => {
  const { app } = await build();
  const payload = {
    objectId,
    name: 'Demo Investor',
    phone: '+998901234567',
    email: 'demo@example.uz',
  };
  const investorToken = jwt.sign({ id: investorId, role: 'investor' }, process.env.JWT_SECRET);
  const first = await app.inject({
    method: 'POST',
    url: '/api/applications',
    headers: { authorization: `Bearer ${investorToken}` },
    payload,
  });
  expect(first.statusCode).toBe(201);
  expect(first.json()).toEqual({ id: 'application-1', status: 'received', duplicate: false });

  const second = await app.inject({
    method: 'POST',
    url: '/api/applications',
    headers: { authorization: `Bearer ${investorToken}` },
    payload,
  });
  expect(second.statusCode).toBe(200);
  expect(second.json()).toEqual({ id: 'application-1', status: 'received', duplicate: true });

  const adminToken = jwt.sign({ id: 'admin-1', role: 'admin' }, process.env.JWT_SECRET);
  const forbidden = await app.inject({
    method: 'POST',
    url: '/api/applications',
    headers: { authorization: `Bearer ${adminToken}` },
    payload,
  });
  expect(forbidden.statusCode).toBe(403);
});

test('notifies once after a new application commits without changing investor success on failure', async () => {
  const calls = [];
  const { app } = await build({
    notifyNewApplication: async (applicationId) => {
      calls.push(applicationId);
      throw new Error('Telegram is unavailable');
    },
  });
  const payload = {
    objectId,
    name: 'Demo Investor',
    phone: '+998901234567',
    email: 'demo@example.uz',
  };
  const investorToken = jwt.sign({ id: investorId, role: 'investor' }, process.env.JWT_SECRET);
  const first = await app.inject({
    method: 'POST',
    url: '/api/applications',
    headers: { authorization: `Bearer ${investorToken}` },
    payload,
  });
  expect(first.statusCode).toBe(201);
  expect(calls).toEqual(['application-1']);

  const duplicate = await app.inject({
    method: 'POST',
    url: '/api/applications',
    headers: { authorization: `Bearer ${investorToken}` },
    payload,
  });
  expect(duplicate.statusCode).toBe(200);
  expect(calls).toEqual(['application-1']);
});
