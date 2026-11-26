import github from './github.js';
import config from '../config/config.js';
import logger from '../utilities/logger.js';

function daysSince(iso) {
  if (!iso) return 0;
  const ms = Date.now() - Date.parse(iso);
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function withinHours(iso, hours) {
  if (!iso) return false;
  return Date.now() - Date.parse(iso) <= hours * 60 * 60 * 1000;
}

function toPrItem(pr) {
  return {
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    author: pr.user?.login || 'unknown',
    ageDays: daysSince(pr.created_at),
    updatedDays: daysSince(pr.updated_at),
    draft: Boolean(pr.draft),
    labels: (pr.labels || []).map((l) => l.name),
    requestedReviewers: (pr.requested_reviewers || []).map((u) => u.login)
  };
}

function toIssueItem(issue) {
  return {
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    author: issue.user?.login || 'unknown',
    ageDays: daysSince(issue.created_at),
    updatedDays: daysSince(issue.updated_at),
    labels: (issue.labels || []).map((l) => (typeof l === 'string' ? l : l.name)),
    comments: issue.comments || 0
  };
}

export async function buildDigest(repoFullName, opts = {}) {
  if (!github.isGitHubApiConfigured()) {
    throw new Error('GitHub API not configured (set github.token or GitHub App credentials)');
  }

  const lookbackHours = opts.lookbackHours ?? config.digest.lookbackHours;
  const stalePrDays = opts.stalePrDays ?? config.digest.stalePrDays;
  const staleIssueDays = opts.staleIssueDays ?? config.digest.staleIssueDays;
  const maxItems = opts.maxItems ?? config.digest.maxItems;
  const { owner, repo } = github.splitRepo(repoFullName);

  const [pulls, issues, runs] = await Promise.all([
    github.listOpenPulls(owner, repo, 50).catch((e) => { logger.warn(`digest pulls ${repoFullName}: ${e.message}`); return []; }),
    github.listOpenIssues(owner, repo, 50).catch((e) => { logger.warn(`digest issues ${repoFullName}: ${e.message}`); return []; }),
    github.listRecentWorkflowRuns(owner, repo, 30).catch((e) => { logger.warn(`digest runs ${repoFullName}: ${e.message}`); return { workflow_runs: [] }; })
  ]);

  const openPrs = (pulls || []).map(toPrItem);
  const stalePrs = openPrs
    .filter((pr) => pr.updatedDays >= stalePrDays)
    .sort((a, b) => b.updatedDays - a.updatedDays);

  const pureIssues = (issues || []).filter((i) => !i.pull_request).map(toIssueItem);
  const staleIssues = pureIssues
    .filter((i) => i.updatedDays >= staleIssueDays)
    .sort((a, b) => b.updatedDays - a.updatedDays);
  const unlabeledIssues = pureIssues.filter((i) => !i.labels.length);

  const workflowRuns = runs.workflow_runs || runs || [];
  const failingActions = workflowRuns
    .filter((r) => withinHours(r.updated_at || r.run_started_at, lookbackHours))
    .filter((r) => ['failure', 'timed_out', 'action_required'].includes(r.conclusion))
    .map((r) => ({
      id: r.id,
      name: r.name || r.display_title || 'workflow',
      branch: r.head_branch || '?',
      conclusion: r.conclusion,
      url: r.html_url,
      createdAt: r.created_at,
      actor: r.actor?.login || r.triggering_actor?.login || 'unknown'
    }));

  return {
    repo: repoFullName,
    generatedAt: new Date().toISOString(),
    window: `Last ${lookbackHours}h / stale PR>${stalePrDays}d, issues>${staleIssueDays}d`,
    maxItems,
    counts: {
      openPrs: openPrs.length,
      stalePrs: stalePrs.length,
      openIssues: pureIssues.length,
      staleIssues: staleIssues.length,
      unlabeledIssues: unlabeledIssues.length,
      failingActions: failingActions.length
    },
    stalePrs,
    staleIssues,
    unlabeledIssues,
    failingActions,
    openPrs
  };
}

export async function buildDigestsForAllRepos(opts = {}) {
  const targets = Object.values(config.repositories).filter((r) => r.digest !== false);
  const results = [];
  for (const repo of targets) {
    try {
      results.push(await buildDigest(repo.name, opts));
    } catch (err) {
      logger.error(`Digest build failed for ${repo.name}: ${err.message}`);
      results.push({ repo: repo.name, error: err.message, generatedAt: new Date().toISOString() });
    }
  }
  return results;
}

export function formatDigestMarkdown(report) {
  if (report.error) return `## ${report.repo}\n\nError: ${report.error}\n`;
  const lines = [];
  lines.push(`# Digest — ${report.repo}`);
  lines.push(`_${report.window}_  |  generated ${report.generatedAt}`);
  lines.push('');
  lines.push(`**Open PRs:** ${report.counts.openPrs} (${report.counts.stalePrs} stale) · **Open Issues:** ${report.counts.openIssues} (${report.counts.staleIssues} stale, ${report.counts.unlabeledIssues} unlabeled) · **Failing actions (${config.digest.lookbackHours}h):** ${report.counts.failingActions}`);
  lines.push('');

  const section = (title, items, fmt) => {
    lines.push(`## ${title} (${items.length})`);
    if (!items.length) { lines.push('_None_'); lines.push(''); return; }
    for (const it of items.slice(0, report.maxItems || 10)) lines.push(`- ${fmt(it)}`);
    if (items.length > (report.maxItems || 10)) lines.push(`- _…+${items.length - (report.maxItems || 10)} more_`);
    lines.push('');
  };

  section('Stale PRs', report.stalePrs, (pr) => `[#${pr.number}](${pr.url}) ${pr.title} — ${pr.ageDays}d old, by @${pr.author}${pr.draft ? ' (draft)' : ''}`);
  section('Stale Issues', report.staleIssues, (i) => `[#${i.number}](${i.url}) ${i.title} — ${i.ageDays}d old`);
  section('Failing Actions', report.failingActions, (r) => `[${r.name}](${r.url}) on \`${r.branch}\` — ${r.conclusion} (by @${r.actor})`);
  section('Unlabeled Issues', report.unlabeledIssues, (i) => `[#${i.number}](${i.url}) ${i.title}`);
  return lines.join('\n');
}

export function formatDigestDiscordEmbeds(report) {
  if (report.error) {
    return [{
      color: 15158332,
      title: `📋 Digest — ${report.repo}`,
      description: `Error building digest: ${report.error}`,
      timestamp: report.generatedAt
    }];
  }

  const color = report.counts.failingActions > 0 ? 15158332 : report.counts.stalePrs > 0 ? 16705372 : 3066993;
  const embed = {
    color,
    title: `📋 Daily Digest — ${report.repo}`,
    description: `_${report.window}_`,
    timestamp: report.generatedAt,
    fields: [
      {
        name: 'Overview',
        value: `**Open PRs:** ${report.counts.openPrs} (${report.counts.stalePrs} stale)\n**Open Issues:** ${report.counts.openIssues} (${report.counts.staleIssues} stale, ${report.counts.unlabeledIssues} unlabeled)\n**Failing Actions:** ${report.counts.failingActions}`,
        inline: false
      }
    ],
    footer: { text: 'Git Notifier • Digest' }
  };

  const addList = (name, items, fmt) => {
    if (!items.length) return;
    const lines = items.slice(0, 5).map(fmt);
    if (items.length > 5) lines.push(`_…+${items.length - 5} more_`);
    embed.fields.push({ name: `${name} (${items.length})`, value: lines.join('\n').slice(0, 1024), inline: false });
  };

  addList('🔀 Stale PRs', report.stalePrs, (pr) => `[ #${pr.number} ](${pr.url}) ${pr.title.slice(0, 60)} — ${pr.updatedDays}d idle`);
  addList('🐛 Stale Issues', report.staleIssues, (i) => `[ #${i.number} ](${i.url}) ${i.title.slice(0, 60)} — ${i.updatedDays}d idle`);
  addList('❌ Failing Actions', report.failingActions, (r) => `[${r.name}](${r.url}) \`${r.branch}\` — ${r.conclusion}`);
  addList('🏷️ Unlabeled Issues', report.unlabeledIssues, (i) => `[ #${i.number} ](${i.url}) ${i.title.slice(0, 70)}`);

  return [embed];
}

export default { buildDigest, buildDigestsForAllRepos, formatDigestMarkdown, formatDigestDiscordEmbeds };
