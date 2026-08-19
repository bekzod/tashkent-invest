'use strict';

const jwt = require('jsonwebtoken');

module.exports = () => async (request, reply) => {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return reply.code(401).send({ error: 'Authentication required' });
  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired session' });
  }
};
