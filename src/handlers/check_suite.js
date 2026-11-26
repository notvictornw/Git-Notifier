import createBaseEmbed from '../utilities/embed.js';

export function handleCheckSuite(payload) {
  const suite = payload.check_suite;
  if (!suite) return [];
  const conclusion = suite.conclusion || suite.status || 'unknown';
  const bad = ['failure', 'timed_out', 'action_required', 'cancelled'].includes(conclusion);
  const good = conclusion === 'success';
  const color = good ? 3066993 : bad ? 15158332 : 16705372;
  const embed = createBaseEmbed(payload, 'check_suite', color);

  embed.title = `🧰 Check Suite ${payload.action || 'updated'} - ${embed.title}`;
  embed.url = suite.html_url || payload.repository?.html_url || '';
  embed.description = `**${suite.app?.name || suite.app?.slug || 'Check suite'}**`;

  embed.fields.push(
    { name: 'Status', value: String(suite.status || 'unknown'), inline: true },
    { name: 'Conclusion', value: String(suite.conclusion || 'pending'), inline: true },
    { name: 'Branch', value: String(suite.head_branch || 'unknown'), inline: true }
  );
  if (suite.head_sha) embed.fields.push({ name: 'SHA', value: `\`${suite.head_sha.slice(0, 12)}\``, inline: true });
  return [embed];
}

export default handleCheckSuite;
