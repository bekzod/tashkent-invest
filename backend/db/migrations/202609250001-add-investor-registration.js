'use strict';

const emailIndexName = 'users_email_lower_unique';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'consented_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'consent_policy_version', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'consent_locale', {
      type: Sequelize.STRING(2),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'email_verified_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX ${emailIndexName} ON users (LOWER(email))`,
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS ${emailIndexName}`);
    await queryInterface.removeColumn('users', 'email_verified_at');
    await queryInterface.removeColumn('users', 'consent_locale');
    await queryInterface.removeColumn('users', 'consent_policy_version');
    await queryInterface.removeColumn('users', 'consented_at');
  },
};
