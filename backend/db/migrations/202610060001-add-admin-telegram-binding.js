'use strict';

const chatIdIndex = 'users_telegram_chat_id_unique';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'telegram_chat_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'telegram_link_token_hash', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'telegram_link_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'telegram_linked_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addIndex('users', ['telegram_chat_id'], {
      name: chatIdIndex,
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', chatIdIndex);
    await queryInterface.removeColumn('users', 'telegram_linked_at');
    await queryInterface.removeColumn('users', 'telegram_link_expires_at');
    await queryInterface.removeColumn('users', 'telegram_link_token_hash');
    await queryInterface.removeColumn('users', 'telegram_chat_id');
  },
};
