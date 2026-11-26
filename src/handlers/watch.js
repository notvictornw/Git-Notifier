import createBaseEmbed from '../utilities/embed.js';

export function handleWatch(payload) {
  const embed = createBaseEmbed(payload, 'watch', 15277667);
  
  const action = payload.action || 'started';
  const starrer = payload.sender?.login || 'unknown';
  const starCount = payload.repository?.stargazers_count || 'unknown';
  
  embed.title = `⭐ Starred - ${embed.title}`;
  
  if (action === 'started') {
    embed.description = `**${starrer}** starred this repository!`;
  } else {
    embed.description = `**${starrer}** performed a watch action: ${action}`;
  }
  
  embed.fields.push({
    name: 'Total Stars',
    value: `${starCount} ⭐`,
    inline: true
  });
  
  return [embed];
}

export default handleWatch;
