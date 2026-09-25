'use strict';

const bcrypt = require('bcryptjs');
const { describe, expect, test } = require('bun:test');
const {
  CONSENT_POLICY_VERSION,
  RegistrationError,
  normalizeRegistration,
  registerInvestor,
} = require('../registration');

function fakeDatabase(initialUsers = []) {
  const users = [...initialUsers];
  return {
    users,
    Sequelize: {
      col: (name) => ({ name }),
      fn: (name, column) => ({ name, column }),
      where: (_expression, value) => ({ normalizedEmail: value }),
    },
    User: {
      findOne: async ({ where }) =>
        users.find((user) => user.email.toLowerCase() === where.normalizedEmail) || null,
      create: async (values) => {
        const user = { id: `user-${users.length + 1}`, ...values };
        users.push(user);
        return user;
      },
    },
  };
}

describe('investor registration', () => {
  test('normalizes identity fields and rejects invalid boundaries', () => {
    expect(
      normalizeRegistration({
        name: '  Dilshod   Karimov ',
        email: ' Investor@Example.UZ ',
        password: 'secure2026',
        consent: true,
        locale: 'ru',
      }),
    ).toEqual({
      name: 'Dilshod Karimov',
      email: 'investor@example.uz',
      password: 'secure2026',
      locale: 'ru',
    });

    for (const input of [
      { name: 'D', email: 'valid@example.uz', password: 'secure2026', consent: true },
      { name: 'Dilshod', email: 'invalid', password: 'secure2026', consent: true },
      { name: 'Dilshod', email: 'valid@example.uz', password: 'short1', consent: true },
      { name: 'Dilshod', email: 'valid@example.uz', password: 'secure2026', consent: false },
    ]) {
      expect(() => normalizeRegistration(input)).toThrow(RegistrationError);
    }
  });

  test('forces investor role, persists consent audit, and hashes the password', async () => {
    const db = fakeDatabase();
    const consentedAt = new Date('2026-09-25T08:00:00.000Z');

    const user = await registerInvestor(
      db,
      {
        name: '  Dilshod   Karimov ',
        email: ' Investor@Example.UZ ',
        password: 'secure2026',
        consent: true,
        locale: 'ru',
        role: 'admin',
      },
      { now: consentedAt, rounds: 4 },
    );

    expect(user).toMatchObject({
      name: 'Dilshod Karimov',
      email: 'investor@example.uz',
      role: 'investor',
      consentedAt,
      consentPolicyVersion: CONSENT_POLICY_VERSION,
      consentLocale: 'ru',
      emailVerifiedAt: null,
    });
    expect(user.passwordHash).not.toBe('secure2026');
    expect(await bcrypt.compare('secure2026', user.passwordHash)).toBe(true);
  });

  test('detects an existing email without regard to casing', async () => {
    const db = fakeDatabase([{ id: 'existing', email: 'Investor@Example.UZ' }]);

    await expect(
      registerInvestor(db, {
        name: 'Another Investor',
        email: ' investor@example.uz ',
        password: 'secure2026',
        consent: true,
      }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_EXISTS', statusCode: 409 });
  });

  test('maps a database uniqueness race to ACCOUNT_EXISTS', async () => {
    const db = fakeDatabase();
    db.User.create = async () => {
      const error = new Error('database detail must not leak');
      error.name = 'SequelizeUniqueConstraintError';
      throw error;
    };

    await expect(
      registerInvestor(db, {
        name: 'Race Condition',
        email: 'race@example.uz',
        password: 'secure2026',
        consent: true,
      }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_EXISTS', statusCode: 409 });
  });
});
