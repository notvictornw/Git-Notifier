import github from './github.js';
import config from '../config/config.js';
import logger from '../utilities/logger.js';

function daysSince(iso) {
  if (!iso) return 0;
  return Math.floor((Date.now() - Date.parse(iso)) / (24 * 60 * 60 * 1000));
}

export async function getRepoHealth(repoFullName, opts = {}) {
  if (!github.isGitHubApiConfigured()) {
    throw new Error('GitHub API not configured (set github.token or GitHub App credentials)');
  }

  const stalePrDays = opts.stalePrDays ?? config.digest.stalePrDays;
  const staleIssueDays = opts.staleIssueDays ?? config.digest.staleIssueDays;
  const { owner, repo } = github.splitRepo(repoFullName);

  const [repoInfo, pulls, issues, runs] = await Promise.all([
    github.getRepo(owner, repo).catch((e) => { throw new Error(`repo: ${e.message}`); }),
    github.listOpenPulls(owner, repo, 50).catch((e) => { logger.warn(`health pulls ${repoFullName}: ${e.message}`); return []; }),
    github.listOpenIssues(owner, repo, 50).catch((e) => { logger.warn(`health issues ${repoFullName}: ${e.message}`); return []; }),
    github.listRecentWorkflowRuns(owner, repo, 30).catch((e) => { logger.warn(`health runs ${repoFullName}: ${e.message}`); return { workflow_runs: [] }; })
  ]);

  const openPrs = (pulls || []).map((pr) => ({
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    author: pr.user?.login || 'unknown',
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    ageDays: daysSince(pr.created_at),
    idleDays: daysSince(pr.updated_at),
    draft: Boolean(pr.draft),
    labels: (pr.labels || []).map((l) => l.name),
    reviewCount: pr.requested_reviewers?.length || 0,
    additions: pr.additions,
    deletions: pr.deletions
  }));

  const pureIssues = (issues || []).filter((i) => !i.pull_request).map((i) => ({
    number: i.number,
    title: i.title,
    url: i.html_url,
    author: i.user?.login || 'unknown',
    createdAt: i.created_at,
    updatedAt: i.updated_at,
    ageDays: daysSince(i.created_at),
    idleDays: daysSince(i.updated_at),
    labels: (i.labels || []).map((l) => (typeof l === 'string' ? l : l.name)),
    assignees: (i.assignees || []).map((a) => a.login),
    comments: i.comments || 0
  }));

  const workflowRuns = (runs.workflow_runs || runs || []).map((r) => ({
    id: r.id,
    name: r.name || r.display_title || 'workflow',
    branch: r.head_branch,
    event: r.event,
    status: r.status,
    conclusion: r.conclusion,
    url: r.html_url,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    actor: r.actor?.login || r.triggering_actor?.login || 'unknown'
  }));

  const stalePrs = openPrs.filter((pr) => pr.idleDays >= stalePrDays);
  const staleIssues = pureIssues.filter((i) => i.idleDays >= staleIssueDays);
  const unlabeledIssues = pureIssues.filter((i) => i.labels.length === 0);
  const noAssigneeIssues = pureIssues.filter((i) => i.assignees.length === 0);
  const failingRuns = workflowRuns.filter((r) => ['failure', 'timed_out', 'action_required', 'startup_failure'].includes(r.conclusion));
  const recentRuns = workflowRuns.slice(0, 15);

  // Simple health score 0-100
  let score = 100;
  score -= Math.min(30, stalePrs.length * 5);
  score -= Math.min(20, staleIssues.length * 3);
  score -= Math.min(20, failingRuns.slice(0, 5).length * 5);
  score -= Math.min(15, unlabeledIssues.length * 2);
  score -= Math.min(15, noAssigneeIssues.length);
  score = Math.max(0, Math.min(100, score));

  return {
    repo: repoFullName,
    generatedAt: new Date().toISOString(),
    score,
    info: {
      description: repoInfo.description,
      defaultBranch: repoInfo.default_branch,
      stars: repoInfo.stargazers_count,
      forks: repoInfo.forks_count,
      openIssuesCount: repoInfo.open_issues_count,
      pushedAt: repoInfo.pushed_at,
      url: repoInfo.html_url,
      private: repoInfo.private,
      archived: repoInfo.archived,
      language: repoInfo.language
    },
    metrics: {
      openPrs: openPrs.length,
      stalePrs: stalePrs.length,
      openIssues: pureIssues.length,
      staleIssues: staleIssues.length,
      unlabeledIssues: unlabeledIssues.length,
      noAssigneeIssues: noAssigneeIssues.length,
      failingRuns: failingRuns.length
    },
    stalePrs: stalePrs.sort((a, b) => b.idleDays - a.idleDays),
    staleIssues: staleIssues.sort((a, b) => b.idleDays - a.idleDays),
    unlabeledIssues,
    noAssigneeIssues,
    failingRuns: failingRuns.slice(0, 10),
    recentRuns,
    openPrs
  };
}

export async function getAllReposHealth(opts = {}) {
  const targets = Object.values(config.repositories).filter((r) => r.health !== false);
  const results = [];
  for (const repo of targets) {
    try {
      results.push(await getRepoHealth(repo.name, opts));
    } catch (err) {
      logger.error(`Health build failed for ${repo.name}: ${err.message}`);
      results.push({ repo: repo.name, error: err.message, generatedAt: new Date().toISOString(), score: 0, metrics: {} });
    }
  }
  return results;
}

export function formatHealthMarkdown(report) {
  if (report.error) return `## ${report.repo}\n\nError: ${report.error}\n`;
  const lines = [];
  lines.push(`# Repo Health — ${report.repo}`);
  lines.push(`Score: **${report.score}/100**  |  generated ${report.generatedAt}`);
  lines.push('');
  lines.push(`**Open PRs:** ${report.metrics.openPrs} (${report.metrics.stalePrs} stale) · **Open Issues:** ${report.metrics.openIssues} (${report.metrics.staleIssues} stale, ${report.metrics.unlabeledIssues} unlabeled, ${report.metrics.noAssigneeIssues} no assignee) · **Failing actions:** ${report.metrics.failingRuns}`);
  lines.push('');

  const section = (title, items, fmt) => {
    lines.push(`## ${title} (${items.length})`);
    if (!items.length) { lines.push('_None_'); lines.push(''); return; }
    for (const it of items.slice(0, 10)) lines.push(`- ${fmt(it)}`);
    if (items.length > 10) lines.push(`- _…+${items.length - 10} more_`);
    lines.push('');
  };

  section('Stale PRs', report.stalePrs, (pr) => `[ #${pr.number} ](${pr.url}) ${pr.title} — idle ${pr.idleDays}d, by @${pr.author}`);
  section('Stale Issues', report.staleIssues, (i) => `[ #${i.number} ](${i.url}) ${i.title} — idle ${i.idleDays}d`);
  section('Failing Actions', report.failingRuns, (r) => `[${r.name}](${r.url}) \`${r.branch}\` — ${r.conclusion}`);
  section('Unlabeled Issues', report.unlabeledIssues, (i) => `[ #${i.number} ](${i.url}) ${i.title}`);
  return lines.join('\n');
}

export default { getRepoHealth, getAllReposHealth, formatHealthMarkdown };
