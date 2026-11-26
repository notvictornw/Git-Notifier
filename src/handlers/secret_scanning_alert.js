import createBaseEmbed from '../utilities/embed.js';

export function handleSecretScanningAlert(payload) {
  const alert = payload.alert || payload.secret_scanning_alert;
  if (!alert) return [];
  const action = payload.action || 'updated';
  const state = alert.state || 'unknown';
  const color = state === 'resolved' ? 3066993 : 15158332;
  const embed = createBaseEmbed(payload, 'secret_scanning_alert', color);

  const secretType = alert.secret_type_display_name || alert.secret_type || 'Secret';
  embed.title = `🔐 Secret scanning alert ${action} - ${embed.title}`;
  embed.url = alert.html_url || payload.repository?.html_url || '';
  embed.description = `**${secretType}**`;

  embed.fields.push(
    { name: 'State', value: String(state), inline: true },
    { name: 'Action', value: String(action), inline: true }
  );
  if (alert.resolution) embed.fields.push({ name: 'Resolution', value: String(alert.resolution), inline: true });
  if (alert.push_protection_bypassed !== undefined) embed.fields.push({ name: 'Push protection bypassed', value: String(alert.push_protection_bypassed), inline: true });
  return [embed];
}

export default handleSecretScanningAlert;
