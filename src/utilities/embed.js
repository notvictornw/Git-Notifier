export function createBaseEmbed(payload, eventName, color) {
  const repoName = payload.repository?.full_name || 'Unknown Repository';
  const repoUrl = payload.repository?.html_url || '';
  const authorName = payload.sender?.login || 'GitHub System';
  const authorAvatar = payload.sender?.avatar_url || '';
  const authorUrl = payload.sender?.html_url || '';

  return {
    color,
    title: repoName,
    url: repoUrl,
    author: {
      name: authorName,
      icon_url: authorAvatar,
      url: authorUrl
    },
    footer: {
      text: `GitHub Webhooks • ${eventName}`
    },
    timestamp: new Date().toISOString(),
    fields: []
  };
}

export default createBaseEmbed;
