'use strict';

const { objectTypes, statuses, sectors } = require('../../services/investment-object-query');

module.exports = async (app) => {
  app.get('/', async () => ({
    types: [...objectTypes],
    statuses: [...statuses],
    sectors: [...sectors],
    area: { min: 0, max: 100 },
    investment: { min: 0, max: 10000000 },
  }));
};
