'use strict';

const bcrypt = require('bcryptjs');
const { Buffer } = require('node:buffer');

const CONSENT_POLICY_VERSION = '2026-09-25';
const SUPPORTED_LOCALES = new Set(['uz', 'ru']);

class RegistrationError extends Error {
  constructor(code, statusCode, fieldErrors = {}) {
    super(code);
    this.name = 'RegistrationError';
    this.code = code;
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

function normalizeName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function normalizeRegistration(input = {}) {
  const name = normalizeName(input.name);
  const email = normalizeEmail(input.email);
  const password = typeof input.password === 'string' ? input.password : '';
  const locale = SUPPORTED_LOCALES.has(input.locale) ? input.locale : 'uz';
  const fieldErrors = {};

  if (name.length < 2 || name.length > 100) fieldErrors.name = 'INVALID_NAME';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = 'INVALID_EMAIL';
  }
  if (
    password.length < 10 ||
    Buffer.byteLength(password, 'utf8') > 72 ||
    !/[\p{L}]/u.test(password) ||
    !/\d/.test(password)
  ) {
    fieldErrors.password = 'WEAK_PASSWORD';
  }
  if (input.consent !== true) fieldErrors.consent = 'CONSENT_REQUIRED';

  if (Object.keys(fieldErrors).length) {
    throw new RegistrationError('INVALID_REGISTRATION', 400, fieldErrors);
  }

  return { name, email, password, locale };
}

function isUniqueConstraintError(error) {
  return (
    error?.name === 'SequelizeUniqueConstraintError' ||
    error?.original?.code === '23505' ||
    error?.parent?.code === '23505'
  );
}

async function registerInvestor(db, input, options = {}) {
  const registration = normalizeRegistration(input);
  const now = options.now || new Date();
  const rounds = options.rounds || 12;
  const where = db.Sequelize.where(
    db.Sequelize.fn('lower', db.Sequelize.col('email')),
    registration.email,
  );
  const existing = await db.User.findOne({ where });

  if (existing) throw new RegistrationError('ACCOUNT_EXISTS', 409);

  const passwordHash = await bcrypt.hash(registration.password, rounds);

  try {
    return await db.User.create({
      name: registration.name,
      email: registration.email,
      passwordHash,
      role: 'investor',
      consentedAt: now,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
      consentLocale: registration.locale,
      emailVerifiedAt: null,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new RegistrationError('ACCOUNT_EXISTS', 409);
    }
    throw error;
  }
}

module.exports = {
  CONSENT_POLICY_VERSION,
  RegistrationError,
  normalizeEmail,
  normalizeName,
  normalizeRegistration,
  registerInvestor,
};
