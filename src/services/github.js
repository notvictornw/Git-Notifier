import crypto from 'crypto';
import config from '../config/config.js';
import logger from '../utilities/logger.js';

const API_BASE = config.github.apiBase.replace(/\/$/, '');
const GRAPHQL_URL = config.github.graphqlUrl;

let installationTokenCache = { token: '', expiresAt: 0 };

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function buildAppJwt() {
  const { appId, privateKey } = config.github.app;
  if (!appId || !privateKey) return '';
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 9 * 60, iss: appId }));
  const data = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(data);
  signer.end();
  const signature = signer.sign(privateKey).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${signature}`;
}

async function getInstallationToken() {
  const { installationId, privateKey, appId } = config.github.app;
  if (!installationId || !privateKey || !appId) return '';
  if (installationTokenCache.token && Date.now() < installationTokenCache.expiresAt - 60_000) {
    return installationTokenCache.token;
  }

  const jwt = buildAppJwt();
  if (!jwt) return '';

  const res = await fetch(`${API_BASE}/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${jwt}`,
      'User-Agent': 'git-notifier',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.warn(`Failed to get GitHub App installation token (${res.status}): ${text.slice(0, 200)}`);
    return '';
  }

  const data = await res.json();
  installationTokenCache = {
    token: data.token || '',
    expiresAt: data.expires_at ? Date.parse(data.expires_at) : Date.now() + 55 * 60_000
  };
  return installationTokenCache.token;
}

async function getAuthToken() {
  if (config.github.token) return config.github.token;
  return getInstallationToken();
}

export function isGitHubApiConfigured() {
  return Boolean(config.github.token || (config.github.app.appId && config.github.app.privateKey && config.github.app.installationId));
}

async function githubFetch(path, options = {}) {
  const token = await getAuthToken();
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'git-notifier',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`GitHub API ${res.status} ${res.statusText}: ${text.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function graphql(query, variables = {}) {
  const token = await getAuthToken();
  if (!token) throw new Error('GitHub API token/app not configured for GraphQL');
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'git-notifier',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.errors) {
    const msg = data.errors ? JSON.stringify(data.errors).slice(0, 300) : `${res.status}`;
    throw new Error(`GitHub GraphQL error: ${msg}`);
  }
  return data.data;
}

export async function getRepo(owner, repo) {
  return githubFetch(`/repos/${owner}/${repo}`);
}

export async function getPullRequest(owner, repo, number) {
  return githubFetch(`/repos/${owner}/${repo}/pulls/${number}`);
}

export async function getPullRequestFiles(owner, repo, number) {
  return githubFetch(`/repos/${owner}/${repo}/pulls/${number}/files?per_page=100`);
}

export async function getIssue(owner, repo, number) {
  return githubFetch(`/repos/${owner}/${repo}/issues/${number}`);
}

export async function getCheckRunsForRef(owner, repo, ref) {
  return githubFetch(`/repos/${owner}/${repo}/commits/${encodeURIComponent(ref)}/check-runs?per_page=100`);
}

export async function listOpenPulls(owner, repo, perPage = 50) {
  return githubFetch(`/repos/${owner}/${repo}/pulls?state=open&per_page=${perPage}&sort=updated&direction=desc`);
}

export async function listOpenIssues(owner, repo, perPage = 50) {
  // GitHub issues API includes PRs; filter later
  return githubFetch(`/repos/${owner}/${repo}/issues?state=open&per_page=${perPage}&sort=updated&direction=desc`);
}

export async function listRecentWorkflowRuns(owner, repo, perPage = 20) {
  return githubFetch(`/repos/${owner}/${repo}/actions/runs?per_page=${perPage}`);
}

export async function getRateLimit() {
  return githubFetch('/rate_limit');
}

export function splitRepo(fullName) {
  const [owner, repo] = String(fullName || '').split('/');
  return { owner, repo };
}

export default {
  isGitHubApiConfigured,
  graphql,
  getRepo,
  getPullRequest,
  getPullRequestFiles,
  getIssue,
  getCheckRunsForRef,
  listOpenPulls,
  listOpenIssues,
  listRecentWorkflowRuns,
  getRateLimit,
  splitRepo
};
