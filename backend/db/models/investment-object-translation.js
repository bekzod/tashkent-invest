'use strict';

module.exports = (sequelize, DataTypes) => {
  const InvestmentObjectTranslation = sequelize.define(
    'InvestmentObjectTranslation',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      investmentObjectId: { type: DataTypes.UUID, allowNull: false, field: 'investment_object_id' },
      locale: { type: DataTypes.ENUM('uz', 'ru'), allowNull: false },
      title: { type: DataTypes.STRING, allowNull: true },
      shortDescription: { type: DataTypes.STRING, allowNull: true, field: 'short_description' },
      description: { type: DataTypes.TEXT, allowNull: true },
      address: { type: DataTypes.STRING, allowNull: true },
      permittedBusinesses: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
        field: 'permitted_businesses',
      },
    },
    {
      tableName: 'investment_object_translations',
      underscored: true,
      indexes: [{ unique: true, fields: ['investment_object_id', 'locale'] }],
    },
  );

  InvestmentObjectTranslation.associate = ({ InvestmentObject }) => {
    InvestmentObjectTranslation.belongsTo(InvestmentObject, {
      as: 'object',
      foreignKey: 'investment_object_id',
    });
  };

  return InvestmentObjectTranslation;
};
