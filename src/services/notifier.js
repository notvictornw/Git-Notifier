import discordService from './discord.js';
import { isTelegramConfigured, sendMessage, escapeHtml } from './telegram.js';
import config from '../config/config.js';
import logger from '../utilities/logger.js';

/**
 * Unified notifier: sends to Discord and/or Telegram based on repo config.
 * repoConfig: { discord, telegram } or resolved from config.repositories
 */
export async function notify(repoFullName, { embeds = [], text = '', telegramText = '' } = {}) {
  const key = String(repoFullName || '').toLowerCase();
  const repoCfg = config.repositories[key] || {};

  const tasks = [];

  if (repoCfg.discord && embeds.length > 0) {
    tasks.push(Promise.resolve().then(() => discordService.send(repoCfg.discord, embeds)).catch((e) => {
      logger.error(`Discord notify failed for ${repoFullName}: ${e.message}`);
    }));
  }

  const tgChat = repoCfg.telegram || config.telegram?.chatId;
  if (isTelegramConfigured() && tgChat) {
    const body = telegramText || text || embedsToTelegramText(embeds, repoFullName);
    if (body) {
      tasks.push(sendMessage({ chatId: tgChat, text: body }).catch((e) => {
        logger.error(`Telegram notify failed for ${repoFullName}: ${e.message}`);
      }));
    }
  }

  await Promise.allSettled(tasks);
}

function embedsToTelegramText(embeds, repoFullName) {
  if (!embeds || !embeds.length) return '';
  const lines = [];
  for (const e of embeds.slice(0, 5)) {
    const title = e.title ? `<b>${escapeHtml(stripEmoji(e.title))}</b>` : '';
    const desc = e.description ? escapeHtml(stripEmoji(e.description)).slice(0, 800) : '';
    const url = e.url ? `\n${e.url}` : '';
    const fields = (e.fields || []).slice(0, 6).map((f) => `• <b>${escapeHtml(f.name)}:</b> ${escapeHtml(String(f.value))}`).join('\n');
    lines.push([title, desc, fields].filter(Boolean).join('\n') + url);
  }
  return lines.join('\n\n—\n\n');
}

function stripEmoji(s = '') {
  return String(s).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
}

export default { notify };
