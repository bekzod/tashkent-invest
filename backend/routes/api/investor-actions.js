'use strict';

const route = require('../../utils/async-handler');
const ensureAuth = require('../../middleware/ensure-auth');
const { preview } = require('../../services/investment-object-presenter');
const {
  ApplicationWorkflowError,
  submitApplication,
} = require('../../services/application-workflow');

function pageOptions(query) {
  const page = Math.max(1, Number(query?.page || 1));
  const limit = Math.min(50, Math.max(1, Number(query?.limit || 10)));
  return { page, limit, offset: (page - 1) * limit };
}

function workflowError(request, reply, error) {
  if (error instanceof ApplicationWorkflowError) {
    return reply.code(error.statusCode).send({
      code: error.code,
      error: error.code,
      ...(Object.keys(error.fieldErrors).length ? { fieldErrors: error.fieldErrors } : {}),
    });
  }
  request.log.error(error);
  return reply
    .code(500)
    .send({ code: 'APPLICATION_CREATE_FAILED', error: 'APPLICATION_CREATE_FAILED' });
}

module.exports = async (app) => {
  app.post(
    '/applications',
    { preHandler: ensureAuth('investor') },
    route(async (request, reply) => {
      try {
        const { application, created } = await submitApplication(
          app.db,
          request.user.id,
          request.body || {},
        );
        if (created && app.telegramNotifier?.notifyNewApplication) {
          try {
            await app.telegramNotifier.notifyNewApplication(application.id);
          } catch {
            request.log.error(
              { event: 'telegram_application_notification_failed', applicationId: application.id },
              'Telegram application notification failed',
            );
          }
        }
        return reply.code(created ? 201 : 200).send({
          id: application.id,
          status: application.status,
          duplicate: !created,
        });
      } catch (error) {
        return workflowError(request, reply, error);
      }
    }),
  );

  app.get(
    '/me/applications',
    { preHandler: ensureAuth('investor') },
    route(async (request) => {
      const { page, limit, offset } = pageOptions(request.query);
      const { count, rows } = await app.db.Application.findAndCountAll({
        where: { userId: request.user.id },
        include: [
          {
            association: 'object',
            include: [{ association: 'translations' }, { association: 'media' }],
          },
        ],
        order: [['createdAt', 'DESC']],
        distinct: true,
        limit,
        offset,
      });
      return {
        items: rows.map((application) => ({
          id: application.id,
          status: application.status,
          createdAt: application.createdAt,
          reviewedAt: application.reviewedAt,
          reviewNote: application.reviewNote,
          object: preview(
            application.object,
            request.headers['accept-language']?.startsWith('ru') ? 'ru' : 'uz',
          ),
        })),
        meta: {
          page,
          limit,
          total: count,
          totalPages: Math.max(1, Math.ceil(count / limit)),
        },
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
