import test from 'node:test';
import assert from 'node:assert/strict';

process.env.CONFIG_PATH = new URL('../config.yml.example', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
process.env.GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';

const { handlePullRequestReview } = await import('../src/handlers/pull_request_review.js');
const { handlePullRequestReviewComment } = await import('../src/handlers/pull_request_review_comment.js');
const { handleCheckRun } = await import('../src/handlers/check_run.js');
const { handleCheckSuite } = await import('../src/handlers/check_suite.js');
const { handleDependabotAlert } = await import('../src/handlers/dependabot_alert.js');
const { handleSecretScanningAlert } = await import('../src/handlers/secret_scanning_alert.js');
const { handleIssueComment } = await import('../src/handlers/issue_comment.js');

const repo = { full_name: 'owner/repo', html_url: 'https://github.com/owner/repo' };
const sender = { login: 'alice', avatar_url: 'a', html_url: 'u' };

test('pull_request_review handler formats review', () => {
  const [e] = handlePullRequestReview({ repository: repo, sender, action: 'submitted', pull_request: { number: 7, title: 'T', html_url: 'pr' }, review: { state: 'approved', user: { login: 'bob' }, html_url: 'r', body: 'LGTM' } });
  assert.match(e.title, /approved/);
  assert.equal(e.color, 3066993);
});

test('pull_request_review_comment handler formats comment', () => {
  const [e] = handlePullRequestReviewComment({ repository: repo, sender, action: 'created', pull_request: { number: 7, title: 'T', html_url: 'pr' }, comment: { user: { login: 'bob' }, html_url: 'c', body: 'nit', path: 'src/a.js' } });
  assert.match(e.description, /src\/a\.js/);
});

test('check_run handler marks failure red', () => {
  const [e] = handleCheckRun({ repository: repo, sender, action: 'completed', check_run: { name: 'CI', status: 'completed', conclusion: 'failure', html_url: 'x', head_sha: 'abcdef1234567890', app: { name: 'Actions' } } });
  assert.equal(e.color, 15158332);
  assert.match(e.description, /CI/);
});

test('check_suite handler formats suite', () => {
  const [e] = handleCheckSuite({ repository: repo, sender, action: 'completed', check_suite: { status: 'completed', conclusion: 'success', head_branch: 'main', head_sha: 'abcdef1234567890', app: { name: 'Actions' } } });
  assert.equal(e.color, 3066993);
});

test('dependabot_alert handler includes severity/package', () => {
  const [e] = handleDependabotAlert({ repository: repo, sender, action: 'created', alert: { state: 'open', html_url: 'h', security_advisory: { severity: 'critical', summary: 'Bad', ghsa_id: 'GHSA-1', cve_id: 'CVE-1' }, security_vulnerability: { first_patched_version: { identifier: '1.2.3' } }, dependency: { package: { name: 'pkg', ecosystem: 'npm' }, manifest_path: 'package.json' } } });
  assert.equal(e.color, 15158332);
  assert.ok(e.fields.some((f) => f.name === 'Package' && String(f.value).includes('pkg')));
});

test('secret_scanning_alert handler formats alert', () => {
  const [e] = handleSecretScanningAlert({ repository: repo, sender, action: 'created', alert: { state: 'open', html_url: 'h', secret_type_display_name: 'Token' } });
  assert.equal(e.color, 15158332);
  assert.match(e.description, /Token/);
});

test('issue_comment handler accepts enrichment', () => {
  const [e] = handleIssueComment({ repository: repo, sender, action: 'created', issue: { number: 1, title: 'I', html_url: 'i' }, comment: { user: { login: 'bob' }, body: 'hi', html_url: 'c' } }, { labels: ['bug'], assignees: ['alice'] });
  assert.ok(e.fields.some((f) => f.name === 'Labels'));
});
