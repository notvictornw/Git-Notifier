import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

function loadConfigWith(yaml, env = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-notifier-test-'));
  const cfgPath = path.join(dir, 'config.yml');
  fs.writeFileSync(cfgPath, yaml, 'utf8');
  const code = `import cfg from './src/config/config.js'; console.log(JSON.stringify(cfg));`;
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    cwd: repoRoot,
    env: { ...process.env, CONFIG_PATH: cfgPath, ...env },
    encoding: 'utf8'
  });
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || `exit ${res.status}`);
  }
  const lines = res.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const jsonLine = [...lines].reverse().find((l) => l.startsWith('{') && l.endsWith('}'));
  if (!jsonLine) throw new Error(`No JSON output. stdout:\n${res.stdout}\nstderr:\n${res.stderr}`);
  return JSON.parse(jsonLine);
}

test('config normalizes legacy string repo mapping', () => {
  const cfg = loadConfigWith(`
server: { port: 3000 }
github: { secret: s }
repositories:
  "Owner/Repo": "https://discord.com/api/webhooks/1/2"
`);
  assert.equal(cfg.repositories['owner/repo'].discord, 'https://discord.com/api/webhooks/1/2');
  assert.equal(cfg.repositories['owner/repo'].digest, true);
});

test('config normalizes object repo mapping and env fallbacks', () => {
  const cfg = loadConfigWith(`
server: { port: 3000 }
github: { secret: s }
repositories:
  "Owner/Repo": { discord: "https://discord.com/api/webhooks/1/2", digest: false, health: true }
`, { TELEGRAM_BOT_TOKEN: 'tg', GITHUB_TOKEN: 'ghp_test' });
  assert.equal(cfg.repositories['owner/repo'].digest, false);
  assert.equal(cfg.telegram.botToken, 'tg');
  assert.equal(cfg.github.token, 'ghp_test');
});
