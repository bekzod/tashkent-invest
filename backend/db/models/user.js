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
      role: { type: DataTypes.ENUM('investor'), allowNull: false, defaultValue: 'investor' },
    },
    { tableName: 'users', underscored: true },
  );

  User.associate = ({ Application, Favorite, NotificationSubscription }) => {
    User.hasMany(Application, { as: 'applications', foreignKey: 'user_id' });
    User.hasMany(Favorite, { as: 'favorites', foreignKey: 'user_id' });
    User.hasMany(NotificationSubscription, {
      as: 'notificationSubscriptions',
      foreignKey: 'user_id',
    });
  };

  return User;
};
