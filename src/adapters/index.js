import DiscordAdapter from './discord.js';
import TelegramAdapter from './telegram.js';

export function createAdapters() {
  return [new DiscordAdapter(), new TelegramAdapter()];
}

export default createAdapters;
