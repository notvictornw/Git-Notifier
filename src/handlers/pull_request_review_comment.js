import createBaseEmbed from '../utilities/embed.js';

export function handlePullRequestReviewComment(payload, enriched = null) {
  const comment = payload.comment;
  const pr = payload.pull_request;
  if (!comment || !pr) return [];

  const action = payload.action || 'created';
  const embed = createBaseEmbed(payload, 'pull_request_review_comment', 3447003);
  const author = comment.user?.login || 'unknown';
  const prNum = pr.number ?? '?';
  const prTitle = pr.title || 'No Title';
  const body = (comment.body || '').trim();
  const snippet = body ? (body.length > 300 ? `${body.slice(0, 297)}...` : body) : '_No comment body_';
  const path = comment.path ? `\`${comment.path}\`` : 'unknown file';

  embed.title = `💬 PR Review Comment ${action} - ${embed.title}`;
  embed.url = comment.html_url || pr.html_url || '';
  embed.description = `**${author}** commented on PR [#${prNum} ${prTitle}](${pr.html_url || ''}) at ${path}\n\n${snippet}`;

  embed.fields.push(
    { name: 'Author', value: author, inline: true },
    { name: 'Action', value: action, inline: true }
  );
  if (enriched?.ci) {
    const icon = enriched.ci.status === 'success' ? '✅' : enriched.ci.status === 'failure' ? '❌' : enriched.ci.status === 'pending' ? '⏳' : '➖';
    embed.fields.push({ name: 'Checks', value: `${icon} ${enriched.ci.summary}`, inline: false });
  }
  return [embed];
}

export default handlePullRequestReviewComment;
