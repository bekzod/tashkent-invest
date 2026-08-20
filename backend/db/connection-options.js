'use strict';

function isEnabled(value) {
  return ['1', 'true', 'yes'].includes(
    String(value || '')
      .trim()
      .toLowerCase(),
  );
}

function isDisabled(value) {
  return ['0', 'false', 'no'].includes(
    String(value || '')
      .trim()
      .toLowerCase(),
  );
}

function shouldUseDatabaseSsl(environment = process.env) {
  if (isEnabled(environment.DATABASE_SSL)) return true;
  if (isDisabled(environment.DATABASE_SSL)) return false;
  return environment.NODE_ENV === 'production';
}

function databaseConnectionOptions(environment = process.env) {
  const options = { dialect: 'postgres', logging: false };
  if (shouldUseDatabaseSsl(environment)) {
    options.dialectOptions = {
      ssl: { require: true, rejectUnauthorized: false },
    };
  }
  return options;
}

module.exports = { databaseConnectionOptions, shouldUseDatabaseSsl };
