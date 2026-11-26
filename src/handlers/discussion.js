import createBaseEmbed from '../utilities/embed.js';

export function handleDiscussion(payload) {
  const embed = createBaseEmbed(payload, 'discussion', 9323437);
  
  const discussion = payload.discussion;
  if (!discussion) return [];
  
  const action = payload.action || 'created';
  const title = discussion.title || 'No Title';
  const number = discussion.number || 'unknown';
  const author = discussion.user?.login || 'unknown';
  const category = discussion.category?.name || 'General';
  const discussionUrl = discussion.html_url || '';
  const body = discussion.body || '';
  
  const truncatedBody = body.length > 300 ? `${body.substring(0, 297)}...` : body;
  
  embed.title = `💬 Discussion #${number} ${action} - ${embed.title}`;
  embed.url = discussionUrl;
  embed.description = `**[${title}](${discussionUrl})** in *${category}*\n\n${truncatedBody}`;
  
  embed.fields.push(
    { name: 'Author', value: author, inline: true },
    { name: 'Category', value: category, inline: true }
  );
  
  return [embed];
}

export default handleDiscussion;
