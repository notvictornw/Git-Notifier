# API

## HTTP Endpoints

### `GET /`
Status rápido do serviço.

Retorna: status, uptime, node version, memory usage, configuração GitHub/Telegram, digest/dashboard, contagem de repositórios.

### `POST /github`
Recebe webhooks do GitHub.

- Valida `X-Hub-Signature-256` (HMAC SHA-256) com `github.secret`.
- Requer `X-GitHub-Event`.
- Faz lookup do repo em `config.repositories`.
- Enriquece `pull_request`, `issues`, `push` via GitHub API quando configurada.
- Formata embed via handler do evento e envia por Discord/Telegram via notifier.
- Responde rápido; entrega ao Discord é assíncrona/filada.

Resposta típica:
```json
{ "status": "success", "message": "Notification for event 'pull_request' queued", "enriched": true }
```

### `GET /api/status`
Status detalhado: config GitHub (webhook/api/app/token), rate limit quando disponível, Telegram, digest, dashboard, contagem de repos.

### `GET /api/repos`
Lista repositórios configurados e flags (discord/telegram/digest/health).

### `GET /api/health?repo=owner/repo`
Retorna relatório(s) de saúde. Sem `repo`, retorna todos com `health != false`.

Campos relevantes por repo: `score`, `metrics`, `stalePrs`, `staleIssues`, `unlabeledIssues`, `failingRuns`, `recentRuns`.

### `GET /api/digest?repo=owner/repo&format=json|md&send=false`
Gera digest. `format=md` retorna Markdown. `send=true` envia para destinos configurados.

### `POST /api/digest/send?repo=owner/repo`
Gera e envia digest. Body JSON opcional pode passar overrides (`lookbackHours`, `stalePrDays`, etc).

### `GET /api/overview?repo=owner/repo`
Combina health + digest para o dashboard.

### `GET /dashboard`
Dashboard HTML simples consumindo as APIs acima.

## CLI

```bash
node src/cli.js repos
node src/cli.js health [owner/repo] [--json]
node src/cli.js digest [owner/repo] [--json] [--send]
```

## Segurança

- Sempre configure `github.secret`.
- Não exponha `config.yml`/tokens/private keys.
- Em produção, rode atrás de HTTPS/reverse proxy.