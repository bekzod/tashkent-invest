'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('applications', 'company', { type: Sequelize.STRING });
    await queryInterface.addColumn('applications', 'country', { type: Sequelize.STRING });
    await queryInterface.addColumn('applications', 'telegram', { type: Sequelize.STRING });
    await queryInterface.addColumn('applications', 'investment_amount_usd', {
      type: Sequelize.DECIMAL(16, 2),
    });
    await queryInterface.addColumn('applications', 'project_description', { type: Sequelize.TEXT });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('applications', 'project_description');
    await queryInterface.removeColumn('applications', 'investment_amount_usd');
    await queryInterface.removeColumn('applications', 'telegram');
    await queryInterface.removeColumn('applications', 'country');
    await queryInterface.removeColumn('applications', 'company');
  },
};
