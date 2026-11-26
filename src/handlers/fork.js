import createBaseEmbed from '../utilities/embed.js';

export function handleFork(payload) {
  const embed = createBaseEmbed(payload, 'fork', 3427166);
  
  const forkee = payload.forkee;
  if (!forkee) return [];
  
  const forker = payload.sender?.login || 'unknown';
  const forkeeName = forkee.full_name || 'unknown';
  const forkeeUrl = forkee.html_url || '';
  
  embed.title = `🍴 Forked - ${embed.title}`;
  embed.description = `**${forker}** forked this repository to [${forkeeName}](${forkeeUrl})`;
  
  return [embed];
}

export default handleFork;
