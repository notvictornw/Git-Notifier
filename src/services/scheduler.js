import config from '../config/config.js';
import logger from '../utilities/logger.js';
import { buildDigestsForAllRepos, formatDigestDiscordEmbeds, formatDigestMarkdown } from './digest.js';
import notifier from './notifier.js';
import { formatDigestForTelegram } from './telegram.js';

let timer = null;
let lastRunKey = '';

function parseCronField(field, value) {
  const v = String(field).trim();
  if (v === '*') return true;
  for (const part of v.split(',')) {
    const stepMatch = part.match(/^(\*|\d+-\d+)\/(\d+)$/);
    if (stepMatch) {
      const step = Number(stepMatch[2]);
      if (!Number.isFinite(step) || step <= 0) continue;
      if (stepMatch[1] === '*') {
        if (value % step === 0) return true;
        continue;
      }
      const [a, b] = stepMatch[1].split('-').map(Number);
      if (value >= a && value <= b && (value - a) % step === 0) return true;
      continue;
    }
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const a = Number(rangeMatch[1]);
      const b = Number(rangeMatch[2]);
      if (value >= a && value <= b) return true;
      continue;
    }
    if (/^\d+$/.test(part) && Number(part) === value) return true;
  }
  return false;
}

function getZonedParts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute)
  };
}

export function cronMatches(date, cronExpr, timeZone = 'UTC') {
  const parts = String(cronExpr || '').trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [minF, hourF, domF, monF, dowF] = parts;
  const z = getZonedParts(date, timeZone);
  const dow = new Date(Date.UTC(z.year, z.month - 1, z.day)).getUTCDay(); // 0 Sun
  return (
    parseCronField(minF, z.minute) &&
    parseCronField(hourF, z.hour) &&
    parseCronField(domF, z.day) &&
    parseCronField(monF, z.month) &&
    parseCronField(dowF, dow)
  );
}

export async function runDigestJob(reason = 'manual') {
  logger.info(`Running digest job (${reason})`);
  const reports = await buildDigestsForAllRepos();
  const deliveries = [];
  for (const report of reports) {
    if (report.error) {
      deliveries.push({ repo: report.repo, ok: false, error: report.error });
      continue;
    }
    const embeds = formatDigestDiscordEmbeds(report);
    const markdown = formatDigestMarkdown(report);
    const telegramText = formatDigestForTelegram(report);
    await notifier.notify(report.repo, { embeds, text: markdown, telegramText });
    deliveries.push({ repo: report.repo, ok: true });
  }
  logger.info(`Digest job complete: ${deliveries.filter((d) => d.ok).length}/${deliveries.length} delivered`);
  return deliveries;
}

export function startDigestScheduler() {
  if (timer) return;
  if (!config.digest.enabled) {
    logger.info('Digest scheduler disabled (digest.enabled=false)');
    return;
  }
  if (!config.github.token && !(config.github.app.appId && config.github.app.privateKey && config.github.app.installationId)) {
    logger.warn('Digest scheduler enabled but GitHub API is not configured; digests will fail until credentials are set');
  }

  const tick = async () => {
    try {
      const now = new Date();
      if (!cronMatches(now, config.digest.cron, config.digest.timezone)) return;
      const z = getZonedParts(now, config.digest.timezone);
      const key = `${z.year}-${z.month}-${z.day}-${z.hour}-${z.minute}-${config.digest.cron}-${config.digest.timezone}`;
      if (key === lastRunKey) return;
      lastRunKey = key;
      await runDigestJob(`cron:${config.digest.cron}@${config.digest.timezone}`);
    } catch (err) {
      logger.error(`Digest scheduler tick failed: ${err.message}`);
    }
  };

  timer = setInterval(tick, 30_000);
  timer.unref?.();
  logger.info(`Digest scheduler started (cron="${config.digest.cron}" tz="${config.digest.timezone}")`);
  // Check soon after startup; avoids waiting up to 30s
  setTimeout(tick, 2_000).unref?.();
}

export function stopDigestScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}

export default { startDigestScheduler, stopDigestScheduler, runDigestJob, cronMatches };