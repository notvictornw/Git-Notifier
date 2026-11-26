import createBaseEmbed from '../utilities/embed.js';

export function handleIssueComment(payload, enriched = null) {
  const embed = createBaseEmbed(payload, 'issue_comment', 15844367);

  const issue = payload.issue;
  const comment = payload.comment;
  if (!issue || !comment) return [];

  const action = payload.action || 'created';
  const issueNumber = issue.number || 'unknown';
  const commentAuthor = comment.user?.login || 'unknown';
  const commentUrl = comment.html_url || '';
  const commentBody = comment.body || '';
  const issueTitle = issue.title || 'No Title';

  const truncatedBody = commentBody.length > 300 ? `${commentBody.substring(0, 297)}...` : commentBody;

  embed.title = `💬 Issue Comment ${action} - ${embed.title}`;
  embed.url = commentUrl;
  embed.description = `**Comment by ${commentAuthor} on Issue #${issueNumber}: [${issueTitle}](${issue.html_url})**\n\n${truncatedBody}`;

  if (enriched?.labels?.length) embed.fields.push({ name: 'Labels', value: enriched.labels.map((l) => `\`${l}\``).join(', ').slice(0, 1024), inline: false });
  if (enriched?.assignees?.length) embed.fields.push({ name: 'Assignees', value: enriched.assignees.map((a) => `\`${a}\``).join(', '), inline: true });

  return [embed];
}

export default handleIssueComment;
