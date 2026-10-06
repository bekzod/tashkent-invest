'use strict';

const { Op } = require('sequelize');
const { URL } = require('node:url');

const TELEGRAM_MESSAGE_LIMIT = 4096;
const TELEGRAM_API_BASE_URL = 'https://api.telegram.org';
const DASHBOARD_BUTTON_TEXT = '📂 Arizani kabinetda ochish';

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
    return entities[character];
  });
}

function escapedAndTruncated(value, maxLength) {
  const text = String(value ?? '').trim();
  if (!text || maxLength <= 0) return '';

  const escaped = escapeHtml(text);
  if (escaped.length <= maxLength) return escaped;
  if (maxLength === 1) return '…';

  let low = 0;
  let high = text.length;
  const contentLimit = maxLength - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (escapeHtml(text.slice(0, middle)).length <= contentLimit) low = middle;
    else high = middle - 1;
  }
  return `${escapeHtml(text.slice(0, low))}…`;
}

function displayObjectTitle(application) {
  const translations = application?.object?.translations || [];
  const uzbek = translations.find(
    (translation) => translation.locale === 'uz' && translation.title,
  );
  const first = translations.find((translation) => translation.title);
  return uzbek?.title || first?.title || application?.object?.cadastralNumber || 'Noma’lum obyekt';
}

function formatInvestmentAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount)}`;
}

function formatCreatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('uz-UZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tashkent',
  }).format(date);
}

function formatApplicationMessage(application) {
  const footer = '📌 <b>Holati:</b> Qabul qilindi';
  let message = '<b>🔔 Yangi investor arizasi</b>';

  const addLine = (emoji, label, value, { multiline = false } = {}) => {
    if (value === null || value === undefined || String(value).trim() === '') return;
    const prefix = multiline ? `${emoji} <b>${label}:</b>\n` : `${emoji} <b>${label}:</b> `;
    const separator = '\n\n';
    const available = TELEGRAM_MESSAGE_LIMIT - footer.length - message.length - separator.length;
    if (available <= prefix.length + 1) return;
    const rendered = escapedAndTruncated(value, available - prefix.length);
    if (rendered) message += `${separator}${prefix}${rendered}`;
  };

  addLine('🏢', 'Obyekt', displayObjectTitle(application));
  addLine('👤', 'Investor', application?.name);
  addLine('🏭', 'Kompaniya', application?.company);
  addLine('🌍', 'Mamlakat', application?.country);
  addLine('💰', 'Investitsiya', formatInvestmentAmount(application?.investmentAmountUsd));
  addLine('☎️', 'Telefon', application?.phone);
  addLine('📧', 'Email', application?.email);
  addLine('✈️', 'Telegram', application?.telegram);
  addLine('📝', 'Loyiha tavsifi', application?.projectDescription, { multiline: true });
  addLine('💬', 'Izoh', application?.comment, { multiline: true });
  addLine('🕒', 'Yuborilgan', formatCreatedAt(application?.createdAt));

  const separator = '\n\n';
  if (message.length + separator.length + footer.length <= TELEGRAM_MESSAGE_LIMIT) {
    return `${message}${separator}${footer}`;
  }
  return `${message.slice(0, TELEGRAM_MESSAGE_LIMIT - footer.length - separator.length)}${separator}${footer}`;
}

function dashboardUrl(appPublicUrl, applicationId) {
  const origin = new URL(appPublicUrl).origin;
  return `${origin}/dashboard/applications?application=${encodeURIComponent(applicationId)}`;
}

function isUsablePublicUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function logFailure(logger, applicationId, details = {}) {
  try {
    logger?.error?.(
      {
        event: 'telegram_application_notification_failed',
        applicationId,
        ...details,
      },
      'Telegram application notification failed',
    );
  } catch {
    // Notification errors must never affect an investor submission.
  }
}

function createTelegramNotifier({
  db,
  fetch: request = globalThis.fetch,
  logger,
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  appPublicUrl = process.env.APP_PUBLIC_URL,
} = {}) {
  const enabled =
    Boolean(db?.User && db?.Application) &&
    typeof request === 'function' &&
    typeof botToken === 'string' &&
    botToken.trim().length > 0 &&
    isUsablePublicUrl(appPublicUrl);

  async function notifyNewApplication(applicationId) {
    if (!enabled) return { delivered: false, reason: 'disabled' };

    try {
      const admin = await db.User.findOne({
        where: {
          role: 'admin',
          isActive: true,
          telegramChatId: { [Op.ne]: null },
        },
        order: [
          ['telegramLinkedAt', 'DESC'],
          ['id', 'ASC'],
        ],
      });
      if (!admin?.telegramChatId) return { delivered: false, reason: 'no_recipient' };

      const application = await db.Application.findByPk(applicationId, {
        include: [
          {
            association: 'object',
            include: [{ association: 'translations' }],
          },
        ],
      });
      if (!application) return { delivered: false, reason: 'application_not_found' };

      const response = await request(
        `${TELEGRAM_API_BASE_URL}/bot${encodeURIComponent(botToken.trim())}/sendMessage`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: admin.telegramChatId,
            text: formatApplicationMessage(application),
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: DASHBOARD_BUTTON_TEXT,
                    url: dashboardUrl(appPublicUrl, application.id),
                  },
                ],
              ],
            },
          }),
        },
      );
      if (!response?.ok) {
        logFailure(logger, applicationId, { statusCode: response?.status ?? null });
        return { delivered: false, reason: 'delivery_failed' };
      }
      if (typeof response.json === 'function') {
        const telegramResponse = await response.json();
        if (telegramResponse?.ok === false) {
          logFailure(logger, applicationId, { statusCode: response.status ?? null });
          return { delivered: false, reason: 'delivery_failed' };
        }
      }
      return { delivered: true };
    } catch {
      logFailure(logger, applicationId);
      return { delivered: false, reason: 'delivery_failed' };
    }
  }

  return { notifyNewApplication };
}

module.exports = {
  DASHBOARD_BUTTON_TEXT,
  TELEGRAM_MESSAGE_LIMIT,
  createTelegramNotifier,
  escapeHtml,
  formatApplicationMessage,
};
