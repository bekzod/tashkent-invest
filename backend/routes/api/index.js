'use strict';

module.exports = async (app) => {
  await app.register(require('./statistics'), { prefix: '/statistics' });
  await app.register(require('./filters'), { prefix: '/filters' });
  await app.register(require('./objects'), { prefix: '/objects' });
  await app.register(require('./areas'), { prefix: '/areas' });
  await app.register(require('./auth'), { prefix: '/auth' });
  await app.register(require('./admin-objects'), { prefix: '/admin' });
  await app.register(require('./investor-actions'));
};
