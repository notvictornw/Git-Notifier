import github from './github.js';
import logger from '../utilities/logger.js';

const cache = new Map(); // key -> { at, value }
const TTL_MS = 5 * 60 * 1000;

function getCache(key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  return undefined;
}
function setCache(key, value) {
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 500) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
}

function summarizeCheckRuns(checkRuns) {
  const runs = checkRuns?.check_runs || [];
  if (!runs.length) return { status: 'none', summary: 'No checks', failures: [] };
  const failures = runs.filter((r) => ['failure', 'timed_out', 'action_required', 'cancelled'].includes(r.conclusion));
  const pending = runs.filter((r) => r.status !== 'completed');
  const success = runs.filter((r) => r.conclusion === 'success');
  let status = 'success';
  if (failures.length) status = 'failure';
  else if (pending.length) status = 'pending';
  const summary = `${success.length} ok, ${failures.length} failed, ${pending.length} pending`;
  return { status, summary, failures: failures.slice(0, 5).map((r) => ({ name: r.name, conclusion: r.conclusion, url: r.html_url })) };
}

export async function enrichPullRequest(payload) {
  if (!github.isGitHubApiConfigured()) return null;
  const repo = payload.repository?.full_name;
  const prNumber = payload.pull_request?.number;
  if (!repo || !prNumber) return null;
  const { owner, repo: name } = github.splitRepo(repo);
  const key = `pr:${repo}:${prNumber}`;
  const cached = getCache(key);
  if (cached) return cached;

  try {
    const [pr, files, checks] = await Promise.all([
      github.getPullRequest(owner, name, prNumber),
      github.getPullRequestFiles(owner, name, prNumber).catch(() => []),
      github.getCheckRunsForRef(owner, name, payload.pull_request?.head?.sha || prNumber).catch(() => null)
    ]);

    const enriched = {
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
      commits: pr.commits,
      mergeableState: pr.mergeable_state,
      reviewComments: pr.review_comments,
      comments: pr.comments,
      requestedReviewers: (pr.requested_reviewers || []).map((u) => u.login),
      labels: (pr.labels || []).map((l) => l.name),
      ci: summarizeCheckRuns(checks),
      topFiles: (files || []).slice(0, 5).map((f) => ({ filename: f.filename, status: f.status, additions: f.additions, deletions: f.deletions }))
    };
    setCache(key, enriched);
    return enriched;
  } catch (err) {
    logger.warn(`PR enrichment failed for ${repo}#${prNumber}: ${err.message}`);
    return null;
  }
}

export async function enrichIssue(payload) {
  if (!github.isGitHubApiConfigured()) return null;
  const repo = payload.repository?.full_name;
  const issueNumber = payload.issue?.number;
  if (!repo || !issueNumber) return null;
  const { owner, repo: name } = github.splitRepo(repo);
  const key = `issue:${repo}:${issueNumber}`;
  const cached = getCache(key);
  if (cached) return cached;

  try {
    const issue = await github.getIssue(owner, name, issueNumber);
    const enriched = {
      labels: (issue.labels || []).map((l) => (typeof l === 'string' ? l : l.name)),
      assignees: (issue.assignees || []).map((u) => u.login),
      comments: issue.comments,
      stateReason: issue.state_reason,
      milestone: issue.milestone?.title || null,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at
    };
    setCache(key, enriched);
    return enriched;
  } catch (err) {
    logger.warn(`Issue enrichment failed for ${repo}#${issueNumber}: ${err.message}`);
    return null;
  }
}

export async function enrichPush(payload) {
  if (!github.isGitHubApiConfigured()) return null;
  const repo = payload.repository?.full_name;
  const head = payload.after;
  if (!repo || !head || /^0+$/.test(head)) return null;
  const { owner, repo: name } = github.splitRepo(repo);
  const key = `push:${repo}:${head}`;
  const cached = getCache(key);
  if (cached) return cached;
  try {
    const checks = await github.getCheckRunsForRef(owner, name, head);
    const enriched = { ci: summarizeCheckRuns(checks) };
    setCache(key, enriched);
    return enriched;
  } catch (err) {
    logger.warn(`Push enrichment failed for ${repo}@${head.slice(0, 7)}: ${err.message}`);
    return null;
  }
}

export function clearEnrichmentCache() {
  cache.clear();
}

export default { enrichPullRequest, enrichIssue, enrichPush, clearEnrichmentCache };
