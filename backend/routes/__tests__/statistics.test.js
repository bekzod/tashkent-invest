'use strict';

const Fastify = require('fastify');
const { test, expect } = require('bun:test');
const { Op } = require('sequelize');
const statisticsRoutes = require('../api/statistics');
const { sectors } = require('../../services/investment-object-query');

test('statistics count each sector with the same public and demo filters as totals', async () => {
  const originalIncludeDemo = process.env.INCLUDE_DEMO_DATA;
  delete process.env.INCLUDE_DEMO_DATA;
  const app = Fastify({ logger: false });
  const queriedSectors = [];
  app.decorate('db', {
    InvestmentObject: {
      count: async ({ where }) => {
        expect(where.isDemo).toBe(false);
        if (where.sectors) {
          expect(where.status[Op.in]).toEqual(['available', 'auction', 'upcoming']);
          const [sector] = where.sectors[Op.overlap];
          queriedSectors.push(sector);
          return { manufacturing: 3, logistics: 2 }[sector] || 0;
        }
        return typeof where.status === 'string' ? 1 : 4;
      },
      sum: async () => '1234.50',
    },
  });

  try {
    await app.register(statisticsRoutes, { prefix: '/api/statistics' });
    const response = await app.inject('/api/statistics');
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      objects: 4,
      auctions: 1,
      upcoming: 1,
      investmentAmountUsd: 1234.5,
      sectorCounts: {
        manufacturing: 3,
        logistics: 2,
        tourism: 0,
        trade: 0,
        it: 0,
        agriculture: 0,
        construction: 0,
        energy: 0,
      },
    });
    expect(queriedSectors).toEqual([...sectors]);
  } finally {
    await app.close();
    if (originalIncludeDemo === undefined) delete process.env.INCLUDE_DEMO_DATA;
    else process.env.INCLUDE_DEMO_DATA = originalIncludeDemo;
  }
});
