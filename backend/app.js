'use strict';

require('dotenv').config();

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const db = require('./db/models');

module.exports = async function buildApp(options = {}) {
  const app = Fastify({ logger: options.logger ?? true });
  await app.register(cors, { origin: process.env.FRONT_HOST_NAME?.split(',') || true });
  app.decorate('db', db);
  await app.register(require('./routes'));
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  });
  return app;
};
