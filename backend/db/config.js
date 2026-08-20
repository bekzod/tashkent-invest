'use strict';

require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
const { databaseConnectionOptions } = require('./connection-options');

module.exports = {
  development: { url: databaseUrl, ...databaseConnectionOptions() },
  test: { url: databaseUrl, ...databaseConnectionOptions() },
  production: { url: databaseUrl, ...databaseConnectionOptions() },
};
