'use strict';

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'GeographicArea',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      parentSlug: { type: DataTypes.STRING, allowNull: true, field: 'parent_slug' },
      kind: { type: DataTypes.STRING, allowNull: false },
      nameUz: { type: DataTypes.STRING, allowNull: false, field: 'name_uz' },
      nameRu: { type: DataTypes.STRING, allowNull: false, field: 'name_ru' },
      aliases: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
      geometry: { type: DataTypes.JSONB, allowNull: false },
      centerLatitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false,
        field: 'center_latitude',
      },
      centerLongitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false,
        field: 'center_longitude',
      },
      source: { type: DataTypes.STRING, allowNull: false },
    },
    { tableName: 'geographic_areas', underscored: true },
  );
