'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TYPE enum_applications_status ADD VALUE IF NOT EXISTS 'in_review'",
    );
    await queryInterface.sequelize.query(
      "ALTER TYPE enum_applications_status ADD VALUE IF NOT EXISTS 'approved'",
    );
    await queryInterface.sequelize.query(
      "ALTER TYPE enum_applications_status ADD VALUE IF NOT EXISTS 'rejected'",
    );

    await queryInterface.addColumn('users', 'is_active', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('applications', 'reviewer_user_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('applications', 'reviewed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('applications', 'review_note', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.createTable('application_status_history', {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      application_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      from_status: { type: Sequelize.STRING(32), allowNull: true },
      to_status: { type: Sequelize.STRING(32), allowNull: false },
      changed_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      note: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // Preserve the latest active request if an older deployment accepted duplicates.
    await queryInterface.sequelize.query(`
      WITH duplicates AS (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY user_id, investment_object_id
            ORDER BY created_at DESC, id DESC
          ) AS position
        FROM applications
        WHERE status IN ('received', 'in_review', 'approved')
      )
      UPDATE applications
      SET status = 'rejected',
          review_note = 'Closed automatically while enabling duplicate protection',
          reviewed_at = NOW(),
          updated_at = NOW()
      WHERE id IN (SELECT id FROM duplicates WHERE position > 1)
    `);
    await queryInterface.addIndex('applications', ['user_id', 'investment_object_id'], {
      name: 'applications_one_active_per_investor_object',
      unique: true,
      where: { status: ['received', 'in_review', 'approved'] },
    });
    await queryInterface.addIndex('applications', ['status', 'created_at'], {
      name: 'applications_admin_inbox_status_created_at',
    });
    await queryInterface.addIndex('application_status_history', ['application_id', 'created_at'], {
      name: 'application_history_application_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'application_status_history',
      'application_history_application_created_at',
    );
    await queryInterface.removeIndex('applications', 'applications_admin_inbox_status_created_at');
    await queryInterface.removeIndex('applications', 'applications_one_active_per_investor_object');
    await queryInterface.dropTable('application_status_history');
    await queryInterface.removeColumn('applications', 'review_note');
    await queryInterface.removeColumn('applications', 'reviewed_at');
    await queryInterface.removeColumn('applications', 'reviewer_user_id');
    await queryInterface.removeColumn('users', 'is_active');
  },
};
