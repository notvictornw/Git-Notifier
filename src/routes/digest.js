import express from 'express';
import config from '../config/config.js';
import logger from '../utilities/logger.js';
import { buildDigest, buildDigestsForAllRepos, formatDigestMarkdown, formatDigestDiscordEmbeds } from '../services/digest.js';
import notifier from '../services/notifier.js';

const router = express.Router();

function parseBool(value, fallback = false) {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  const v = String(value).toLowerCase().trim();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return fallback;
}

router.get('/api/digest', async (req, res) => {
  try {
    const repo = String(req.query.repo || '').trim().toLowerCase();
    const send = parseBool(req.query.send, false);
    const format = String(req.query.format || 'json').toLowerCase();

    const reports = repo ? [await buildDigest(repo, req.query)] : await buildDigestsForAllRepos(req.query);

    if (send) {
      for (const report of reports) {
        if (report.error) continue;
        const embeds = formatDigestDiscordEmbeds(report);
        const text = formatDigestMarkdown(report);
        await notifier.notify(report.repo, { embeds, telegramText: text, text });
      }
    }

    if (format === 'md' || format === 'markdown') {
      res.type('text/markdown; charset=utf-8').send(reports.map(formatDigestMarkdown).join('\n\n---\n\n'));
      return;
    }

    res.json({ ok: true, sent: send, count: reports.length, reports });
  } catch (err) {
    logger.error(`Digest route error: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/api/digest/send', async (req, res) => {
  try {
    const repo = String(req.body?.repo || req.query.repo || '').trim().toLowerCase();
    const reports = repo ? [await buildDigest(repo, req.body || {})] : await buildDigestsForAllRepos(req.body || {});
    const deliveries = [];

    for (const report of reports) {
      if (report.error) {
        deliveries.push({ repo: report.repo, ok: false, error: report.error });
        continue;
      }
      const embeds = formatDigestDiscordEmbeds(report);
      const text = formatDigestMarkdown(report);
      await notifier.notify(report.repo, { embeds, telegramText: text, text });
      deliveries.push({ repo: report.repo, ok: true });
    }

    res.json({ ok: true, deliveries });
  } catch (err) {
    logger.error(`Digest send error: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
