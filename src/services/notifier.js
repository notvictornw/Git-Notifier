import config from '../config/config.js';
import logger from '../utilities/logger.js';
import { escapeHtml } from './telegram.js';
import { createAdapters } from '../adapters/index.js';
import { routeNotification } from './rules.js';

const adapters = createAdapters();

export function embedsToTelegramText(embeds, repoFullName) {
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

export async function notify(repoFullName, { event = 'generic', embeds = [], text = '', telegramText = '', payload = null } = {}) {
  const key = String(repoFullName || '').toLowerCase();
  const repoCfg = config.repositories[key] || { name: key };
  const routed = routeNotification({ repoCfg, event, payload, embeds, text, telegramText, config });

  if (routed.suppressed) {
    logger.info(`Notification suppressed for ${repoFullName} event=${event} reason=${routed.reason}`);
    return { ok: true, suppressed: true, reason: routed.reason };
  }

  const baseText = routed.telegramText || routed.text || embedsToTelegramText(routed.embeds, repoFullName);
  const results = [];
  for (const adapter of adapters) {
    const ctx = {
      repoCfg: routed.repoCfg,
      config,
      event,
      embeds: routed.embeds,
      text: routed.text,
      telegramText: baseText,
    };
    const result = await Promise.resolve(adapter.send(ctx)).catch((err) => ({ ok: false, error: err.message }));
    results.push({ adapter: adapter.name, ...result });
  }

  return { ok: results.some((r) => r.ok), results };
}

export default { notify, embedsToTelegramText };
