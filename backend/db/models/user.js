'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      name: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      passwordHash: { type: DataTypes.STRING, allowNull: false, field: 'password_hash' },
      role: {
        type: DataTypes.ENUM('investor', 'admin'),
        allowNull: false,
        defaultValue: 'investor',
      },
      consentedAt: { type: DataTypes.DATE, allowNull: true, field: 'consented_at' },
      consentPolicyVersion: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'consent_policy_version',
      },
      consentLocale: {
        type: DataTypes.STRING(2),
        allowNull: true,
        field: 'consent_locale',
        validate: { isIn: [['uz', 'ru']] },
      },
      emailVerifiedAt: { type: DataTypes.DATE, allowNull: true, field: 'email_verified_at' },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
    },
    { tableName: 'users', underscored: true },
  );

  User.associate = ({
    Application,
    ApplicationStatusHistory,
    Favorite,
    NotificationSubscription,
  }) => {
    User.hasMany(Application, { as: 'applications', foreignKey: 'user_id' });
    User.hasMany(Favorite, { as: 'favorites', foreignKey: 'user_id' });
    User.hasMany(NotificationSubscription, {
      as: 'notificationSubscriptions',
      foreignKey: 'user_id',
    });
    User.hasMany(Application, { as: 'reviewedApplications', foreignKey: 'reviewer_user_id' });
    User.hasMany(ApplicationStatusHistory, {
      as: 'applicationStatusChanges',
      foreignKey: 'changed_by_user_id',
    });
  };

  return User;
};
