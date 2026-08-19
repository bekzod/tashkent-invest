'use strict';

module.exports = (sequelize, DataTypes) => {
  const ObjectMedia = sequelize.define(
    'ObjectMedia',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      investmentObjectId: { type: DataTypes.UUID, allowNull: false, field: 'investment_object_id' },
      kind: {
        type: DataTypes.ENUM('image', 'video', 'virtual_tour', 'document'),
        allowNull: false,
      },
      url: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: true },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
      },
    },
    { tableName: 'object_media', underscored: true },
  );

  ObjectMedia.associate = ({ InvestmentObject }) => {
    ObjectMedia.belongsTo(InvestmentObject, { as: 'object', foreignKey: 'investment_object_id' });
  };

  return ObjectMedia;
};
