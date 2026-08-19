'use strict';

const id = (Sequelize) => ({ type: Sequelize.UUID, primaryKey: true, allowNull: false });

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: id(Sequelize),
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.ENUM('investor'), allowNull: false, defaultValue: 'investor' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.createTable('investment_objects', {
      id: id(Sequelize),
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      type: { type: Sequelize.ENUM('land', 'building', 'proposal'), allowNull: false },
      status: { type: Sequelize.ENUM('available', 'auction', 'upcoming'), allowNull: false },
      district: { type: Sequelize.STRING, allowNull: false },
      cadastral_number: { type: Sequelize.STRING, allowNull: false, unique: true },
      latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: false },
      longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: false },
      land_area_ha: { type: Sequelize.DECIMAL(10, 2) },
      building_area_sqm: { type: Sequelize.DECIMAL(12, 2) },
      usable_area_sqm: { type: Sequelize.DECIMAL(12, 2) },
      investment_amount_usd: { type: Sequelize.DECIMAL(16, 2), allowNull: false },
      jobs_planned: { type: Sequelize.INTEGER },
      auction_url: { type: Sequelize.STRING },
      auction_starts_at: { type: Sequelize.DATE },
      sectors: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
      utilities: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      legal_details: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      construction_details: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      benefits: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.createTable('investment_object_translations', {
      id: id(Sequelize),
      investment_object_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'investment_objects', key: 'id' },
        onDelete: 'CASCADE',
      },
      locale: { type: Sequelize.ENUM('uz', 'ru'), allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      short_description: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      permitted_businesses: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addConstraint('investment_object_translations', {
      fields: ['investment_object_id', 'locale'],
      type: 'unique',
      name: 'object_translation_locale_unique',
    });

    await queryInterface.createTable('object_media', {
      id: id(Sequelize),
      investment_object_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'investment_objects', key: 'id' },
        onDelete: 'CASCADE',
      },
      kind: {
        type: Sequelize.ENUM('image', 'video', 'virtual_tour', 'document'),
        allowNull: false,
      },
      url: { type: Sequelize.STRING, allowNull: false },
      title: { type: Sequelize.STRING },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    for (const table of ['applications', 'favorites', 'notification_subscriptions']) {
      await queryInterface.createTable(table, {
        id: id(Sequelize),
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
        investment_object_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'investment_objects', key: 'id' },
          onDelete: 'CASCADE',
        },
        ...(table === 'applications'
          ? {
              name: { type: Sequelize.STRING, allowNull: false },
              phone: { type: Sequelize.STRING, allowNull: false },
              email: { type: Sequelize.STRING, allowNull: false },
              comment: { type: Sequelize.TEXT },
              status: {
                type: Sequelize.ENUM('received'),
                allowNull: false,
                defaultValue: 'received',
              },
            }
          : {}),
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      });
    }

    await queryInterface.addConstraint('favorites', {
      fields: ['user_id', 'investment_object_id'],
      type: 'unique',
      name: 'favorite_user_object_unique',
    });
    await queryInterface.addConstraint('notification_subscriptions', {
      fields: ['user_id', 'investment_object_id'],
      type: 'unique',
      name: 'subscription_user_object_unique',
    });
  },

  async down(queryInterface) {
    await Promise.all(
      [
        'notification_subscriptions',
        'favorites',
        'applications',
        'object_media',
        'investment_object_translations',
        'investment_objects',
        'users',
      ].map((table) => queryInterface.dropTable(table)),
    );
  },
};
