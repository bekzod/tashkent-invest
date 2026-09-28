'use strict';

module.exports = (sequelize, DataTypes) => {
  const ApplicationStatusHistory = sequelize.define(
    'ApplicationStatusHistory',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      applicationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'application_id',
      },
      fromStatus: { type: DataTypes.STRING(32), allowNull: true, field: 'from_status' },
      toStatus: { type: DataTypes.STRING(32), allowNull: false, field: 'to_status' },
      changedByUserId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'changed_by_user_id',
      },
      note: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'application_status_history', underscored: true },
  );

  ApplicationStatusHistory.associate = ({ Application, User }) => {
    ApplicationStatusHistory.belongsTo(Application, {
      as: 'application',
      foreignKey: 'application_id',
    });
    ApplicationStatusHistory.belongsTo(User, {
      as: 'changedBy',
      foreignKey: 'changed_by_user_id',
    });
  };

  return ApplicationStatusHistory;
};
