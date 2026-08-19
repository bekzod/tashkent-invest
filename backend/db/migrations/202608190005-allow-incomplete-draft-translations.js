'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const column of ['title', 'short_description', 'description', 'address']) {
      await queryInterface.changeColumn('investment_object_translations', column, {
        type: column === 'description' ? Sequelize.TEXT : Sequelize.STRING,
        allowNull: true,
      });
    }
  },
  async down(queryInterface, Sequelize) {
    for (const column of ['title', 'short_description', 'description', 'address']) {
      await queryInterface.changeColumn('investment_object_translations', column, {
        type: column === 'description' ? Sequelize.TEXT : Sequelize.STRING,
        allowNull: false,
      });
    }
  },
};
