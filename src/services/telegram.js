import config from '../config/config.js';
import logger from '../utilities/logger.js';

const API_ROOT = 'https://api.telegram.org';

function getBotToken() {
  return config.telegram?.botToken || '';
}

function getDefaultChatId() {
  return config.telegram?.chatId || '';
}

export function isTelegramConfigured() {
  return Boolean(getBotToken());
}

async function tg(method, body) {
  const token = getBotToken();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');
  const res = await fetch(`${API_ROOT}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const desc = data.description || `${res.status}`;
    throw new Error(`Telegram API ${method} failed: ${desc}`);
  }
  return data.result;
}

function chunkText(text, max = 3900) {
  const chunks = [];
  let remaining = String(text || '');
  while (remaining.length > max) {
    let idx = remaining.lastIndexOf('\n', max);
    if (idx < max * 0.5) idx = max;
    chunks.push(remaining.slice(0, idx));
    remaining = remaining.slice(idx);
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export async function sendMessage({ chatId, text, parseMode = 'HTML', disableWebPagePreview = true }) {
  const target = chatId || getDefaultChatId();
  if (!target) throw new Error('No Telegram chatId configured');
  const chunks = chunkText(text);
  let last;
  for (const chunk of chunks) {
    last = await tg('sendMessage', {
      chat_id: target,
      text: chunk,
      parse_mode: parseMode,
      disable_web_page_preview: disableWebPagePreview
    });
  }
  return last;
}

export async function sendDigest({ chatId, title, text }) {
  const header = title ? `<b>${escapeHtml(title)}</b>\n\n` : '';
  return sendMessage({ chatId, text: header + text, parseMode: 'HTML' });
}

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatDigestForTelegram(report) {
  const lines = [];
  lines.push(`<b>📋 GitHub Digest — ${escapeHtml(report.repo)}</b>`);
  lines.push(`<i>${escapeHtml(report.window)}</i>`);
  lines.push('');

  const section = (emoji, label, items, fmt) => {
    lines.push(`${emoji} <b>${label}</b> (${items.length})`);
    if (!items.length) {
      lines.push('  <i>none</i>');
    } else {
      for (const it of items.slice(0, report.maxItems || 10)) lines.push(`  • ${fmt(it)}`);
      if (items.length > (report.maxItems || 10)) lines.push(`  <i>…+${items.length - (report.maxItems || 10)} more</i>`);
    }
    lines.push('');
  };

  section('🔀', 'Open PRs needing attention', report.stalePrs, (pr) =>
    `<a href="${pr.url}">#${pr.number}</a> ${escapeHtml(pr.title)} <i>(${pr.ageDays}d, by ${escapeHtml(pr.author)})</i>`
  );
  section('🐛', 'Stale issues', report.staleIssues, (i) =>
    `<a href="${i.url}">#${i.number}</a> ${escapeHtml(i.title)} <i>(${i.ageDays}d)</i>`
  );
  section('❌', 'Failing Actions (recent)', report.failingActions, (r) =>
    `<a href="${r.url}">${escapeHtml(r.name)}</a> <i>${escapeHtml(r.branch)} · ${escapeHtml(r.conclusion)}</i>`
  );
  section('🏷️', 'Issues without labels', report.unlabeledIssues, (i) =>
    `<a href="${i.url}">#${i.number}</a> ${escapeHtml(i.title)}`
  );
  return lines.join('\n');
}

export default { isTelegramConfigured, sendMessage, sendDigest, formatDigestForTelegram, escapeHtml };
