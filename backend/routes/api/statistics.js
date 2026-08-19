'use strict';

const route = require('../../utils/async-handler');

module.exports = async (app) => {
  app.get(
    '/',
    route(async () => {
      const { InvestmentObject } = app.db;
      const [objects, auctions, upcoming, investment] = await Promise.all([
        InvestmentObject.count(),
        InvestmentObject.count({ where: { status: 'auction' } }),
        InvestmentObject.count({ where: { status: 'upcoming' } }),
        InvestmentObject.sum('investmentAmountUsd'),
      ]);
      return { objects, auctions, upcoming, investmentAmountUsd: Number(investment || 0) };
    }),
  );
};
