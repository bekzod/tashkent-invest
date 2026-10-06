'use strict';

const Fastify = require('fastify');
const jwt = require('jsonwebtoken');
const { afterEach, beforeEach, expect, test } = require('bun:test');
const adminTelegramRoutes = require('../api/admin-telegram');
const telegramWebhook = require('../telegram-webhook');
const { hashLinkToken } = require('../../services/admin-telegram-link');

const originalSecret = process.env.JWT_SECRET;
const originalUsername = process.env.TELEGRAM_BOT_USERNAME;
const originalWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
const apps = [];

function user(values = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    role: 'admin',
    isActive: true,
    updates: [],
    async update(next) {
      this.updates.push(next);
      Object.assign(this, next);
    },
    ...values,
  };
}

function database({ admin, tokenHash } = {}) {
  const users = { bulkUpdates: [] };
  users.findByPk = async () => admin;
  users.findOne = async ({ where }) => (where.telegramLinkTokenHash === tokenHash ? admin : null);
  users.update = async (values, options) => users.bulkUpdates.push({ values, options });
  return {
    User: users,
    sequelize: { transaction: async (callback) => callback({ id: 'transaction' }) },
  };
}

async function build(db) {
  const app = Fastify({ logger: false });
  app.decorate('db', db);
  await app.register(adminTelegramRoutes, { prefix: '/api/admin' });
  await app.register(telegramWebhook);
  apps.push(app);
  return app;
}

beforeEach(() => {
  process.env.JWT_SECRET = 'telegram-link-test-secret';
  process.env.TELEGRAM_BOT_USERNAME = 'InvestTumanBot';
  process.env.TELEGRAM_WEBHOOK_SECRET = 'webhook-test-secret';
});

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
  if (originalUsername === undefined) delete process.env.TELEGRAM_BOT_USERNAME;
  else process.env.TELEGRAM_BOT_USERNAME = originalUsername;
  if (originalWebhookSecret === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET;
  else process.env.TELEGRAM_WEBHOOK_SECRET = originalWebhookSecret;
});

test('only an active admin can create a short-lived bot connection link', async () => {
  const admin = user();
  const app = await build(database({ admin }));
  const token = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET);
  const response = await app.inject({
    method: 'POST',
    url: '/api/admin/telegram/link',
    headers: { authorization: `Bearer ${token}` },
  });
  expect(response.statusCode).toBe(200);
  expect(response.json().botUrl).toMatch(/^https:\/\/t\.me\/InvestTumanBot\?start=/);
  expect(admin.updates[0].telegramLinkTokenHash).toMatch(/^[a-f0-9]{64}$/);
  expect(admin.updates[0].telegramLinkExpiresAt).toBeInstanceOf(Date);
});

test('returns only the current admin Telegram connection state', async () => {
  const linkedAt = new Date('2026-10-06T08:00:00.000Z');
  const admin = user({ telegramChatId: '123456', telegramLinkedAt: linkedAt });
  const app = await build(database({ admin }));
  const token = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET);
  const response = await app.inject({
    method: 'GET',
    url: '/api/admin/telegram',
    headers: { authorization: `Bearer ${token}` },
  });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ linked: true, linkedAt: linkedAt.toJSON() });
});

test('webhook links only a valid active admin start token and clears previous recipient', async () => {
  const token = `token_${'a'.repeat(32)}`;
  const admin = user();
  const db = database({ admin, tokenHash: hashLinkToken(token) });
  const app = await build(db);
  const response = await app.inject({
    method: 'POST',
    url: '/telegram/webhook',
    headers: { 'x-telegram-bot-api-secret-token': process.env.TELEGRAM_WEBHOOK_SECRET },
    payload: { message: { text: `/start ${token}`, chat: { id: 123456 } } },
  });
  expect(response.statusCode).toBe(200);
  expect(admin.telegramChatId).toBe('123456');
  expect(admin.telegramLinkTokenHash).toBeNull();
  expect(db.User.bulkUpdates).toHaveLength(1);

  const unauthorized = await app.inject({
    method: 'POST',
    url: '/telegram/webhook',
    payload: { message: { text: `/start ${token}`, chat: { id: 123456 } } },
  });
  expect(unauthorized.statusCode).toBe(401);
});
