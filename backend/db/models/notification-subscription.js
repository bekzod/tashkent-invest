'use strict';

module.exports = (sequelize, DataTypes) => {
  const NotificationSubscription = sequelize.define(
    'NotificationSubscription',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      investmentObjectId: { type: DataTypes.UUID, allowNull: false, field: 'investment_object_id' },
    },
    {
      tableName: 'notification_subscriptions',
      underscored: true,
      indexes: [{ unique: true, fields: ['user_id', 'investment_object_id'] }],
    },
  );

  NotificationSubscription.associate = ({ User, InvestmentObject }) => {
    NotificationSubscription.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
    NotificationSubscription.belongsTo(InvestmentObject, {
      as: 'object',
      foreignKey: 'investment_object_id',
    });
  };

  return NotificationSubscription;
};
