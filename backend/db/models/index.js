'use strict';

require('dotenv').config();

const { Sequelize, DataTypes } = require('sequelize');
const { databaseConnectionOptions } = require('../connection-options');

const sequelize = new Sequelize(
  process.env.DATABASE_URL ||
    'postgres://tashkent_invest:tashkent_invest@localhost:5432/tashkent_invest',
  databaseConnectionOptions(),
);

const db = {
  sequelize,
  Sequelize,
  User: require('./user')(sequelize, DataTypes),
  InvestmentObject: require('./investment-object')(sequelize, DataTypes),
  InvestmentObjectTranslation: require('./investment-object-translation')(sequelize, DataTypes),
  ObjectMedia: require('./object-media')(sequelize, DataTypes),
  Application: require('./application')(sequelize, DataTypes),
  Favorite: require('./favorite')(sequelize, DataTypes),
  NotificationSubscription: require('./notification-subscription')(sequelize, DataTypes),
  GeographicArea: require('./geographic-area')(sequelize, DataTypes),
};

Object.values(db)
  .filter((model) => typeof model?.associate === 'function')
  .forEach((model) => model.associate(db));

module.exports = db;
