import createBaseEmbed from '../utilities/embed.js';

export function handleIssueComment(payload) {
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
  
  // Truncate comment body for clean display
  const truncatedBody = commentBody.length > 300 ? `${commentBody.substring(0, 297)}...` : commentBody;
  
  embed.title = `💬 Issue Comment ${action} - ${embed.title}`;
  embed.url = commentUrl;
  embed.description = `**Comment by ${commentAuthor} on Issue #${issueNumber}: [${issueTitle}](${issue.html_url})**\n\n${truncatedBody}`;
  
  return [embed];
}

export default handleIssueComment;
