import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

process.env.CONFIG_PATH = path.join(repoRoot, 'config.yml.example');
process.env.GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';

const { formatDigestMarkdown } = await import('../src/services/digest.js');
const { formatHealthMarkdown } = await import('../src/services/health.js');

test('formatDigestMarkdown includes key sections', () => {
  const md = formatDigestMarkdown({
    repo: 'owner/repo',
    generatedAt: '2026-11-26T00:00:00.000Z',
    window: '24h',
    maxItems: 10,
    counts: { openPrs: 1, stalePrs: 1, openIssues: 1, staleIssues: 0, unlabeledIssues: 1, failingActions: 1 },
    stalePrs: [{ number: 1, url: 'u', title: 'Old PR', ageDays: 9, author: 'a' }],
    staleIssues: [],
    unlabeledIssues: [{ number: 2, url: 'u2', title: 'No label' }],
    failingActions: [{ name: 'CI', url: 'u3', branch: 'main', conclusion: 'failure', actor: 'a' }]
  });
  assert.match(md, /Digest — owner\/repo/);
  assert.match(md, /Stale PRs/);
  assert.match(md, /Failing Actions/);
  assert.match(md, /Unlabeled Issues/);
});

test('formatHealthMarkdown includes score and metrics', () => {
  const md = formatHealthMarkdown({
    repo: 'owner/repo',
    score: 77,
    generatedAt: '2026-11-26T00:00:00.000Z',
    metrics: { openPrs: 2, stalePrs: 1, openIssues: 3, staleIssues: 1, unlabeledIssues: 1, noAssigneeIssues: 1, failingRuns: 0 },
    stalePrs: [], staleIssues: [], failingRuns: [], unlabeledIssues: []
  });
  assert.match(md, /Repo Health — owner\/repo/);
  assert.match(md, /77\/100/);
});
