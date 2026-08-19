'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('geographic_areas', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      parent_slug: { type: Sequelize.STRING, allowNull: true },
      kind: { type: Sequelize.STRING, allowNull: false },
      name_uz: { type: Sequelize.STRING, allowNull: false },
      name_ru: { type: Sequelize.STRING, allowNull: false },
      aliases: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
      geometry: { type: Sequelize.JSONB, allowNull: false },
      center_latitude: { type: Sequelize.DECIMAL(10, 7), allowNull: false },
      center_longitude: { type: Sequelize.DECIMAL(10, 7), allowNull: false },
      source: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('geographic_areas');
  },
};
