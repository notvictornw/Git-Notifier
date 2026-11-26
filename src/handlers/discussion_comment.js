import createBaseEmbed from '../utilities/embed.js';

export function handleDiscussionComment(payload) {
  const embed = createBaseEmbed(payload, 'discussion_comment', 13850112);
  
  const discussion = payload.discussion;
  const comment = payload.comment;
  if (!discussion || !comment) return [];
  
  const action = payload.action || 'created';
  const discussionTitle = discussion.title || 'No Title';
  const discussionNumber = discussion.number || 'unknown';
  const commentAuthor = comment.user?.login || 'unknown';
  const commentUrl = comment.html_url || '';
  const commentBody = comment.body || '';
  
  const truncatedBody = commentBody.length > 300 ? `${commentBody.substring(0, 297)}...` : commentBody;
  
  embed.title = `💬 Discussion Comment ${action} - ${embed.title}`;
  embed.url = commentUrl;
  embed.description = `**Comment by ${commentAuthor} on Discussion #${discussionNumber}: [${discussionTitle}](${discussion.html_url})**\n\n${truncatedBody}`;
  
  return [embed];
}

export default handleDiscussionComment;
