'use strict';

const route = require('../../utils/async-handler');
const ensureAuth = require('../../middleware/ensure-auth');
const { createLinkToken } = require('../../services/admin-telegram-link');

function botLink(username, token) {
  return `https://t.me/${username}?start=${token}`;
}

module.exports = async (app) => {
  app.get(
    '/telegram',
    { preHandler: ensureAuth('admin') },
    route(async (request, reply) => {
      const admin = await app.db.User.findByPk(request.user.id);
      if (!admin || admin.role !== 'admin' || admin.isActive === false)
        return reply.code(403).send({ code: 'ADMIN_INACTIVE', error: 'ADMIN_INACTIVE' });
      return {
        linked: Boolean(admin.telegramChatId),
        linkedAt: admin.telegramLinkedAt || null,
      };
    }),
  );

  app.post(
    '/telegram/link',
    { preHandler: ensureAuth('admin') },
    route(async (request, reply) => {
      const username = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, '');
      if (!username)
        return reply
          .code(503)
          .send({ code: 'TELEGRAM_NOT_CONFIGURED', error: 'TELEGRAM_NOT_CONFIGURED' });

      const admin = await app.db.User.findByPk(request.user.id);
      if (!admin || admin.role !== 'admin' || admin.isActive === false)
        return reply.code(403).send({ code: 'ADMIN_INACTIVE', error: 'ADMIN_INACTIVE' });

      const link = createLinkToken();
      await admin.update({
        telegramLinkTokenHash: link.tokenHash,
        telegramLinkExpiresAt: link.expiresAt,
      });
      return {
        botUrl: botLink(username, link.token),
        expiresAt: link.expiresAt,
      };
    }),
  );
};
