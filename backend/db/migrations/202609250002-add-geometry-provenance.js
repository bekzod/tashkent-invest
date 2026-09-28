'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('investment_objects', 'geometry_source', {
      type: Sequelize.ENUM('surveyed', 'cadastral', 'admin_drawn', 'estimated', 'demo'),
      allowNull: true,
    });
    // A source cannot be reconstructed for legacy geometry. Mark it as estimated
    // so clients never present it as a surveyed/cadastral lot boundary. The
    // is_demo column is introduced by a later migration and the guarded E2E seed
    // explicitly upgrades its known fixture boundary to `demo`.
    await queryInterface.sequelize.query(`
      UPDATE investment_objects
      SET geometry_source = 'estimated'
      WHERE site_geometry IS NOT NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('investment_objects', 'geometry_source');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_investment_objects_geometry_source";',
    );
  },
};
