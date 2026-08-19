'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const route = require('../../utils/async-handler');
const ensureAuth = require('../../middleware/ensure-auth');

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

module.exports = async (app) => {
  app.post(
    '/login',
    route(async (request, reply) => {
      const { email, password } = request.body || {};
      if (!email || !password)
        return reply.code(400).send({ error: 'Email and password are required' });
      const user = await app.db.User.findOne({ where: { email: String(email).toLowerCase() } });
      if (!user || !(await bcrypt.compare(password, user.passwordHash)))
        return reply.code(401).send({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '8h',
      });
      return { token, user: publicUser(user) };
    }),
  );
  app.get(
    '/me',
    { preHandler: ensureAuth() },
    route(async (request, reply) => {
      const user = await app.db.User.findByPk(request.user.id);
      if (!user) return reply.code(401).send({ error: 'Invalid session' });
      return { user: publicUser(user) };
    }),
  );
};
