import createBaseEmbed from '../utilities/embed.js';

export function handleCheckRun(payload) {
  const run = payload.check_run;
  if (!run) return [];
  const conclusion = run.conclusion || run.status || 'unknown';
  const bad = ['failure', 'timed_out', 'action_required', 'cancelled'].includes(conclusion);
  const good = conclusion === 'success';
  const color = good ? 3066993 : bad ? 15158332 : 16705372;
  const embed = createBaseEmbed(payload, 'check_run', color);

  embed.title = `🧪 Check Run ${payload.action || 'updated'} - ${embed.title}`;
  embed.url = run.html_url || run.details_url || payload.repository?.html_url || '';
  embed.description = `**${run.name || 'Check'}**`;

  embed.fields.push(
    { name: 'Status', value: String(run.status || 'unknown'), inline: true },
    { name: 'Conclusion', value: String(run.conclusion || 'pending'), inline: true },
    { name: 'App', value: String(run.app?.name || run.app?.slug || 'unknown'), inline: true }
  );
  if (run.head_sha) embed.fields.push({ name: 'SHA', value: `\`${run.head_sha.slice(0, 12)}\`` , inline: true });
  if (run.output?.title) embed.fields.push({ name: 'Output', value: String(run.output.title).slice(0, 1024), inline: false });
  return [embed];
}

export default handleCheckRun;
