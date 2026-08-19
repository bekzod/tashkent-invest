'use strict';

module.exports = (sequelize, DataTypes) => {
  const InvestmentObject = sequelize.define(
    'InvestmentObject',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      type: { type: DataTypes.ENUM('land', 'building', 'proposal'), allowNull: false },
      status: { type: DataTypes.ENUM('available', 'auction', 'upcoming'), allowNull: false },
      district: { type: DataTypes.STRING, allowNull: false },
      cadastralNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'cadastral_number',
      },
      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
      siteGeometry: { type: DataTypes.JSONB, allowNull: true, field: 'site_geometry' },
      landAreaHa: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'land_area_ha' },
      buildingAreaSqm: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        field: 'building_area_sqm',
      },
      usableAreaSqm: { type: DataTypes.DECIMAL(12, 2), allowNull: true, field: 'usable_area_sqm' },
      investmentAmountUsd: {
        type: DataTypes.DECIMAL(16, 2),
        allowNull: false,
        field: 'investment_amount_usd',
      },
      jobsPlanned: { type: DataTypes.INTEGER, allowNull: true, field: 'jobs_planned' },
      auctionUrl: { type: DataTypes.STRING, allowNull: true, field: 'auction_url' },
      auctionStartsAt: { type: DataTypes.DATE, allowNull: true, field: 'auction_starts_at' },
      sectors: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
      utilities: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      legalDetails: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      constructionDetails: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      benefits: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    },
    { tableName: 'investment_objects', underscored: true },
  );

  InvestmentObject.associate = ({
    InvestmentObjectTranslation,
    ObjectMedia,
    Application,
    Favorite,
    NotificationSubscription,
  }) => {
    InvestmentObject.hasMany(InvestmentObjectTranslation, {
      as: 'translations',
      foreignKey: 'investment_object_id',
    });
    InvestmentObject.hasMany(ObjectMedia, { as: 'media', foreignKey: 'investment_object_id' });
    InvestmentObject.hasMany(Application, {
      as: 'applications',
      foreignKey: 'investment_object_id',
    });
    InvestmentObject.hasMany(Favorite, { as: 'favorites', foreignKey: 'investment_object_id' });
    InvestmentObject.hasMany(NotificationSubscription, {
      as: 'notificationSubscriptions',
      foreignKey: 'investment_object_id',
    });
  };

  return InvestmentObject;
};
