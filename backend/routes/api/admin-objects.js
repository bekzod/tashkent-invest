'use strict';

const { randomUUID } = require('node:crypto');
const { Op } = require('sequelize');
const route = require('../../utils/async-handler');
const ensureAuth = require('../../middleware/ensure-auth');
const { normalizeObjectPayload } = require('../../services/admin-object-payload');

const include = [{ association: 'translations' }, { association: 'media' }];
const coreFields = [
  'slug',
  'type',
  'status',
  'district',
  'cadastralNumber',
  'latitude',
  'longitude',
  'siteGeometry',
  'landAreaHa',
  'buildingAreaSqm',
  'usableAreaSqm',
  'investmentAmountUsd',
  'jobsPlanned',
  'auctionUrl',
  'auctionStartsAt',
  'sectors',
  'utilities',
  'legalDetails',
  'constructionDetails',
  'benefits',
];

function slugPart(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

async function uniqueSlug(app, desired, currentId, transaction) {
  const base = slugPart(desired) || `draft-${randomUUID().slice(0, 8)}`;
  let candidate = base;
  let index = 2;
  while (
    await app.db.InvestmentObject.findOne({
      where: { slug: candidate, ...(currentId ? { id: { [Op.ne]: currentId } } : {}) },
      transaction,
    })
  ) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
}

function objectValues(payload) {
  return Object.fromEntries(
    coreFields
      .filter((field) => payload[field] !== undefined)
      .map((field) => [field, payload[field]]),
  );
}

async function replaceTranslations(app, objectId, translations, transaction) {
  if (!Object.keys(translations).length) return;
  await app.db.InvestmentObjectTranslation.destroy({
    where: { investmentObjectId: objectId },
    transaction,
  });
  await app.db.InvestmentObjectTranslation.bulkCreate(
    Object.entries(translations).map(([locale, translation]) => ({
      investmentObjectId: objectId,
      locale,
      ...translation,
    })),
    { transaction },
  );
}

async function replaceMedia(app, objectId, media, transaction) {
  await app.db.ObjectMedia.destroy({ where: { investmentObjectId: objectId }, transaction });
  if (!media.length) return;
  await app.db.ObjectMedia.bulkCreate(
    media.map((item) => ({ investmentObjectId: objectId, ...item })),
    { transaction },
  );
}

function pageOptions(query) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 10)));
  return { page, limit, offset: (page - 1) * limit };
}

async function listWhere(app, query) {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;
  if (query.q) {
    const q = String(query.q).trim();
    if (!q) return where;
    const translations = await app.db.InvestmentObjectTranslation.findAll({
      attributes: ['investmentObjectId'],
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${q}%` } },
          { address: { [Op.iLike]: `%${q}%` } },
        ],
      },
      raw: true,
    });
    const translationIds = translations.map((item) => item.investmentObjectId);
    where[Op.or] = [
      { slug: { [Op.iLike]: `%${q}%` } },
      { district: { [Op.iLike]: `%${q}%` } },
      { cadastralNumber: { [Op.iLike]: `%${q}%` } },
      ...(translationIds.length ? [{ id: { [Op.in]: translationIds } }] : []),
    ];
  }
  return where;
}

module.exports = async (app) => {
  app.get(
    '/objects',
    { preHandler: ensureAuth('admin') },
    route(async (request) => {
      const { page, limit, offset } = pageOptions(request.query);
      const { count, rows } = await app.db.InvestmentObject.findAndCountAll({
        where: await listWhere(app, request.query),
        include,
        distinct: true,
        order: [['updatedAt', 'DESC']],
        limit,
        offset,
      });
      return {
        items: rows,
        meta: {
          page,
          limit,
          total: count,
          totalPages: Math.max(1, Math.ceil(count / limit)),
        },
      };
    }),
  );

  app.post(
    '/objects',
    { preHandler: ensureAuth('admin') },
    route(async (request, reply) => {
      const payload = normalizeObjectPayload(request.body);
      const object = await app.db.sequelize.transaction(async (transaction) => {
        const slug = await uniqueSlug(
          app,
          payload.slug || payload.translations.uz?.title,
          undefined,
          transaction,
        );
        const created = await app.db.InvestmentObject.create(
          { ...objectValues(payload), slug },
          { transaction },
        );
        await replaceTranslations(app, created.id, payload.translations, transaction);
        if (Object.hasOwn(request.body || {}, 'media'))
          await replaceMedia(app, created.id, payload.media, transaction);
        return created;
      });
      const result = await app.db.InvestmentObject.findByPk(object.id, { include });
      return reply.code(201).send(result);
    }),
  );

  app.get(
    '/objects/:id',
    { preHandler: ensureAuth('admin') },
    route(async (request, reply) => {
      const object = await app.db.InvestmentObject.findByPk(request.params.id, { include });
      if (!object) return reply.code(404).send({ error: 'Object not found' });
      return object;
    }),
  );

  app.put(
    '/objects/:id',
    { preHandler: ensureAuth('admin') },
    route(async (request, reply) => {
      const payload = normalizeObjectPayload(request.body);
      const object = await app.db.InvestmentObject.findByPk(request.params.id);
      if (!object) return reply.code(404).send({ error: 'Object not found' });
      await app.db.sequelize.transaction(async (transaction) => {
        const values = objectValues(payload);
        if (payload.slug || (!object.slug && payload.translations.uz?.title))
          values.slug = await uniqueSlug(
            app,
            payload.slug || payload.translations.uz?.title,
            object.id,
            transaction,
          );
        await object.update(values, { transaction });
        if (Object.hasOwn(request.body || {}, 'translations'))
          await replaceTranslations(app, object.id, payload.translations, transaction);
        if (Object.hasOwn(request.body || {}, 'media'))
          await replaceMedia(app, object.id, payload.media, transaction);
      });
      return app.db.InvestmentObject.findByPk(object.id, { include });
    }),
  );

  app.delete(
    '/objects/:id',
    { preHandler: ensureAuth('admin') },
    route(async (request, reply) => {
      const object = await app.db.InvestmentObject.findByPk(request.params.id);
      if (!object) return reply.code(404).send({ error: 'Object not found' });
      await object.update({ status: 'archived' });
      return reply.code(204).send();
    }),
  );
};
