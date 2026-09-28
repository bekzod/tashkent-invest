'use strict';

const route = require('../../utils/async-handler');
const ensureAuth = require('../../middleware/ensure-auth');
const { preview } = require('../../services/investment-object-presenter');
const {
  APPLICATION_STATUSES,
  ApplicationWorkflowError,
  isUuid,
  transitionApplication,
} = require('../../services/application-workflow');

const include = [
  { association: 'user', attributes: ['id', 'name', 'email'] },
  { association: 'reviewer', attributes: ['id', 'name', 'email'] },
  {
    association: 'object',
    include: [{ association: 'translations' }, { association: 'media' }],
  },
];

function locale(request) {
  return request.headers['accept-language']?.startsWith('ru') ? 'ru' : 'uz';
}

function pageOptions(query) {
  const page = Math.max(1, Number(query?.page || 1));
  const limit = Math.min(50, Math.max(1, Number(query?.limit || 20)));
  return { page, limit, offset: (page - 1) * limit };
}

function serialize(application, requestLocale, withHistory = false) {
  return {
    id: application.id,
    status: application.status,
    name: application.name,
    company: application.company,
    country: application.country,
    phone: application.phone,
    email: application.email,
    telegram: application.telegram,
    investmentAmountUsd:
      application.investmentAmountUsd == null ? null : Number(application.investmentAmountUsd),
    projectDescription: application.projectDescription,
    comment: application.comment,
    createdAt: application.createdAt,
    reviewedAt: application.reviewedAt,
    reviewNote: application.reviewNote,
    user: application.user,
    reviewer: application.reviewer,
    object: preview(application.object, requestLocale),
    ...(withHistory
      ? {
          history: (application.history || []).map((entry) => ({
            id: entry.id,
            fromStatus: entry.fromStatus,
            toStatus: entry.toStatus,
            note: entry.note,
            createdAt: entry.createdAt,
            changedBy: entry.changedBy,
          })),
        }
      : {}),
  };
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
    .send({ code: 'APPLICATION_REVIEW_FAILED', error: 'APPLICATION_REVIEW_FAILED' });
}

module.exports = async (app) => {
  app.get(
    '/applications',
    { preHandler: ensureAuth('admin') },
    route(async (request, reply) => {
      const { page, limit, offset } = pageOptions(request.query);
      const where = {};
      if (request.query.status) {
        if (!APPLICATION_STATUSES.includes(request.query.status))
          return reply.code(400).send({ code: 'INVALID_STATUS', error: 'INVALID_STATUS' });
        where.status = request.query.status;
      }
      const { count, rows } = await app.db.Application.findAndCountAll({
        where,
        include,
        distinct: true,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });
      return {
        items: rows.map((application) => serialize(application, locale(request))),
        meta: { page, limit, total: count, totalPages: Math.max(1, Math.ceil(count / limit)) },
      };
    }),
  );

  app.get(
    '/applications/:id',
    { preHandler: ensureAuth('admin') },
    route(async (request, reply) => {
      if (!isUuid(request.params.id))
        return reply
          .code(400)
          .send({ code: 'INVALID_APPLICATION_ID', error: 'INVALID_APPLICATION_ID' });
      const application = await app.db.Application.findByPk(request.params.id, {
        include: [
          ...include,
          {
            association: 'history',
            include: [{ association: 'changedBy', attributes: ['id', 'name', 'email'] }],
          },
        ],
        order: [[{ model: app.db.ApplicationStatusHistory, as: 'history' }, 'createdAt', 'ASC']],
      });
      if (!application)
        return reply
          .code(404)
          .send({ code: 'APPLICATION_NOT_FOUND', error: 'APPLICATION_NOT_FOUND' });
      return serialize(application, locale(request), true);
    }),
  );

  app.put(
    '/applications/:id/status',
    { preHandler: ensureAuth('admin') },
    route(async (request, reply) => {
      try {
        if (!isUuid(request.params.id))
          throw new ApplicationWorkflowError('INVALID_APPLICATION_ID', 400);
        const application = await app.db.Application.findByPk(request.params.id);
        if (!application) throw new ApplicationWorkflowError('APPLICATION_NOT_FOUND', 404);
        await transitionApplication(app.db, application, request.user.id, request.body || {});
        const updated = await app.db.Application.findByPk(application.id, { include });
        return serialize(updated, locale(request));
      } catch (error) {
        return workflowError(request, reply, error);
      }
    }),
  );
};
