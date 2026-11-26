#!/usr/bin/env node
import config from './config/config.js';
import { buildDigest, buildDigestsForAllRepos, formatDigestMarkdown } from './services/digest.js';
import { getRepoHealth, getAllReposHealth, formatHealthMarkdown } from './services/health.js';
import { runDigestJob } from './services/scheduler.js';

function usage() {
  console.log(`git-notifier CLI

Usage:
  node src/cli.js health [owner/repo] [--json]
  node src/cli.js digest [owner/repo] [--json] [--send]
  node src/cli.js repos

Options:
  --json   Output raw JSON
  --send   Build and send digest to configured Discord/Telegram targets
`);
}

function argFlag(name) {
  return process.argv.includes(name);
}

function argPos(index) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  return args[index] || '';
}

async function main() {
  const cmd = argPos(0);
  const repo = argPos(1);
  const json = argFlag('--json');

  if (!cmd || ['help', '--help', '-h'].includes(cmd)) {
    usage();
    return;
  }

  if (cmd === 'repos') {
    const repos = Object.values(config.repositories).map((r) => r.name);
    console.log(json ? JSON.stringify(repos, null, 2) : repos.join('\n'));
    return;
  }

  if (cmd === 'health') {
    const reports = repo ? [await getRepoHealth(repo)] : await getAllReposHealth();
    if (json) console.log(JSON.stringify(reports, null, 2));
    else console.log(reports.map(formatHealthMarkdown).join('\n\n---\n\n'));
    return;
  }

  if (cmd === 'digest') {
    if (argFlag('--send')) {
      const deliveries = repo
        ? await (async () => { const r = await buildDigest(repo); const { formatDigestDiscordEmbeds, formatDigestMarkdown } = await import('./services/digest.js'); const notifier = (await import('./services/notifier.js')).default; const { formatDigestForTelegram } = await import('./services/telegram.js'); await notifier.notify(r.repo, { embeds: formatDigestDiscordEmbeds(r), text: formatDigestMarkdown(r), telegramText: formatDigestForTelegram(r) }); return [{ repo: r.repo, ok: true }]; })()
        : await runDigestJob('cli');
      console.log(json ? JSON.stringify(deliveries, null, 2) : deliveries.map((d) => `${d.ok ? 'OK' : 'FAIL'} ${d.repo}${d.error ? ` - ${d.error}` : ''}`).join('\n'));
      return;
    }
    const reports = repo ? [await buildDigest(repo)] : await buildDigestsForAllRepos();
    if (json) console.log(JSON.stringify(reports, null, 2));
    else console.log(reports.map(formatDigestMarkdown).join('\n\n---\n\n'));
    return;
  }

  usage();
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});