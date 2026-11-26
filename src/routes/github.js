import express from 'express';
import verifySignature from '../middleware/signature.js';
import config from '../config/config.js';
import handlers from '../handlers/index.js';
import notifier from '../services/notifier.js';
import enrich from '../services/enrich.js';
import logger from '../utilities/logger.js';

const router = express.Router();

async function buildEnrichment(event, payload) {
  try {
    if (event === 'pull_request') return await enrich.enrichPullRequest(payload);
    if (event === 'issues') return await enrich.enrichIssue(payload);
    if (event === 'push') return await enrich.enrichPush(payload);
    if (event === 'pull_request_review') return await enrich.enrichPullRequest(payload);
    if (event === 'pull_request_review_comment') return await enrich.enrichPullRequest(payload);
    if (event === 'issue_comment') return await enrich.enrichIssue(payload);
    if (event === 'check_run') return await enrich.enrichCheck(payload);
    if (event === 'check_suite') return await enrich.enrichCheck(payload);
  } catch (err) {
    logger.warn(`Enrichment error for ${event}: ${err.message}`);
  }
  return null;
}

router.post('/github', verifySignature, async (req, res) => {
  const event = req.headers['x-github-event'];
  const payload = req.body;

  const repoName = payload.repository?.full_name;
  if (!repoName) {
    logger.warn('Received webhook payload without repository full_name');
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing repository full_name in payload'
    });
  }

  const normalizedRepo = repoName.toLowerCase();
  const repoCfg = config.repositories[normalizedRepo];

  if (!repoCfg) {
    logger.info(`Received ${event} webhook for unconfigured repository: ${repoName}. Acknowledged and skipped.`);
    return res.status(200).json({
      status: 'ignored',
      message: 'Repository not configured in mappings'
    });
  }

  const handler = handlers[event];
  if (!handler) {
    logger.warn(`Received unsupported or unhandled GitHub event: ${event}`);
    return res.status(200).json({
      status: 'unhandled',
      message: `Event '${event}' is not supported`
    });
  }

  try {
    const enriched = await buildEnrichment(event, payload);
    const embeds = handler.length >= 2 ? handler(payload, enriched) : handler(payload);

    if (embeds && embeds.length > 0) {
      // Fire-and-forget notification to Discord/Telegram
      Promise.resolve(notifier.notify(repoName, { event, embeds, payload })).catch((err) => {
        logger.error(`Notifier error for ${repoName}: ${err.message}`);
      });
      logger.info(`Queued ${event} notification for repository: ${repoName}${enriched ? ' (enriched)' : ''}`);
      return res.status(200).json({
        status: 'success',
        message: `Notification for event '${event}' queued`,
        enriched: Boolean(enriched)
      });
    }

    logger.info(`Handler for ${event} returned no embeds for repository: ${repoName}`);
    return res.status(200).json({
      status: 'skipped',
      message: `Event '${event}' did not produce any Discord notifications`
    });
  } catch (error) {
    logger.error(`Error processing event ${event} for ${repoName}: ${error.message}`);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process webhook payload'
    });
  }
});

export default router;
