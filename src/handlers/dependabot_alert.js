import createBaseEmbed from '../utilities/embed.js';

const SEV_COLORS = { critical: 15158332, high: 15158332, medium: 16705372, low: 3447003 };

export function handleDependabotAlert(payload) {
  const alert = payload.alert || payload.dependabot_alert;
  if (!alert) return [];
  const severity = alert.security_advisory?.severity || alert.security_vulnerability?.severity || 'medium';
  const color = SEV_COLORS[severity] || 16705372;
  const embed = createBaseEmbed(payload, 'dependabot_alert', color);

  const pkg = alert.dependency?.package?.name || 'unknown';
  const ecosystem = alert.dependency?.package?.ecosystem || '';
  const summary = alert.security_advisory?.summary || 'Dependabot alert';
  const action = payload.action || 'updated';

  embed.title = `🚨 Dependabot alert ${action} - ${embed.title}`;
  embed.url = alert.html_url || payload.repository?.html_url || '';
  embed.description = `**${summary}**`;

  embed.fields.push(
    { name: 'Severity', value: String(severity).toUpperCase(), inline: true },
    { name: 'Package', value: `${pkg}${ecosystem ? ` (${ecosystem})` : ''}`, inline: true },
    { name: 'State', value: String(alert.state || 'unknown'), inline: true }
  );
  const patched = alert.security_vulnerability?.first_patched_version?.identifier;
  if (patched) embed.fields.push({ name: 'Patched in', value: `\`${patched}\``, inline: true });
  const manifest = alert.dependency?.manifest_path;
  if (manifest) embed.fields.push({ name: 'Manifest', value: `\`${manifest}\``, inline: true });
  const cve = alert.security_advisory?.cve_id;
  const ghsa = alert.security_advisory?.ghsa_id;
  if (cve || ghsa) embed.fields.push({ name: 'Advisory', value: [ghsa, cve].filter(Boolean).join(' / '), inline: true });

  return [embed];
}

export default handleDependabotAlert;
