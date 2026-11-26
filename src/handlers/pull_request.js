import createBaseEmbed from '../utilities/embed.js';

export function handlePullRequest(payload, enriched = null) {
  const embed = createBaseEmbed(payload, 'pull_request', 3447003);

  const pr = payload.pull_request;
  if (!pr) return [];

  const action = payload.action || 'updated';
  const title = pr.title || 'No Title';
  const number = pr.number || 'unknown';
  const author = pr.user?.login || 'unknown';
  const prUrl = pr.html_url || '';
  const isDraft = pr.draft ? 'Yes' : 'No';

  if (action === 'closed') {
    embed.color = pr.merged ? 10181046 : 15158332;
  } else if (action === 'opened' || action === 'reopened') {
    embed.color = 3066993;
  } else if (action === 'ready_for_review') {
    embed.color = 3447003;
  }

  embed.title = `🔀 Pull Request #${number} ${action} - ${embed.title}`;
  embed.url = prUrl;
  embed.description = `**[${title}](${prUrl})**`;

  embed.fields.push(
    { name: 'Author', value: author, inline: true },
    { name: 'State', value: pr.state === 'closed' && pr.merged ? 'merged' : pr.state, inline: true },
    { name: 'Draft', value: isDraft, inline: true }
  );

  if (enriched) {
    const delta = `+${enriched.additions ?? 0} / -${enriched.deletions ?? 0} (${enriched.changedFiles ?? 0} files, ${enriched.commits ?? 0} commits)`;
    embed.fields.push({ name: 'Changes', value: delta, inline: false });

    if (enriched.requestedReviewers?.length) {
      embed.fields.push({ name: 'Reviewers', value: enriched.requestedReviewers.map((r) => `\`${r}\``).join(', '), inline: false });
    }
    if (enriched.labels?.length) {
      embed.fields.push({ name: 'Labels', value: enriched.labels.map((l) => `\`${l}\``).join(', '), inline: false });
    }
    if (enriched.ci) {
      const icon = enriched.ci.status === 'success' ? '✅' : enriched.ci.status === 'failure' ? '❌' : enriched.ci.status === 'pending' ? '⏳' : '➖';
      let ciValue = `${icon} ${enriched.ci.summary}`;
      if (enriched.ci.failures?.length) {
        ciValue += `\n${enriched.ci.failures.map((f) => `• ${f.name}: ${f.conclusion}`).join('\n')}`;
      }
      embed.fields.push({ name: 'Checks', value: ciValue.slice(0, 1024), inline: false });
    }
    if (enriched.topFiles?.length) {
      const files = enriched.topFiles.map((f) => `\`${(f.status || '?')[0].toUpperCase()}\` ${f.filename}`).join('\n');
      embed.fields.push({ name: 'Top files', value: files.slice(0, 1024), inline: false });
    }
  }

  return [embed];
}

export default handlePullRequest;
