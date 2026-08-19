'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS \'admin\'',
    );
    await queryInterface.sequelize.query(
      'ALTER TYPE "enum_investment_objects_status" ADD VALUE IF NOT EXISTS \'draft\'',
    );
    await queryInterface.sequelize.query(
      'ALTER TYPE "enum_investment_objects_status" ADD VALUE IF NOT EXISTS \'archived\'',
    );

    for (const column of [
      'slug',
      'type',
      'district',
      'cadastral_number',
      'latitude',
      'longitude',
      'investment_amount_usd',
    ]) {
      await queryInterface.changeColumn('investment_objects', column, {
        type:
          column === 'latitude' || column === 'longitude'
            ? Sequelize.DECIMAL(10, 7)
            : column === 'investment_amount_usd'
              ? Sequelize.DECIMAL(16, 2)
              : column === 'type'
                ? Sequelize.ENUM('land', 'building', 'proposal')
                : Sequelize.STRING,
        allowNull: true,
      });
    }
    await queryInterface.changeColumn('investment_objects', 'status', {
      type: Sequelize.ENUM('available', 'auction', 'upcoming', 'draft', 'archived'),
      allowNull: false,
      defaultValue: 'draft',
    });
  },

  async down() {
    throw new Error(
      'Admin object workflow migration is not safely reversible after enum values are added',
    );
  },
};
