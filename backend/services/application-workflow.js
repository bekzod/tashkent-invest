'use strict';

const { Op } = require('sequelize');

const ACTIVE_APPLICATION_STATUSES = Object.freeze(['received', 'in_review', 'approved']);
const APPLICATION_STATUSES = Object.freeze([...ACTIVE_APPLICATION_STATUSES, 'rejected']);
const TRANSITIONS = Object.freeze({
  received: Object.freeze(['in_review']),
  in_review: Object.freeze(['approved', 'rejected']),
  approved: Object.freeze([]),
  rejected: Object.freeze([]),
});
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,24}$/;

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

class ApplicationWorkflowError extends Error {
  constructor(code, statusCode, fieldErrors = {}) {
    super(code);
    this.name = 'ApplicationWorkflowError';
    this.code = code;
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

function optionalText(value, maxLength) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return { error: true };
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) return { error: true };
  return normalized;
}

function validateApplicationPayload(body = {}) {
  const fieldErrors = {};
  const objectId = typeof body.objectId === 'string' ? body.objectId.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const company = optionalText(body.company, 160);
  const country = optionalText(body.country, 100);
  const telegram = optionalText(body.telegram, 80);
  const projectDescription = optionalText(body.projectDescription, 4_000);
  const comment = optionalText(body.comment, 2_000);

  if (!isUuid(objectId)) fieldErrors.objectId = 'INVALID_OBJECT_ID';
  if (name.length < 2 || name.length > 120) fieldErrors.name = 'INVALID_NAME';
  if (!PHONE_PATTERN.test(phone) || phone.replace(/\D/g, '').length < 7)
    fieldErrors.phone = 'INVALID_PHONE';
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) fieldErrors.email = 'INVALID_EMAIL';
  for (const [field, value] of Object.entries({
    company,
    country,
    telegram,
    projectDescription,
    comment,
  })) {
    if (value?.error) fieldErrors[field] = 'TOO_LONG';
  }

  let investmentAmountUsd = null;
  if (body.investmentAmountUsd !== undefined && body.investmentAmountUsd !== '') {
    investmentAmountUsd = Number(body.investmentAmountUsd);
    if (
      !Number.isFinite(investmentAmountUsd) ||
      investmentAmountUsd <= 0 ||
      investmentAmountUsd > 1_000_000_000_000
    ) {
      fieldErrors.investmentAmountUsd = 'INVALID_AMOUNT';
    }
  }

  if (Object.keys(fieldErrors).length)
    throw new ApplicationWorkflowError('INVALID_APPLICATION', 400, fieldErrors);

  return {
    objectId,
    name,
    phone,
    email,
    company,
    country,
    telegram,
    investmentAmountUsd,
    projectDescription,
    comment,
  };
}

async function submitApplication(db, userId, body) {
  const payload = validateApplicationPayload(body);
  const user = await db.User.findByPk(userId);
  if (!user || user.role !== 'investor') throw new ApplicationWorkflowError('INVESTOR_ONLY', 403);
  if (user.isActive === false) throw new ApplicationWorkflowError('ACCOUNT_INACTIVE', 403);

  const object = await db.InvestmentObject.findByPk(payload.objectId);
  if (!object) throw new ApplicationWorkflowError('OBJECT_NOT_FOUND', 404);
  if (object.status !== 'available')
    throw new ApplicationWorkflowError('OBJECT_NOT_AVAILABLE', 409);

  const existing = await db.Application.findOne({
    where: {
      userId,
      investmentObjectId: payload.objectId,
      status: { [Op.in]: ACTIVE_APPLICATION_STATUSES },
    },
  });
  if (existing) return { application: existing, created: false };

  try {
    let application;
    await db.sequelize.transaction(async (transaction) => {
      application = await db.Application.create(
        {
          userId,
          investmentObjectId: payload.objectId,
          ...Object.fromEntries(Object.entries(payload).filter(([key]) => key !== 'objectId')),
          status: 'received',
        },
        { transaction },
      );
      await db.ApplicationStatusHistory.create(
        {
          applicationId: application.id,
          fromStatus: null,
          toStatus: 'received',
          changedByUserId: userId,
        },
        { transaction },
      );
    });
    return { application, created: true };
  } catch (error) {
    if (error?.name === 'SequelizeUniqueConstraintError') {
      const concurrent = await db.Application.findOne({
        where: {
          userId,
          investmentObjectId: payload.objectId,
          status: { [Op.in]: ACTIVE_APPLICATION_STATUSES },
        },
      });
      if (concurrent) return { application: concurrent, created: false };
    }
    throw new ApplicationWorkflowError('APPLICATION_CREATE_FAILED', 500);
  }
}

function normalizeReviewPayload(body = {}) {
  const status = typeof body.status === 'string' ? body.status.trim() : '';
  const note = optionalText(body.note, 2_000);
  const fieldErrors = {};
  if (!APPLICATION_STATUSES.includes(status) || status === 'received')
    fieldErrors.status = 'INVALID_STATUS';
  if (note?.error) fieldErrors.note = 'TOO_LONG';
  if (Object.keys(fieldErrors).length)
    throw new ApplicationWorkflowError('INVALID_REVIEW', 400, fieldErrors);
  return { status, note };
}

async function transitionApplication(db, application, reviewerUserId, body) {
  const { status, note } = normalizeReviewPayload(body);
  if (!TRANSITIONS[application.status]?.includes(status))
    throw new ApplicationWorkflowError('INVALID_TRANSITION', 409);

  const fromStatus = application.status;
  const reviewedAt = new Date();
  await db.sequelize.transaction(async (transaction) => {
    await application.update(
      {
        status,
        reviewerUserId,
        reviewedAt,
        reviewNote: note,
      },
      { transaction },
    );
    await db.ApplicationStatusHistory.create(
      {
        applicationId: application.id,
        fromStatus,
        toStatus: status,
        changedByUserId: reviewerUserId,
        note,
      },
      { transaction },
    );
  });
  return application;
}

module.exports = {
  ACTIVE_APPLICATION_STATUSES,
  APPLICATION_STATUSES,
  TRANSITIONS,
  ApplicationWorkflowError,
  isUuid,
  normalizeReviewPayload,
  submitApplication,
  transitionApplication,
  validateApplicationPayload,
};
