import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-notifier-wh-'));
const cfgPath = path.join(tmpDir, 'config.yml');
fs.writeFileSync(cfgPath, `server:\n  port: 3000\ngithub:\n  secret: topsecret\nrepositories:\n  "owner/repo": "https://discord.com/api/webhooks/1/token"\n`, 'utf8');
process.env.CONFIG_PATH = cfgPath;
process.env.GITHUB_WEBHOOK_SECRET = 'topsecret';

const { default: config } = await import('../src/config/config.js');
const { verifySignature } = await import('../src/middleware/signature.js');

function sign(body, secret) {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

async function withServer(app, fn) {
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise(r => server.close(r));
  }
}

function appWithSig() {
  const app = express();
  app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
  app.post('/github', verifySignature, (_req, res) => res.json({ ok: true }));
  return app;
}

test('verifySignature rejects invalid signature', async () => {
  const prev = config.github.secret;
  config.github.secret = 'topsecret';
  try {
    await withServer(appWithSig(), async (base) => {
      const body = JSON.stringify({ hello: 'world' });
      const res = await fetch(base + '/github', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-hub-signature-256': 'sha256=bad', 'x-github-event': 'ping' },
        body
      });
      assert.equal(res.status, 401);
    });
  } finally {
    config.github.secret = prev;
  }
});

test('verifySignature accepts valid signature', async () => {
  const prev = config.github.secret;
  config.github.secret = 'topsecret';
  try {
    await withServer(appWithSig(), async (base) => {
      const body = JSON.stringify({ hello: 'world' });
      const res = await fetch(base + '/github', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-hub-signature-256': sign(body, 'topsecret'), 'x-github-event': 'ping' },
        body
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.ok, true);
    });
  } finally {
    config.github.secret = prev;
  }
});

test('verifySignature rejects missing signature', async () => {
  const prev = config.github.secret;
  config.github.secret = 'topsecret';
  try {
    await withServer(appWithSig(), async (base) => {
      const body = JSON.stringify({ hello: 'world' });
      const res = await fetch(base + '/github', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-github-event': 'ping' },
        body
      });
      assert.equal(res.status, 401);
    });
  } finally {
    config.github.secret = prev;
  }
});
