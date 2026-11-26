import createBaseEmbed from '../utilities/embed.js';

export function handleDelete(payload) {
  const embed = createBaseEmbed(payload, 'delete', 15158332);
  
  const refType = payload.ref_type || 'ref';
  const ref = payload.ref || '';
  const deleter = payload.sender?.login || 'unknown';
  
  embed.title = `🔥 Deleted ${refType} - ${embed.title}`;
  embed.description = `**${deleter}** deleted the ${refType}: \`${ref}\``;
  
  return [embed];
}

export default handleDelete;
