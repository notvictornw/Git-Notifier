import createBaseEmbed from '../utilities/embed.js';

export function handleRelease(payload) {
  const embed = createBaseEmbed(payload, 'release', 9807270);
  
  const release = payload.release;
  if (!release) return [];
  
  const action = payload.action || 'published';
  const name = release.name || release.tag_name || 'Unnamed Release';
  const tag = release.tag_name || 'unknown';
  const isDraft = release.draft ? 'Yes' : 'No';
  const isPrerelease = release.prerelease ? 'Yes' : 'No';
  const releaseUrl = release.html_url || '';
  
  if (action === 'published') {
    embed.color = 16766720; // gold
  }
  
  embed.title = `🚀 Release ${action} - ${embed.title}`;
  embed.url = releaseUrl;
  embed.description = `**[${name}](${releaseUrl})**`;
  
  embed.fields.push(
    { name: 'Tag Name', value: tag, inline: true },
    { name: 'Draft', value: isDraft, inline: true },
    { name: 'Prerelease', value: isPrerelease, inline: true }
  );
  
  return [embed];
}

export default handleRelease;
