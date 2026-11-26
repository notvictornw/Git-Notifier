import test from 'node:test';
import assert from 'node:assert/strict';
import { routeNotification } from '../src/services/rules.js';

test('routeNotification suppresses ignored events', () => {
  const r = routeNotification({
    repoCfg: { name: 'owner/repo', notifications: { ignore: ['push'] } },
    event: 'push',
    embeds: [{ title: 't' }],
    config: {}
  });
  assert.equal(r.suppressed, true);
  assert.equal(r.reason, 'event-ignored');
});

test('routeNotification applies mentions and severity color', () => {
  const r = routeNotification({
    repoCfg: { name: 'owner/repo', notifications: { mentions: { discord: { critical: ['@here'] } } } },
    event: 'dependabot_alert',
    embeds: [{ title: 'alert', description: 'desc' }],
    payload: { alert: { security_advisory: { severity: 'critical' } } },
    config: {}
  });
  assert.equal(r.suppressed, false);
  assert.equal(r.severity, 'critical');
  assert.match(r.embeds[0].description, /@here/);
  assert.equal(r.embeds[0].color, 15158332);
});

test('routeNotification reroutes channel by event', () => {
  const r = routeNotification({
    repoCfg: { name: 'owner/repo', discord: 'https://a', notifications: { channels: { dependabot_alert: { discord: 'https://b' } } } },
    event: 'dependabot_alert',
    embeds: [{ title: 'x' }],
    payload: { alert: { security_advisory: { severity: 'high' } } },
    config: {}
  });
  assert.equal(r.repoCfg.discord, 'https://b');
});
