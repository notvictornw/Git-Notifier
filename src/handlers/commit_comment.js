import createBaseEmbed from '../utilities/embed.js';

export function handleCommitComment(payload) {
  const embed = createBaseEmbed(payload, 'commit_comment', 10181046);
  
  const comment = payload.comment;
  if (!comment) return [];
  
  const action = payload.action || 'created';
  const commitId = comment.commit_id || '';
  const shortCommit = commitId.substring(0, 7) || 'unknown';
  const commentAuthor = comment.user?.login || 'unknown';
  const commentUrl = comment.html_url || '';
  const commentBody = comment.body || '';
  
  const truncatedBody = commentBody.length > 300 ? `${commentBody.substring(0, 297)}...` : commentBody;
  
  embed.title = `💬 Commit Comment ${action} - ${embed.title}`;
  embed.url = commentUrl;
  embed.description = `**Comment by ${commentAuthor} on commit [\`${shortCommit}\`](${commentUrl})**\n\n${truncatedBody}`;
  
  return [embed];
}

export default handleCommitComment;
