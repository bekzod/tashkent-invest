'use strict';

const route = require('../../utils/async-handler');
const { Op } = require('sequelize');
const { sectors } = require('../../services/investment-object-query');

module.exports = async (app) => {
  app.get(
    '/',
    route(async () => {
      const { InvestmentObject } = app.db;
      const where = {
        status: { [Op.in]: ['available', 'auction', 'upcoming'] },
        ...(process.env.INCLUDE_DEMO_DATA === 'true' ? {} : { isDemo: false }),
      };
      const [objects, auctions, upcoming, investment, sectorCounts] = await Promise.all([
        InvestmentObject.count({ where }),
        InvestmentObject.count({ where: { ...where, status: 'auction' } }),
        InvestmentObject.count({ where: { ...where, status: 'upcoming' } }),
        InvestmentObject.sum('investmentAmountUsd', { where }),
        Promise.all(
          [...sectors].map(async (sector) => [
            sector,
            await InvestmentObject.count({
              where: { ...where, sectors: { [Op.overlap]: [sector] } },
            }),
          ]),
        ),
      ]);
      return {
        objects,
        auctions,
        upcoming,
        investmentAmountUsd: Number(investment || 0),
        sectorCounts: Object.fromEntries(sectorCounts),
      };
    }),
  );
};
