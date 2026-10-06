'use strict';

const { Op } = require('sequelize');
const route = require('../utils/async-handler');
const {
  chatId,
  hashLinkToken,
  startToken,
  validWebhookSecret,
} = require('../services/admin-telegram-link');

module.exports = async (app) => {
  app.post(
    '/telegram/webhook',
    route(async (request, reply) => {
      if (
        !validWebhookSecret(
          request.headers['x-telegram-bot-api-secret-token'],
          process.env.TELEGRAM_WEBHOOK_SECRET,
        )
      ) {
        return reply.code(401).send({ ok: false });
      }

      const token = startToken(request.body);
      const incomingChatId = chatId(request.body);
      if (!token || !incomingChatId) return { ok: true };

      const admin = await app.db.User.findOne({
        where: {
          role: 'admin',
          isActive: true,
          telegramLinkTokenHash: hashLinkToken(token),
          telegramLinkExpiresAt: { [Op.gt]: new Date() },
        },
      });
      if (!admin) return { ok: true };

      const linkedAt = new Date();
      await app.db.sequelize.transaction(async (transaction) => {
        await app.db.User.update(
          { telegramChatId: null, telegramLinkedAt: null },
          {
            where: { role: 'admin', id: { [Op.ne]: admin.id } },
            transaction,
          },
        );
        await admin.update(
          {
            telegramChatId: incomingChatId,
            telegramLinkedAt: linkedAt,
            telegramLinkTokenHash: null,
            telegramLinkExpiresAt: null,
          },
          { transaction },
        );
      });
      return { ok: true };
    }),
  );
};
