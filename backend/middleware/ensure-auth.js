'use strict';

const jwt = require('jsonwebtoken');

module.exports = (requiredRole) => async (request, reply) => {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return reply.code(401).send({ error: 'Authentication required' });
  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
    if (requiredRole && request.user.role !== requiredRole)
      return reply.code(403).send({ error: 'Insufficient permissions' });
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired session' });
  }
};
