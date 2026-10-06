'use strict';

const { createHash, randomBytes, timingSafeEqual } = require('node:crypto');
const { Buffer } = require('node:buffer');

const LINK_TTL_MS = 10 * 60 * 1000;

function hashLinkToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function createLinkToken(now = Date.now()) {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashLinkToken(token),
    expiresAt: new Date(now + LINK_TTL_MS),
  };
}

function validWebhookSecret(received, expected) {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function startToken(update) {
  const text = update?.message?.text;
  if (typeof text !== 'string') return null;
  const match = text.trim().match(/^\/start(?:@[A-Za-z0-9_]+)?\s+([A-Za-z0-9_-]{20,})$/);
  return match?.[1] || null;
}

function chatId(update) {
  const id = update?.message?.chat?.id;
  return typeof id === 'number' || typeof id === 'string' ? String(id) : null;
}

module.exports = {
  LINK_TTL_MS,
  chatId,
  createLinkToken,
  hashLinkToken,
  startToken,
  validWebhookSecret,
};
