import createBaseEmbed from '../utilities/embed.js';

export function handleIssues(payload, enriched = null) {
  const embed = createBaseEmbed(payload, 'issues', 15105570);

  const issue = payload.issue;
  if (!issue) return [];

  const action = payload.action || 'updated';
  const title = issue.title || 'No Title';
  const number = issue.number || 'unknown';
  const author = issue.user?.login || 'unknown';
  const issueUrl = issue.html_url || '';
  const state = issue.state || 'unknown';

  const labels = enriched?.labels?.length ? enriched.labels : (issue.labels || []).map((label) => label.name);
  const labelNames = labels.length ? labels.map((l) => `\`${l}\``).join(', ') : 'None';

  if (action === 'closed') {
    embed.color = 15158332;
  } else if (action === 'opened' || action === 'reopened') {
    embed.color = 3066993;
  }

  embed.title = `🐛 Issue #${number} ${action} - ${embed.title}`;
  embed.url = issueUrl;
  embed.description = `**[${title}](${issueUrl})**`;

  embed.fields.push(
    { name: 'Author', value: author, inline: true },
    { name: 'State', value: state, inline: true },
    { name: 'Labels', value: labelNames.slice(0, 1024), inline: false }
  );

  if (enriched) {
    if (enriched.assignees?.length) {
      embed.fields.push({ name: 'Assignees', value: enriched.assignees.map((a) => `\`${a}\``).join(', '), inline: true });
    }
    if (enriched.milestone) {
      embed.fields.push({ name: 'Milestone', value: enriched.milestone, inline: true });
    }
    embed.fields.push({ name: 'Comments', value: String(enriched.comments ?? 0), inline: true });
  }

  return [embed];
}

export default handleIssues;
