'use strict';

module.exports = async (app) => {
  await app.register(require('./health'));
  await app.register(require('./api'), { prefix: '/api' });
};
