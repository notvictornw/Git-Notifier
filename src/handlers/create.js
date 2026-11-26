import createBaseEmbed from '../utilities/embed.js';

export function handleCreate(payload) {
  const embed = createBaseEmbed(payload, 'create', 1752220);
  
  const refType = payload.ref_type || 'ref';
  const ref = payload.ref || '';
  const creator = payload.sender?.login || 'unknown';
  
  embed.title = `🆕 Created ${refType} - ${embed.title}`;
  embed.description = `**${creator}** created the ${refType}: \`${ref}\``;
  
  return [embed];
}

export default handleCreate;
