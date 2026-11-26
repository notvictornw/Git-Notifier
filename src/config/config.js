import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import logger from '../utilities/logger.js';

const configPath = process.env.CONFIG_PATH || path.join(process.cwd(), 'config.yml');

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function asBool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(v)) return true;
    if (['0', 'false', 'no', 'off'].includes(v)) return false;
  }
  return fallback;
}

function asInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeRepoConfig(repo, value) {
  const name = repo.toLowerCase().trim();
  if (!name.includes('/')) {
    logger.warn(`Skipping invalid repository key (expected owner/repo): ${repo}`);
    return null;
  }

  // Backward compat: repositories: { "owner/repo": "https://discord..." }
  if (typeof value === 'string') {
    const discord = asString(value);
    if (!discord.startsWith('https://')) {
      logger.warn(`Skipping invalid webhook URL for repository: ${repo}`);
      return null;
    }
    return { name, discord, telegram: '', digest: true, health: true };
  }

  if (!value || typeof value !== 'object') {
    logger.warn(`Skipping invalid repository config for: ${repo}`);
    return null;
  }

  const discord = asString(value.discord || value.webhook || value.discordWebhook || value.url);
  const telegram = asString(value.telegram || value.telegramChatId || value.chatId);
  if (discord && !discord.startsWith('https://')) {
    logger.warn(`Skipping invalid Discord webhook URL for repository: ${repo}`);
    return null;
  }

  const notifications = value.notifications && typeof value.notifications === 'object' ? value.notifications : {};
  return {
    name,
    discord,
    telegram,
    digest: asBool(value.digest, true),
    health: asBool(value.health, true),
    labels: Array.isArray(value.labels) ? value.labels.map(asString).filter(Boolean) : [],
    notifications
  };
}

function loadPrivateKey(raw) {
  const value = asString(raw);
  if (!value) return '';
  if (value.includes('BEGIN') && value.includes('PRIVATE KEY')) return value.replace(/\\n/g, '\n');
  if (fs.existsSync(value)) {
    try {
      return fs.readFileSync(value, 'utf8');
    } catch (err) {
      logger.warn(`Failed to read GitHub App private key file: ${err.message}`);
      return '';
    }
  }
  return value.replace(/\\n/g, '\n');
}

let config = {};

try {
  let parsed;
  const configYmlContent = process.env.CONFIG_YML_CONTENT;

  if (configYmlContent) {
    logger.info('Loading configuration from CONFIG_YML_CONTENT environment variable.');
    parsed = YAML.parse(configYmlContent);
  } else {
    if (!fs.existsSync(configPath)) {
      logger.error(`Configuration file not found at ${configPath}. Please copy config.yml.example to config.yml.`);
      process.exit(1);
    }
    const fileContents = fs.readFileSync(configPath, 'utf8');
    parsed = YAML.parse(fileContents);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Parsed configuration is empty or invalid YAML.');
  }

  const port = asInt(parsed.server?.port, 3000);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid server port configured: ${parsed.server?.port}`);
  }

  const secret = asString(parsed.github?.secret || process.env.GITHUB_WEBHOOK_SECRET);
  if (!secret) {
    throw new Error('GitHub webhook secret (github.secret) is missing or invalid. Webhook verification is required.');
  }

  const token = asString(parsed.github?.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
  const appId = asString(parsed.github?.app?.appId || parsed.github?.appId || process.env.GITHUB_APP_ID);
  const installationId = asString(parsed.github?.app?.installationId || parsed.github?.installationId || process.env.GITHUB_APP_INSTALLATION_ID);
  const privateKey = loadPrivateKey(parsed.github?.app?.privateKey || parsed.github?.app?.privateKeyPath || process.env.GITHUB_APP_PRIVATE_KEY || process.env.GITHUB_APP_PRIVATE_KEY_PATH);

  const repositories = {};
  if (parsed.repositories && typeof parsed.repositories === 'object') {
    for (const [repo, value] of Object.entries(parsed.repositories)) {
      const normalized = normalizeRepoConfig(repo, value);
      if (normalized) repositories[normalized.name] = normalized;
    }
  }

  const telegramToken = asString(parsed.telegram?.botToken || process.env.TELEGRAM_BOT_TOKEN);
  const telegramChatId = asString(parsed.telegram?.chatId || process.env.TELEGRAM_CHAT_ID);

  const digest = {
    enabled: asBool(parsed.digest?.enabled, false),
    cron: asString(parsed.digest?.cron || '0 9 * * *'),
    timezone: asString(parsed.digest?.timezone || 'UTC'),
    lookbackHours: Math.max(1, asInt(parsed.digest?.lookbackHours, 24)),
    stalePrDays: Math.max(1, asInt(parsed.digest?.stalePrDays || parsed.health?.stalePrDays, 7)),
    staleIssueDays: Math.max(1, asInt(parsed.digest?.staleIssueDays || parsed.health?.staleIssueDays, 14)),
    maxItems: Math.max(1, asInt(parsed.digest?.maxItems, 10))
  };

  const dashboard = {
    enabled: asBool(parsed.dashboard?.enabled, true),
    path: asString(parsed.dashboard?.path || '/dashboard')
  };

  const notifications = parsed.notifications && typeof parsed.notifications === 'object' ? parsed.notifications : {};

  config = {
    server: { port },
    github: {
      secret,
      token,
      apiBase: asString(parsed.github?.apiBase || process.env.GITHUB_API_BASE || 'https://api.github.com'),
      graphqlUrl: asString(parsed.github?.graphqlUrl || process.env.GITHUB_GRAPHQL_URL || 'https://api.github.com/graphql'),
      app: { appId, installationId, privateKey }
    },
    telegram: { botToken: telegramToken, chatId: telegramChatId },
    digest,
    dashboard,
    notifications,
    repositories
  };

  logger.info(`Configuration loaded successfully. ${Object.keys(repositories).length} repository mapping(s) configured.`);
} catch (error) {
  logger.error(`Failed to load configuration: ${error.message}`);
  process.exit(1);
}

export default config;
