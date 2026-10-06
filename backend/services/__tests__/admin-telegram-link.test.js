'use strict';

const { expect, test } = require('bun:test');
const {
  LINK_TTL_MS,
  chatId,
  createLinkToken,
  hashLinkToken,
  startToken,
  validWebhookSecret,
} = require('../admin-telegram-link');

test('creates an opaque one-use token with a ten-minute hash expiry', () => {
  const now = Date.UTC(2026, 9, 6, 8, 0, 0);
  const result = createLinkToken(now);
  expect(result.token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
  expect(result.tokenHash).toBe(hashLinkToken(result.token));
  expect(result.expiresAt).toEqual(new Date(now + LINK_TTL_MS));
});

test('parses only a Telegram start command and a chat identifier', () => {
  const update = {
    message: { text: '/start@InvestTumanBot token_abcdefghijklmnopqrstuv', chat: { id: -10042 } },
  };
  expect(startToken(update)).toBe('token_abcdefghijklmnopqrstuv');
  expect(chatId(update)).toBe('-10042');
  expect(startToken({ message: { text: '/help token_abcdefghijklmnopqrstuv' } })).toBeNull();
  expect(chatId({ message: { chat: {} } })).toBeNull();
});

test('compares webhook secrets without accepting missing or unequal values', () => {
  expect(validWebhookSecret('same', 'same')).toBe(true);
  expect(validWebhookSecret('same', 'different')).toBe(false);
  expect(validWebhookSecret('', 'same')).toBe(false);
});
