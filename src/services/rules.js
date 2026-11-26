import logger from '../utilities/logger.js';

const SEVERITY_COLORS = {
  info: 3447003,
  success: 3066993,
  warning: 16705372,
  critical: 15158332,
  muted: 9807270
};

const EVENT_SEVERITY = {
  push: 'info',
  pull_request: 'info',
  pull_request_review: 'info',
  pull_request_review_comment: 'info',
  issues: 'warning',
  issue_comment: 'info',
  check_run: 'warning',
  check_suite: 'warning',
  workflow_run: 'warning',
  workflow_job: 'warning',
  dependabot_alert: 'critical',
  secret_scanning_alert: 'critical',
  deployment_status: 'info',
  release: 'success'
};

function toArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  if (typeof v === 'string' && v.trim()) return [v.trim()];
  return [];
}

function getEventSeverity(event, payload) {
  if (event === 'dependabot_alert') return 'critical';
  if (event === 'secret_scanning_alert') return 'critical';
  if (event === 'check_run' || event === 'check_suite' || event === 'workflow_run' || event === 'workflow_job') {
    const conclusion = payload?.check_run?.conclusion || payload?.check_suite?.conclusion || payload?.workflow_run?.conclusion || payload?.workflow_job?.conclusion;
    if (['failure', 'timed_out', 'action_required'].includes(conclusion)) return 'critical';
    if (conclusion === 'success') return 'success';
    return 'warning';
  }
  if (event === 'pull_request' && payload?.action === 'closed' && payload?.pull_request?.merged) return 'success';
  return EVENT_SEVERITY[event] || 'info';
}

function parseTimeToMinutes(hhmm) {
  const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function getZonedMinutes(date, timeZone) {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const parts = Object.fromEntries(fmt.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
    return Number(parts.hour) * 60 + Number(parts.minute);
  } catch {
    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }
}

function inQuietHours(quietHours, now = new Date()) {
  if (!quietHours || typeof quietHours !== 'object') return false;
  const start = parseTimeToMinutes(quietHours.start);
  const end = parseTimeToMinutes(quietHours.end);
  if (start == null || end == null) return false;
  const tz = quietHours.timezone || 'UTC';
  const cur = getZonedMinutes(now, tz);
  if (start === end) return false;
  if (start < end) return cur >= start && cur < end;
  return cur >= start || cur < end; // overnight window
}

function extractMentions(rule, channel, severity) {
  const out = [];
  const mentions = rule?.mentions || {};
  out.push(...toArray(mentions.all));
  out.push(...toArray(mentions[severity]));
  const channelVal = mentions[channel];
  if (Array.isArray(channelVal) || typeof channelVal === 'string') {
    out.push(...toArray(channelVal));
  } else if (channelVal && typeof channelVal === 'object') {
    out.push(...toArray(channelVal.all));
    out.push(...toArray(channelVal[severity]));
    out.push(...toArray(channelVal[eventSeverityKey(severity)]));
  }
  out.push(...toArray(rule?.[`${channel}Mentions`]));
  return [...new Set(out)].filter(Boolean);
}

function eventSeverityKey(severity) {
  return severity;
}

function prefixMentions(text, mentions) {
  if (!mentions.length) return text || '';
  const prefix = mentions.join(' ');
  if (!text) return prefix;
  if (text.startsWith(prefix)) return text;
  return `${prefix}\n${text}`;
}

function shouldSuppress({ rule, event, severity }) {
  const only = toArray(rule?.only);
  const ignore = toArray(rule?.ignore);
  if (only.length && !only.includes(event)) return `event-not-in-only`;
  if (ignore.includes(event)) return `event-ignored`;
  const severities = toArray(rule?.severities);
  if (severities.length && !severities.includes(severity)) return `severity-filtered`;
  if (inQuietHours(rule?.quietHours) && !rule?.allowDuringQuietHours?.includes?.(event) && severity !== 'critical') return 'quiet-hours';
  return null;
}

export function routeNotification({ repoCfg = {}, event = 'generic', payload = null, embeds = [], text = '', telegramText = '', config = {} }) {
  const rules = { ...(config.notifications || {}), ...(repoCfg.notifications || {}) };
  const severity = getEventSeverity(event, payload);
  const suppressReason = shouldSuppress({ rule: rules, event, severity });
  if (suppressReason) return { suppressed: true, reason: suppressReason };

  const discordMentions = extractMentions(rules, 'discord', severity);
  const telegramMentions = extractMentions(rules, 'telegram', severity);

  const channelMap = rules.channels || {};
  const eventChannel = channelMap[event] || channelMap[severity] || channelMap.default || {};

  const nextRepoCfg = { ...repoCfg };
  if (eventChannel.discord) nextRepoCfg.discord = eventChannel.discord;
  if (eventChannel.telegram) nextRepoCfg.telegram = eventChannel.telegram;

  const coloredEmbeds = (embeds || []).map((e) => ({ ...e, color: e.color ?? SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.info }));

  let nextText = text || '';
  let nextTelegramText = telegramText || text || '';
  if (discordMentions.length && coloredEmbeds.length) {
    coloredEmbeds[0] = { ...coloredEmbeds[0], description: prefixMentions(coloredEmbeds[0].description || '', discordMentions) };
  } else if (discordMentions.length) {
    nextText = prefixMentions(nextText, discordMentions);
  }
  if (telegramMentions.length) nextTelegramText = prefixMentions(nextTelegramText, telegramMentions);

  return {
    suppressed: false,
    severity,
    repoCfg: nextRepoCfg,
    embeds: coloredEmbeds,
    text: nextText,
    telegramText: nextTelegramText
  };
}

export default { routeNotification };
