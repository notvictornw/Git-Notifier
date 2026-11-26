import { isTelegramConfigured, sendMessage } from '../services/telegram.js';
import logger from '../utilities/logger.js';

export class TelegramAdapter {
  constructor() { this.name = 'telegram'; }
  async send(ctx) {
    const { repoCfg, config, telegramText = '', text = '' } = ctx;
    const chatId = repoCfg.telegram || config.telegram?.chatId;
    if (!isTelegramConfigured() || !chatId) return { ok: false, skipped: true, reason: 'not-configured' };
    const body = telegramText || text;
    if (!body) return { ok: false, skipped: true, reason: 'no-body' };
    try {
      await sendMessage({ chatId, text: body });
      return { ok: true };
    } catch (err) {
      logger.error(`Telegram adapter failed for ${repoCfg.name}: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }
}

export default TelegramAdapter;
