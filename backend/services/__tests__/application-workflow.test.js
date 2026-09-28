'use strict';

const { describe, expect, test } = require('bun:test');
const {
  ApplicationWorkflowError,
  submitApplication,
  transitionApplication,
  validateApplicationPayload,
} = require('../application-workflow');

const objectId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const reviewerId = '33333333-3333-4333-8333-333333333333';
const validPayload = {
  objectId,
  name: '  Demo   Investor ',
  phone: '+998 90 123-45-67',
  email: ' DEMO@EXAMPLE.UZ ',
  investmentAmountUsd: '150000.50',
  projectDescription: 'Logistika loyihasi',
};

function fakeDatabase({ objectStatus = 'available', existing = null } = {}) {
  const history = [];
  const created = [];
  return {
    history,
    created,
    sequelize: { transaction: async (callback) => callback({ id: 'transaction' }) },
    User: { findByPk: async () => ({ id: userId, role: 'investor', isActive: true }) },
    InvestmentObject: { findByPk: async () => ({ id: objectId, status: objectStatus }) },
    Application: {
      findOne: async () => existing,
      create: async (values) => {
        const application = { id: 'application-1', ...values };
        created.push(application);
        return application;
      },
    },
    ApplicationStatusHistory: {
      create: async (values) => {
        history.push(values);
        return values;
      },
    },
  };
}

describe('application workflow', () => {
  test('normalizes valid application data and rejects unsafe boundaries', () => {
    expect(validateApplicationPayload(validPayload)).toMatchObject({
      objectId,
      name: 'Demo Investor',
      email: 'demo@example.uz',
      investmentAmountUsd: 150000.5,
    });

    try {
      validateApplicationPayload({ objectId: 'bad', name: 'X', phone: '12', email: 'bad' });
      throw new Error('expected validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationWorkflowError);
      expect(error.code).toBe('INVALID_APPLICATION');
      expect(error.fieldErrors).toEqual({
        objectId: 'INVALID_OBJECT_ID',
        name: 'INVALID_NAME',
        phone: 'INVALID_PHONE',
        email: 'INVALID_EMAIL',
      });
    }
  });

  test('allows only active investors and available objects', async () => {
    const inactive = fakeDatabase();
    inactive.User.findByPk = async () => ({ id: userId, role: 'investor', isActive: false });
    expect(submitApplication(inactive, userId, validPayload)).rejects.toMatchObject({
      code: 'ACCOUNT_INACTIVE',
    });

    const admin = fakeDatabase();
    admin.User.findByPk = async () => ({ id: userId, role: 'admin', isActive: true });
    expect(submitApplication(admin, userId, validPayload)).rejects.toMatchObject({
      code: 'INVESTOR_ONLY',
    });

    expect(
      submitApplication(fakeDatabase({ objectStatus: 'upcoming' }), userId, validPayload),
    ).rejects.toMatchObject({ code: 'OBJECT_NOT_AVAILABLE' });
  });

  test('creates an initial audit entry and treats an active duplicate idempotently', async () => {
    const db = fakeDatabase();
    const result = await submitApplication(db, userId, validPayload);
    expect(result.created).toBe(true);
    expect(result.application.status).toBe('received');
    expect(db.history).toEqual([
      {
        applicationId: 'application-1',
        fromStatus: null,
        toStatus: 'received',
        changedByUserId: userId,
      },
    ]);

    const duplicate = { id: 'application-existing', status: 'in_review' };
    const duplicateResult = await submitApplication(
      fakeDatabase({ existing: duplicate }),
      userId,
      validPayload,
    );
    expect(duplicateResult).toEqual({ application: duplicate, created: false });
  });

  test('enforces received -> in_review -> approved or rejected and audits reviewers', async () => {
    const db = fakeDatabase();
    const application = {
      id: 'application-1',
      status: 'received',
      async update(values) {
        Object.assign(this, values);
      },
    };
    await transitionApplication(db, application, reviewerId, {
      status: 'in_review',
      note: 'Tekshiruv',
    });
    expect(application).toMatchObject({ status: 'in_review', reviewerUserId: reviewerId });
    expect(db.history.at(-1)).toMatchObject({
      fromStatus: 'received',
      toStatus: 'in_review',
      changedByUserId: reviewerId,
      note: 'Tekshiruv',
    });
    await transitionApplication(db, application, reviewerId, { status: 'approved' });
    expect(application.status).toBe('approved');
    expect(
      transitionApplication(db, application, reviewerId, { status: 'rejected' }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });
});
