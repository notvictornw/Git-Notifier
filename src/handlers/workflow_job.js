import createBaseEmbed from '../utilities/embed.js';

export function handleWorkflowJob(payload) {
  const job = payload.workflow_job;
  if (!job) return [];
  
  const jobName = job.name || 'Job';
  const status = job.status || 'unknown';
  const conclusion = job.conclusion || 'Pending';
  const runId = job.run_id || 'unknown';
  const jobUrl = job.html_url || '';
  
  let color = 3447003; // blue (default)
  if (conclusion === 'success') {
    color = 3066993; // green
  } else if (['failure', 'timed_out'].includes(conclusion)) {
    color = 15158332; // red
  }
  
  const embed = createBaseEmbed(payload, 'workflow_job', color);
  embed.title = `⚙️ Workflow Job - ${embed.title}`;
  embed.url = jobUrl;
  embed.description = `**Job: [${jobName}](${jobUrl})**`;
  
  embed.fields.push(
    { name: 'Status', value: status, inline: true },
    { name: 'Conclusion', value: conclusion, inline: true },
    { name: 'Run ID', value: String(runId), inline: true }
  );
  
  return [embed];
}

export default handleWorkflowJob;
