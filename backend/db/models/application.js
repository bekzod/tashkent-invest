'use strict';

module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define(
    'Application',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      investmentObjectId: { type: DataTypes.UUID, allowNull: false, field: 'investment_object_id' },
      name: { type: DataTypes.STRING, allowNull: false },
      company: { type: DataTypes.STRING, allowNull: true },
      country: { type: DataTypes.STRING, allowNull: true },
      phone: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      telegram: { type: DataTypes.STRING, allowNull: true },
      investmentAmountUsd: {
        type: DataTypes.DECIMAL(16, 2),
        allowNull: true,
        field: 'investment_amount_usd',
      },
      projectDescription: { type: DataTypes.TEXT, allowNull: true, field: 'project_description' },
      comment: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM('received', 'in_review', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'received',
      },
      reviewerUserId: { type: DataTypes.UUID, allowNull: true, field: 'reviewer_user_id' },
      reviewedAt: { type: DataTypes.DATE, allowNull: true, field: 'reviewed_at' },
      reviewNote: { type: DataTypes.TEXT, allowNull: true, field: 'review_note' },
    },
    { tableName: 'applications', underscored: true },
  );

  Application.associate = ({ User, InvestmentObject, ApplicationStatusHistory }) => {
    Application.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
    Application.belongsTo(InvestmentObject, { as: 'object', foreignKey: 'investment_object_id' });
    Application.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewer_user_id' });
    Application.hasMany(ApplicationStatusHistory, {
      as: 'history',
      foreignKey: 'application_id',
    });
  };

  return Application;
};
