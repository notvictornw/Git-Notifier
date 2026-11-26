import discordService from '../services/discord.js';
import logger from '../utilities/logger.js';

export class DiscordAdapter {
  constructor() { this.name = 'discord'; }
  async send(ctx) {
    const { repoCfg, embeds = [], text = '' } = ctx;
    const webhook = repoCfg.discord;
    if (!webhook || !embeds.length) return { ok: false, skipped: true, reason: 'no-webhook-or-embeds' };
    try {
      await Promise.resolve(discordService.send(webhook, embeds));
      return { ok: true };
    } catch (err) {
      logger.error(`Discord adapter failed for ${repoCfg.name}: ${err.message}`);
      return { ok: false, error: err.message };
    }
  }
}

export default DiscordAdapter;
