import createBaseEmbed from '../utilities/embed.js';

export function handleDeployment(payload) {
  const deployment = payload.deployment;
  if (!deployment) return [];
  
  const env = deployment.environment || 'production';
  const creator = deployment.creator?.login || 'unknown';
  // Fallback URL to repository deployments if no specific URL is in payload
  const repoUrl = payload.repository?.html_url || '';
  const deploymentUrl = deployment.url || `${repoUrl}/deployments`;
  
  const embed = createBaseEmbed(payload, 'deployment', 1482885);
  embed.title = `📦 Deployment Triggered - ${embed.title}`;
  embed.url = deploymentUrl;
  embed.description = `A new deployment has been created for **${env}**.`;
  
  embed.fields.push(
    { name: 'Environment', value: env, inline: true },
    { name: 'Creator', value: creator, inline: true },
    { name: 'Status', value: 'Created', inline: true }
  );
  
  return [embed];
}

export default handleDeployment;
