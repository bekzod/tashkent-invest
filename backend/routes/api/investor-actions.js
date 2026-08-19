'use strict';

const route = require('../../utils/async-handler');
const ensureAuth = require('../../middleware/ensure-auth');
const { preview } = require('../../services/investment-object-presenter');

function required(body, fields) {
  return fields.every((field) => typeof body?.[field] === 'string' && body[field].trim());
}

module.exports = async (app) => {
  app.post(
    '/applications',
    { preHandler: ensureAuth() },
    route(async (request, reply) => {
      const {
        objectId,
        name,
        company,
        country,
        phone,
        email,
        telegram,
        investmentAmountUsd,
        projectDescription,
        comment,
      } = request.body || {};
      if (!objectId || !required(request.body, ['name', 'phone', 'email']))
        return reply.code(400).send({ error: 'Object, name, phone and email are required' });
      const object = await app.db.InvestmentObject.findByPk(objectId);
      if (!object) return reply.code(404).send({ error: 'Object not found' });
      const amount =
        investmentAmountUsd === undefined || investmentAmountUsd === ''
          ? null
          : Number(investmentAmountUsd);
      if (amount !== null && (!Number.isFinite(amount) || amount < 0))
        return reply.code(400).send({ error: 'Investment amount must be a positive number' });
      const application = await app.db.Application.create({
        userId: request.user.id,
        investmentObjectId: objectId,
        name: name.trim(),
        company: typeof company === 'string' ? company.trim() || null : null,
        country: typeof country === 'string' ? country.trim() || null : null,
        phone: phone.trim(),
        email: email.trim(),
        telegram: typeof telegram === 'string' ? telegram.trim() || null : null,
        investmentAmountUsd: amount,
        projectDescription:
          typeof projectDescription === 'string' ? projectDescription.trim() || null : null,
        comment: typeof comment === 'string' ? comment.trim() : null,
      });
      return reply.code(201).send({ id: application.id, status: application.status });
    }),
  );

  app.get(
    '/me/applications',
    { preHandler: ensureAuth() },
    route(async (request) => {
      const applications = await app.db.Application.findAll({
        where: { userId: request.user.id },
        include: [
          {
            association: 'object',
            include: [{ association: 'translations' }, { association: 'media' }],
          },
        ],
        order: [['createdAt', 'DESC']],
      });
      return {
        items: applications.map((application) => ({
          id: application.id,
          status: application.status,
          createdAt: application.createdAt,
          object: preview(
            application.object,
            request.headers['accept-language']?.startsWith('ru') ? 'ru' : 'uz',
          ),
        })),
      };
    }),
  );

  app.get(
    '/me/favorites',
    { preHandler: ensureAuth() },
    route(async (request) => {
      const favorites = await app.db.Favorite.findAll({
        where: { userId: request.user.id },
        include: [
          {
            association: 'object',
            include: [{ association: 'translations' }, { association: 'media' }],
          },
        ],
      });
      return {
        items: favorites.map((favorite) =>
          preview(
            favorite.object,
            request.headers['accept-language']?.startsWith('ru') ? 'ru' : 'uz',
          ),
        ),
      };
    }),
  );

  app.post(
    '/favorites/:objectId',
    { preHandler: ensureAuth() },
    route(async (request, reply) => {
      const object = await app.db.InvestmentObject.findByPk(request.params.objectId);
      if (!object) return reply.code(404).send({ error: 'Object not found' });
      const [favorite, created] = await app.db.Favorite.findOrCreate({
        where: { userId: request.user.id, investmentObjectId: object.id },
      });
      return reply.code(created ? 201 : 200).send({ id: favorite.id, created });
    }),
  );

  app.delete(
    '/favorites/:objectId',
    { preHandler: ensureAuth() },
    route(async (request, reply) => {
      const count = await app.db.Favorite.destroy({
        where: { userId: request.user.id, investmentObjectId: request.params.objectId },
      });
      if (!count) return reply.code(404).send({ error: 'Favorite not found' });
      return reply.code(204).send();
    }),
  );

  app.post(
    '/notification-subscriptions',
    { preHandler: ensureAuth() },
    route(async (request, reply) => {
      const { objectId } = request.body || {};
      if (!objectId) return reply.code(400).send({ error: 'Object is required' });
      const object = await app.db.InvestmentObject.findByPk(objectId);
      if (!object) return reply.code(404).send({ error: 'Object not found' });
      const [subscription, created] = await app.db.NotificationSubscription.findOrCreate({
        where: { userId: request.user.id, investmentObjectId: objectId },
      });
      return reply.code(created ? 201 : 200).send({ id: subscription.id, created });
    }),
  );
};
