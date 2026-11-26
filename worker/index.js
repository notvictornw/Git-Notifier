/**
 * Cloudflare Workers entrypoint for the GitHub -> Discord webhook gateway.
 *
 * This is the hosted mode: one deployment receives the webhooks of every
 * mapped repository and routes each event to its Discord webhook. It reuses
 * the same event formatters (src/handlers) as the Express server, so embeds
 * are identical in both modes.
 *
 * Configuration comes from the CONFIG_YML_CONTENT secret (the same YAML as
 * config.yml) so webhook URLs and the GitHub secret are never in the bundle
 * or in public assets.
 *
 * Optional environment:
 *   NOTIFY_BRANCHES  Comma-separated branches that may notify (default: main).
 */

import YAML from 'yaml';
import handlers from '../src/handlers/index.js';

const MAX_ATTEMPTS = 5;
const MAX_EMBEDS_PER_MESSAGE = 10;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let cachedRawConfig;
let cachedConfig;

class ConfigError extends Error {}

function loadConfig(env) {
  const raw = env.CONFIG_YML_CONTENT;
  if (!raw || !raw.trim()) {
    throw new ConfigError('CONFIG_YML_CONTENT is not set on this deployment.');
  }

  if (cachedRawConfig === raw) {
    return cachedConfig;
  }

  const parsed = YAML.parse(raw);
  const secret = parsed?.github?.secret;
  if (typeof secret !== 'string' || !secret.trim()) {
    throw new ConfigError('github.secret is missing in the configuration.');
  }

  const repositories = {};
  for (const [repo, webhookUrl] of Object.entries(parsed?.repositories ?? {})) {
    if (typeof webhookUrl === 'string' && webhookUrl.trim().startsWith('https://')) {
      repositories[repo.trim().toLowerCase()] = webhookUrl.trim();
    }
  }

  cachedRawConfig = raw;
  cachedConfig = {
    github: { secret },
    repositories,
    allowedBranches: (env.NOTIFY_BRANCHES || 'main')
      .split(',')
      .map((branch) => branch.trim())
      .filter(Boolean)
  };

  return cachedConfig;
}

const BRANCH_SCOPED_EVENTS = new Set([
  'push',
  'pull_request',
  'create',
  'delete',
  'deployment',
  'deployment_status',
  'workflow_run',
  'workflow_job'
]);

function branchOf(event, payload) {
  switch (event) {
    case 'push':
      return (payload.ref || '').startsWith('refs/heads/')
        ? payload.ref.slice('refs/heads/'.length)
        : null;
    case 'pull_request':
      return payload.pull_request?.base?.ref ?? null;
    case 'create':
    case 'delete':
      return payload.ref_type === 'branch' ? payload.ref : null;
    case 'deployment':
    case 'deployment_status':
      return payload.deployment?.ref ?? null;
    case 'workflow_run':
      return payload.workflow_run?.head_branch ?? null;
    case 'workflow_job':
      return payload.workflow_job?.head_branch ?? null;
    default:
      return undefined;
  }
}

function isAllowedBranch(event, payload, allowedBranches) {
  if (!BRANCH_SCOPED_EVENTS.has(event)) {
    return true;
  }

  const branch = branchOf(event, payload);
  return Boolean(branch) && allowedBranches.includes(branch);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(secret, body) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(body)));
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifySignature(request, rawBody, secret) {
  const header = request.headers.get('x-hub-signature-256') || '';
  const [algorithm, signature] = header.split('=');

  if (algorithm !== 'sha256' || !signature) {
    return false;
  }

  const expected = await hmacHex(secret, rawBody);
  return constantTimeEqual(signature.toLowerCase(), expected);
}

async function postEmbeds(webhookUrl, embeds) {
  for (let start = 0; start < embeds.length; start += MAX_EMBEDS_PER_MESSAGE) {
    const chunk = embeds.slice(start, start + MAX_EMBEDS_PER_MESSAGE);
    const delivered = await postChunk(webhookUrl, chunk);
    if (!delivered) return false;
  }
  return true;
}

async function postChunk(webhookUrl, embeds) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds })
      });

      if (response.ok) return true;

      if (response.status === 429 || response.status >= 500) {
        const data = await response.json().catch(() => ({}));
        const retryAfterHeader = response.headers.get('retry-after');
        let retryAfter = Number(data.retry_after ?? retryAfterHeader ?? 2);
        if (!Number.isFinite(retryAfter) || retryAfter <= 0) retryAfter = 2;
        await sleep(Math.ceil(retryAfter * 1000));
        continue;
      }

      console.error(`Discord rejected the message (${response.status}): ${await response.text().catch(() => '')}`);
      return false;
    } catch (error) {
      console.error(`Network error sending to Discord: ${error.message}`);
      if (attempt === MAX_ATTEMPTS) return false;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }

  return false;
}

async function handleGithub(request, env, ctx) {
  let config;
  try {
    config = loadConfig(env);
  } catch (error) {
    console.error(error.message);
    return json({ error: 'Server Misconfigured', message: 'Notifier configuration is unavailable' }, 503);
  }

  const rawBody = await request.text();

  if (!(await verifySignature(request, rawBody, config.github.secret))) {
    console.warn('Signature validation failed');
    return json({ error: 'Unauthorized', message: 'Invalid signature' }, 401);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Bad Request', message: 'Invalid JSON payload received' }, 400);
  }

  const event = request.headers.get('x-github-event') || '';
  const repoName = payload.repository?.full_name;

  if (!repoName) {
    return json({ error: 'Bad Request', message: 'Missing repository full_name in payload' }, 400);
  }

  const webhookUrl = config.repositories[repoName.trim().toLowerCase()];
  if (!webhookUrl) {
    return json({ status: 'ignored', message: 'Repository not configured in mappings' });
  }

  if (!isAllowedBranch(event, payload, config.allowedBranches)) {
    return json({
      status: 'ignored',
      message: `Event is outside ${config.allowedBranches.join(', ')}`
    });
  }

  const handler = handlers[event];
  if (!handler) {
    return json({ status: 'unhandled', message: `Event '${event}' is not supported` });
  }

  let embeds;
  try {
    embeds = handler(payload) || [];
  } catch (error) {
    console.error(`Handler for ${event} failed: ${error.message}`);
    return json({ error: 'Internal Server Error', message: 'Failed to process webhook payload' }, 500);
  }

  if (!Array.isArray(embeds) || embeds.length === 0) {
    return json({ status: 'skipped', message: 'Event did not produce any Discord notifications' });
  }

  // Respond to GitHub immediately; the Discord delivery (with retries) keeps
  // running in the background of this request.
  ctx.waitUntil(
    postEmbeds(webhookUrl, embeds).then((delivered) => {
      if (!delivered) console.error(`Discord delivery failed for ${repoName} (${event})`);
    })
  );

  return json({ status: 'success', message: `Notification for event '${event}' queued` });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/') {
      let configured = null;
      try {
        configured = Object.keys(loadConfig(env).repositories).length;
      } catch {
        configured = null;
      }
      return json({
        status: 'online',
        runtime: 'cloudflare-workers',
        timestamp: new Date().toISOString(),
        configuredRepositories: configured
      });
    }

    if (request.method === 'POST' && url.pathname === '/github') {
      return handleGithub(request, env, ctx);
    }

    return json({ error: 'Not Found', message: `Cannot ${request.method} ${url.pathname}` }, 404);
  }
};
