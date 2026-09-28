'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const route = require('../../utils/async-handler');
const ensureAuth = require('../../middleware/ensure-auth');
const {
  RegistrationError,
  normalizeEmail,
  registerInvestor,
} = require('../../services/registration');

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}

function createFixedWindowLimiter({ limit, windowMs, keyFor = (request) => request.ip }) {
  const attempts = new Map();

  return function check(request, reply) {
    const now = Date.now();
    if (attempts.size > 10_000) {
      for (const [storedKey, stored] of attempts) {
        if (stored.resetAt <= now) attempts.delete(storedKey);
      }
      while (attempts.size > 10_000) attempts.delete(attempts.keys().next().value);
    }
    const key = keyFor(request);
    const current = attempts.get(key);
    const entry =
      !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    entry.count += 1;
    attempts.set(key, entry);

    if (entry.count <= limit) return false;

    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    reply.header('Retry-After', String(retryAfter));
    reply.code(429).send({ code: 'RATE_LIMITED', error: 'Too many attempts' });
    return true;
  };
}

module.exports = async (app) => {
  const identityKey = (request) =>
    `${request.ip}:${normalizeEmail(request.body?.email || 'unknown')}`;
  const limitLogin = createFixedWindowLimiter({
    limit: 10,
    windowMs: 15 * 60 * 1000,
    keyFor: identityKey,
  });
  const limitRegistration = createFixedWindowLimiter({
    limit: 5,
    windowMs: 60 * 60 * 1000,
    keyFor: identityKey,
  });

  app.post(
    '/login',
    route(async (request, reply) => {
      if (limitLogin(request, reply)) return;
      const { email, password } = request.body || {};
      if (!email || !password)
        return reply
          .code(400)
          .send({ code: 'LOGIN_REQUIRED', error: 'Email and password are required' });
      const user = await app.db.User.findOne({ where: { email: normalizeEmail(email) } });
      if (!user || !(await bcrypt.compare(password, user.passwordHash)))
        return reply.code(401).send({ code: 'INVALID_CREDENTIALS', error: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '8h',
      });
      return { token, user: publicUser(user) };
    }),
  );
  app.post(
    '/register',
    route(async (request, reply) => {
      if (limitRegistration(request, reply)) return;

      try {
        const user = await registerInvestor(app.db, request.body || {});
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
          expiresIn: '8h',
        });
        return reply.code(201).send({
          token,
          user: publicUser(user),
          emailVerification: 'not_configured',
        });
      } catch (error) {
        if (error instanceof RegistrationError) {
          return reply.code(error.statusCode).send({
            code: error.code,
            error: error.code,
            ...(Object.keys(error.fieldErrors).length ? { fieldErrors: error.fieldErrors } : {}),
          });
        }
        request.log.error(error);
        return reply
          .code(500)
          .send({ code: 'REGISTRATION_FAILED', error: 'Unable to create account' });
      }
    }),
  );
  app.get(
    '/me',
    { preHandler: ensureAuth() },
    route(async (request, reply) => {
      const user = await app.db.User.findByPk(request.user.id);
      if (!user) return reply.code(401).send({ code: 'INVALID_SESSION', error: 'Invalid session' });
      return { user: publicUser(user) };
    }),
  );
};
