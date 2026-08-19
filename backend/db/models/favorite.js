'use strict';

module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define(
    'Favorite',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
      investmentObjectId: { type: DataTypes.UUID, allowNull: false, field: 'investment_object_id' },
    },
    {
      tableName: 'favorites',
      underscored: true,
      indexes: [{ unique: true, fields: ['user_id', 'investment_object_id'] }],
    },
  );

  Favorite.associate = ({ User, InvestmentObject }) => {
    Favorite.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
    Favorite.belongsTo(InvestmentObject, { as: 'object', foreignKey: 'investment_object_id' });
  };

  return Favorite;
};
