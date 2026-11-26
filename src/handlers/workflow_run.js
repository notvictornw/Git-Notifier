import createBaseEmbed from '../utilities/embed.js';

export function handleWorkflowRun(payload) {
  const run = payload.workflow_run;
  if (!run) return [];
  
  const workflowName = run.name || payload.workflow?.name || 'Workflow';
  const status = run.status || 'unknown';
  const conclusion = run.conclusion || 'Pending';
  const branch = run.head_branch || 'unknown';
  const commitSha = run.head_sha || '';
  const shortSha = commitSha.substring(0, 7) || 'unknown';
  const runUrl = run.html_url || '';
  
  // Set color based on conclusion
  let color = 3447003; // blue (default)
  if (conclusion === 'success') {
    color = 3066993; // green
  } else if (['failure', 'timed_out'].includes(conclusion)) {
    color = 15158332; // red
  } else if (conclusion === 'cancelled') {
    color = 8358285; // grey
  }
  
  const embed = createBaseEmbed(payload, 'workflow_run', color);
  embed.title = `⚙️ Workflow Run - ${embed.title}`;
  embed.url = runUrl;
  embed.description = `**[${workflowName}](${runUrl})**`;
  
  embed.fields.push(
    { name: 'Branch', value: branch, inline: true },
    { name: 'Commit SHA', value: `\`${shortSha}\``, inline: true },
    { name: 'Status', value: status, inline: true },
    { name: 'Conclusion', value: conclusion, inline: true }
  );
  
  return [embed];
}

export default handleWorkflowRun;
