'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('investment_objects', 'is_demo', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.sequelize.query(
      `UPDATE investment_objects
       SET is_demo = TRUE
       WHERE slug ~ '^tashkent-invest-[0-9]+$'`,
    );
    await queryInterface.addIndex('investment_objects', ['is_demo', 'status'], {
      name: 'investment_objects_public_inventory_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'investment_objects',
      'investment_objects_public_inventory_idx',
    );
    await queryInterface.removeColumn('investment_objects', 'is_demo');
  },
};
