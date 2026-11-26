import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

process.env.CONFIG_PATH = path.join(repoRoot, 'config.yml.example');
process.env.GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'test-secret';

const { cronMatches } = await import('../src/services/scheduler.js');

test('cronMatches matches exact UTC minute/hour', () => {
  const d = new Date('2026-11-26T09:00:00Z');
  assert.equal(cronMatches(d, '0 9 * * *', 'UTC'), true);
  assert.equal(cronMatches(d, '1 9 * * *', 'UTC'), false);
});

test('cronMatches supports wildcard and step', () => {
  const d = new Date('2026-11-26T09:10:00Z');
  assert.equal(cronMatches(d, '*/10 * * * *', 'UTC'), true);
  assert.equal(cronMatches(d, '*/15 * * * *', 'UTC'), false);
});
