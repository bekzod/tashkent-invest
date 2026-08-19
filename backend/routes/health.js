'use strict';

module.exports = async (app) => {
  app.get('/health', async () => ({ status: 'ok' }));
};
