import createBaseEmbed from '../utilities/embed.js';

export function handlePullRequestReview(payload, enriched = null) {
  const review = payload.review;
  const pr = payload.pull_request;
  if (!review || !pr) return [];

  const state = String(review.state || 'commented').toLowerCase();
  const color = state === 'approved' ? 3066993 : state.includes('changes_requested') ? 15158332 : 3447003;
  const embed = createBaseEmbed(payload, 'pull_request_review', color);

  const reviewer = review.user?.login || 'unknown';
  const prNum = pr.number ?? '?';
  const prTitle = pr.title || 'No Title';
  const body = (review.body || '').trim();
  const snippet = body ? (body.length > 300 ? `${body.slice(0, 297)}...` : body) : '_No review body_';

  embed.title = `📝 PR Review ${state.replace(/_/g, ' ')} - ${embed.title}`;
  embed.url = review.html_url || pr.html_url || '';
  embed.description = `**${reviewer}** reviewed PR [#${prNum} ${prTitle}](${pr.html_url || ''})\n\n${snippet}`;

  embed.fields.push(
    { name: 'State', value: state, inline: true },
    { name: 'Reviewer', value: reviewer, inline: true }
  );
  if (enriched?.ci) {
    const icon = enriched.ci.status === 'success' ? '✅' : enriched.ci.status === 'failure' ? '❌' : enriched.ci.status === 'pending' ? '⏳' : '➖';
    embed.fields.push({ name: 'Checks', value: `${icon} ${enriched.ci.summary}`, inline: false });
  }

  return [embed];
}

export default handlePullRequestReview;
