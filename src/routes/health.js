import express from 'express';
import config from '../config/config.js';
import github from '../services/github.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  let githubApi = { configured: github.isGitHubApiConfigured() };
  if (githubApi.configured) {
    try {
      const rl = await github.getRateLimit();
      githubApi.rateLimit = rl?.rate || rl?.resources?.core || null;
    } catch (err) {
      githubApi.error = err.message;
    }
  }

  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    github: {
      webhookConfigured: Boolean(config.github.secret),
      apiConfigured: githubApi.configured,
      appConfigured: Boolean(config.github.app.appId && config.github.app.privateKey && config.github.app.installationId),
      tokenConfigured: Boolean(config.github.token),
      rateLimit: githubApi.rateLimit,
      apiError: githubApi.error || null
    },
    telegram: { configured: Boolean(config.telegram.botToken) },
    digest: { enabled: config.digest.enabled, cron: config.digest.cron, timezone: config.digest.timezone },
    dashboard: config.dashboard,
    repositories: Object.keys(config.repositories).length
  });
});

export default router;
