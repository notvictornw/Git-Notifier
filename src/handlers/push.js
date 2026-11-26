import createBaseEmbed from '../utilities/embed.js';

export function handlePush(payload, enriched = null) {
  const embed = createBaseEmbed(payload, 'push', 3066993);

  const ref = payload.ref || '';
  const branchName = ref.startsWith('refs/heads/') ? ref.replace('refs/heads/', '') : ref;
  const pusherName = payload.pusher?.name || payload.sender?.login || 'Unknown Pusher';
  const commits = payload.commits || [];
  const commitCount = Number.isInteger(payload.size) ? payload.size : commits.length;

  embed.title = `📦 Push to ${branchName} - ${embed.title}`;

  let description = `**Pusher:** ${pusherName}\n`;
  description += `**Total Commits:** ${commitCount}\n\n`;

  if (commitCount > 0) {
    description += `**Latest Commits:**\n`;
    const displayedCommits = commits.slice(0, 10);
    displayedCommits.forEach((commit) => {
      const shortHash = commit.id ? commit.id.substring(0, 7) : 'unknown';
      const commitUrl = commit.url || '';
      const fullMessage = commit.message || '';
      const firstLine = fullMessage.split('\n')[0];
      const message = firstLine.length > 60 ? `${firstLine.substring(0, 57)}...` : firstLine;
      const authorName = commit.author?.name || commit.author?.username || 'Unknown';
      description += `[\`${shortHash}\`](${commitUrl}) ${message} - *${authorName}*\n`;
    });
    if (commitCount > displayedCommits.length) {
      description += `*Showing the latest ${displayedCommits.length} of ${commitCount} commits.*\n`;
    }
  } else {
    description += '*No new commits (e.g. branch creation or tag push).*';
  }

  embed.description = description;

  if (enriched?.ci) {
    const icon = enriched.ci.status === 'success' ? '✅' : enriched.ci.status === 'failure' ? '❌' : enriched.ci.status === 'pending' ? '⏳' : '➖';
    let ciValue = `${icon} ${enriched.ci.summary}`;
    if (enriched.ci.failures?.length) {
      ciValue += `\n${enriched.ci.failures.map((f) => `• ${f.name}: ${f.conclusion}`).join('\n')}`;
    }
    embed.fields.push({ name: 'Checks (HEAD)', value: ciValue.slice(0, 1024), inline: false });
  }

  return [embed];
}

export default handlePush;
