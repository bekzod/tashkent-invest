'use strict';

require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

module.exports = {
  development: { url: databaseUrl, dialect: 'postgres', logging: false },
  test: { url: databaseUrl, dialect: 'postgres', logging: false },
  production: { url: databaseUrl, dialect: 'postgres', logging: false },
};
