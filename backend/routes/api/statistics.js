'use strict';

const route = require('../../utils/async-handler');
const { Op } = require('sequelize');

module.exports = async (app) => {
  app.get(
    '/',
    route(async () => {
      const { InvestmentObject } = app.db;
      const where = {
        status: { [Op.in]: ['available', 'auction', 'upcoming'] },
        ...(process.env.INCLUDE_DEMO_DATA === 'true' ? {} : { isDemo: false }),
      };
      const [objects, auctions, upcoming, investment] = await Promise.all([
        InvestmentObject.count({ where }),
        InvestmentObject.count({ where: { ...where, status: 'auction' } }),
        InvestmentObject.count({ where: { ...where, status: 'upcoming' } }),
        InvestmentObject.sum('investmentAmountUsd', { where }),
      ]);
      return { objects, auctions, upcoming, investmentAmountUsd: Number(investment || 0) };
    }),
  );
};
