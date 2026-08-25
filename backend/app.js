'use strict';

require('dotenv').config();

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const db = require('./db/models');

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'https://tashkent-invest.vercel.app',
  'https://toshkent-tuman-invest.uz',
  'https://www.toshkent-tuman-invest.uz',
];

function allowedOrigins() {
  const configuredOrigins = (process.env.FRONT_HOST_NAME || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...new Set([...defaultAllowedOrigins, ...configuredOrigins])];
}

module.exports = async function buildApp(options = {}) {
  const app = Fastify({ logger: options.logger ?? true });
  await app.register(cors, { origin: allowedOrigins() });
  app.decorate('db', db);
  await app.register(require('./routes'));
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({ error: error.message || 'Internal server error' });
  });
  return app;
};
