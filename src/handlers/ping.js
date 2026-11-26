import createBaseEmbed from '../utilities/embed.js';

export function handlePing(payload) {
  const embed = createBaseEmbed(payload, 'ping', 7506394);
  const zen = payload.zen || 'No zen advice provided.';
  
  embed.title = `🔔 Ping Event - ${embed.title}`;
  embed.description = `GitHub webhook successfully configured!\n\n**Zen:** *${zen}*`;
  
  return [embed];
}

export default handlePing;
