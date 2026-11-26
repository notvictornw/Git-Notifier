import createBaseEmbed from '../utilities/embed.js';

export function handleDeploymentStatus(payload) {
  const deployment = payload.deployment;
  const status = payload.deployment_status;
  if (!deployment || !status) return [];
  
  const env = deployment.environment || 'production';
  const state = status.state || 'unknown';
  const creator = status.creator?.login || deployment.creator?.login || 'unknown';
  const targetUrl = status.target_url || deployment.url || '';
  
  let color = 8358285; // grey (default)
  if (state === 'success') {
    color = 3066993; // green
  } else if (['failure', 'error'].includes(state)) {
    color = 15158332; // red
  } else if (state === 'in_progress') {
    color = 3447003; // blue
  }
  
  const embed = createBaseEmbed(payload, 'deployment_status', color);
  embed.title = `📦 Deployment Status: ${state.toUpperCase()} - ${embed.title}`;
  if (targetUrl) {
    embed.url = targetUrl;
    embed.description = `Deployment for **${env}** has updated to **${state}**.\n**[View Deployment](${targetUrl})**`;
  } else {
    embed.description = `Deployment for **${env}** has updated to **${state}**.`;
  }
  
  embed.fields.push(
    { name: 'Environment', value: env, inline: true },
    { name: 'Status', value: state, inline: true },
    { name: 'Creator', value: creator, inline: true }
  );
  
  return [embed];
}

export default handleDeploymentStatus;
