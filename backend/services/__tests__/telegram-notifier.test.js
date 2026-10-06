'use strict';

const { describe, expect, test } = require('bun:test');
const { createTelegramNotifier, formatApplicationMessage } = require('../telegram-notifier');

const applicationId = '11111111-1111-4111-8111-111111111111';

function application(overrides = {}) {
  return {
    id: applicationId,
    name: 'Aziz <Investor>',
    company: 'Toshkent & Hamkorlar',
    country: 'O‘zbekiston',
    phone: '+998 90 123 45 67',
    email: 'aziz@example.uz',
    telegram: '@aziz',
    investmentAmountUsd: '150000.5',
    projectDescription: 'Logistika <markazi> & rivojlantirish',
    comment: 'Iltimos, bog‘laning.',
    createdAt: new Date('2026-10-06T08:30:00.000Z'),
    object: {
      cadastralNumber: '10:01:02:03:04:0001',
      translations: [
        { locale: 'ru', title: 'Русский объект' },
        { locale: 'uz', title: 'Yangi <obyekt>' },
      ],
    },
    ...overrides,
  };
}

function database({ admin, submittedApplication } = {}) {
  return {
    User: { findOne: async () => admin ?? null },
    Application: { findByPk: async () => submittedApplication ?? null },
  };
}

function notifier(options = {}) {
  return createTelegramNotifier({
    db: database({
      admin: { id: 'admin-1', telegramChatId: '123456', telegramLinkedAt: new Date() },
      submittedApplication: application(),
    }),
    botToken: 'test-bot-token',
    appPublicUrl: 'https://invest.example.uz',
    logger: { error: () => undefined },
    fetch: async () => ({ ok: true, status: 200 }),
    ...options,
  });
}

describe('Telegram application notifier', () => {
  test('does nothing when Telegram configuration is incomplete', async () => {
    let databaseUsed = false;
    const service = createTelegramNotifier({
      db: {
        User: {
          findOne: async () => {
            databaseUsed = true;
          },
        },
      },
      botToken: '',
      appPublicUrl: 'https://invest.example.uz',
    });

    await expect(service.notifyNewApplication(applicationId)).resolves.toEqual({
      delivered: false,
      reason: 'disabled',
    });
    expect(databaseUsed).toBe(false);
  });

  test('skips delivery when no active linked admin exists', async () => {
    let fetchCalled = false;
    const db = database({ submittedApplication: application() });
    const service = notifier({
      db,
      fetch: async () => {
        fetchCalled = true;
      },
    });

    await expect(service.notifyNewApplication(applicationId)).resolves.toEqual({
      delivered: false,
      reason: 'no_recipient',
    });
    expect(fetchCalled).toBe(false);
    expect(db.User.findOne).toBeDefined();
  });

  test('sends an escaped Uzbek HTML message and exact dashboard deep link', async () => {
    const requests = [];
    const service = notifier({
      fetch: async (url, options) => {
        requests.push({ url, options });
        return { ok: true, status: 200 };
      },
    });

    await expect(service.notifyNewApplication(applicationId)).resolves.toEqual({
      delivered: true,
    });
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('https://api.telegram.org/bottest-bot-token/sendMessage');
    expect(requests[0].options.method).toBe('POST');
    const payload = JSON.parse(requests[0].options.body);
    expect(payload).toMatchObject({
      chat_id: '123456',
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📂 Arizani kabinetda ochish',
              url: `https://invest.example.uz/dashboard/applications?application=${applicationId}`,
            },
          ],
        ],
      },
    });
    expect(payload.text).toContain('🔔 Yangi investor arizasi');
    expect(payload.text).toContain('Aziz &lt;Investor&gt;');
    expect(payload.text).toContain('Toshkent &amp; Hamkorlar');
    expect(payload.text).toContain('Yangi &lt;obyekt&gt;');
    expect(payload.text).not.toContain('<Investor>');
  });

  test('keeps Telegram HTML messages within its length limit', () => {
    const text = formatApplicationMessage(
      application({
        name: '<'.repeat(1000),
        projectDescription: '&'.repeat(10000),
        comment: '>'.repeat(10000),
      }),
    );

    expect(text.length).toBeLessThanOrEqual(4096);
    expect(text).toContain('&lt;');
    expect(text).not.toContain('<'.repeat(2));
  });

  test('contains Telegram delivery failures without logging secrets or applicant data', async () => {
    const errors = [];
    const service = notifier({
      fetch: async () => {
        throw new Error('network unreachable');
      },
      logger: { error: (...args) => errors.push(args) },
    });

    await expect(service.notifyNewApplication(applicationId)).resolves.toEqual({
      delivered: false,
      reason: 'delivery_failed',
    });
    expect(errors).toHaveLength(1);
    const logged = JSON.stringify(errors[0]);
    expect(logged).toContain(applicationId);
    expect(logged).not.toContain('test-bot-token');
    expect(logged).not.toContain('aziz@example.uz');
    expect(logged).not.toContain('network unreachable');
  });

  test('treats a failed Telegram API response body as an undelivered notification', async () => {
    const errors = [];
    const service = notifier({
      fetch: async () => ({ ok: true, status: 200, json: async () => ({ ok: false }) }),
      logger: { error: (...args) => errors.push(args) },
    });

    await expect(service.notifyNewApplication(applicationId)).resolves.toEqual({
      delivered: false,
      reason: 'delivery_failed',
    });
    expect(errors).toHaveLength(1);
  });
});
