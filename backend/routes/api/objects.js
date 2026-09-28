'use strict';

const route = require('../../utils/async-handler');
const { Op } = require('sequelize');
const {
  parseFilters,
  buildPublicWhere,
  filterObjects,
  mapLimit,
} = require('../../services/investment-object-query');
const { feature, preview, detail } = require('../../services/investment-object-presenter');

function locale(request) {
  return request.headers['accept-language']?.startsWith('ru') || request.query.lang === 'ru'
    ? 'ru'
    : 'uz';
}
const include = [{ association: 'translations' }, { association: 'media' }];
const publicStatusWhere = { [Op.in]: ['available', 'auction', 'upcoming'] };

function publicWhere(filters, { indexable = false } = {}) {
  return buildPublicWhere(filters, {
    includeDemo: !indexable && process.env.INCLUDE_DEMO_DATA === 'true',
  });
}

async function resolveAreaPolygon(app, filters, areaSlug) {
  if (!areaSlug) return;
  if (!/^[a-z0-9-]+$/.test(areaSlug))
    throw Object.assign(new Error('Invalid area slug'), { statusCode: 400 });
  const area = await app.db.GeographicArea.findOne({ where: { slug: areaSlug } });
  const ring = area?.geometry?.type === 'Polygon' ? area.geometry.coordinates?.[0] : null;
  if (!ring?.length) throw Object.assign(new Error('Unknown geographic area'), { statusCode: 400 });
  filters.polygon = ring;
}

module.exports = async (app) => {
  app.get(
    '/',
    route(async (request) => {
      const requestLocale = locale(request);
      const filters = parseFilters(request.query);
      await resolveAreaPolygon(app, filters, request.query.areaSlug);
      const page = Math.max(1, Number(request.query.page || 1));
      const limit = Math.min(48, Math.max(1, Number(request.query.limit || 12)));
      const objects = filterObjects(
        await app.db.InvestmentObject.findAll({
          where: publicWhere(filters, { indexable: request.query.indexable === 'true' }),
          include,
          order: [['createdAt', 'DESC']],
        }),
        filters,
        requestLocale,
      );
      return {
        items: objects
          .slice((page - 1) * limit, page * limit)
          .map((object) => preview(object, requestLocale)),
        meta: { page, limit, total: objects.length },
      };
    }),
  );

  app.get(
    '/map',
    route(async (request) => {
      const requestLocale = locale(request);
      const filters = parseFilters(request.query);
      const limit = mapLimit(request.query.limit);
      await resolveAreaPolygon(app, filters, request.query.areaSlug);
      const objects = filterObjects(
        await app.db.InvestmentObject.findAll({
          where: publicWhere(filters),
          include,
          order: [['slug', 'ASC']],
        }),
        filters,
        requestLocale,
      ).slice(0, limit);
      return {
        type: 'FeatureCollection',
        features: objects.map((object) => feature(object, requestLocale)),
      };
    }),
  );

  app.get(
    '/:slug',
    route(async (request, reply) => {
      const object = await app.db.InvestmentObject.findOne({
        where: {
          slug: request.params.slug,
          status: publicStatusWhere,
          ...(process.env.INCLUDE_DEMO_DATA === 'true' ? {} : { isDemo: false }),
        },
        include,
      });
      if (!object) return reply.code(404).send({ error: 'Object not found' });
      return detail(object, locale(request));
    }),
  );
};
