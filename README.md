# Git Notifier

Gateway **GitHub → Discord/Telegram** com **GitHub API**, enriquecimento de eventos, **digest diário** e **dashboard de saúde de repositórios**.

O projeto recebe webhooks do GitHub, valida assinatura HMAC, formata notificações ricas, consulta a API do GitHub (REST/GraphQL, PAT ou GitHub App) para adicionar contexto, gera relatórios operacionais e entrega um painel web/CLI para acompanhar PRs velhos, issues sem label e falhas de Actions.

## Visão geral

| Capacidade | O que faz | Onde vive |
|---|---|---|
| Webhook gateway | Recebe eventos GitHub, valida assinatura, roteia por repo | `src/routes/github.js`, `src/middleware/signature.js` |
| GitHub API | REST/GraphQL, PAT ou GitHub App installation token | `src/services/github.js` |
| Enriquecimento | Adiciona checks, diff, reviewers, labels, etc. ao evento | `src/services/enrich.js`, `src/handlers/*` |
| Digest bot | Resumo de PRs/issues/Actions, envio Discord/Telegram | `src/services/digest.js`, `src/routes/digest.js`, `src/services/scheduler.js` |
| Health dashboard | Score, stale PRs/issues, unlabeled, failing runs, UI web | `src/services/health.js`, `src/routes/dashboard.js` |
| CLI | Health/digest/repos em terminal, JSON ou Markdown | `src/cli.js` |
| Worker | Variante Cloudflare Worker para roteamento webhook leve | `worker/index.js` |

## Arquitetura

```text
                    GitHub Webhook (push)
                             |
                             v
                    POST /github (Express)
                             |
                 +-----------+-----------+
                 | signature + validation|
                 +-----------+-----------+
                             |
                 repo lookup (config.yml/env)
                             |
                 +-----------+-----------+
                 | optional enrichment   |----> GitHub REST/GraphQL API
                 | PR/Issue/Push         |<----
                 +-----------+-----------+
                             |
                    event handler -> embeds
                             |
                    notifier.notify()
                      /           \
             Discord queue     Telegram Bot API


Scheduler/CLI/Dashboard (pull)
        |
        +--> digest/health services --> GitHub API --> JSON/Markdown/HTML/Embeds
```

## Recursos principais

### 1) Gateway de webhooks
- Endpoint `POST /github`.
- Verificação HMAC SHA-256 (`X-Hub-Signature-256`) com raw body.
- Roteamento por repositório com compatibilidade retroativa:
  - legado: `"owner/repo": "https://discord..."`
  - novo: `"owner/repo": { discord, telegram, digest, health }`
- Fila por webhook Discord com retry para `429/5xx`.

### 2) Enriquecimento com GitHub API
Quando credenciais GitHub estão configuradas, eventos selecionados ganham contexto extra:

- **pull_request**: additions/deletions/changed files/commits, mergeable state, reviewers, labels, checks do head SHA, top files.
- **issues**: labels, assignees, milestone, comments, state reason.
- **push**: checks do HEAD commit.

O enriquecimento tem cache curto em memória e falha de forma graceful (webhook base ainda é entregue).

### 3) Digest bot (Discord/Telegram)
Gera relatório por repo com:
- PRs abertos e stale
- issues abertas e stale
- issues sem label
- falhas de GitHub Actions na janela recente

Pode ser disparado por:
- scheduler interno (cron 5 campos + timezone)
- API (`GET /api/digest`, `POST /api/digest/send`)
- CLI (`npm run digest`, `npm run digest:send`)

### 4) Repo Health Dashboard
Painel web em `/dashboard` + APIs JSON:
- score de saúde (0-100)
- PRs/Issues stale
- issues sem label / sem assignee
- failing/recent workflow runs
- status da API/rate limit

### 5) CLI

```bash
node src/cli.js repos
node src/cli.js health [owner/repo] [--json]
node src/cli.js digest [owner/repo] [--json]
node src/cli.js digest [owner/repo] --send
```

## Instalação

### Requisitos
- Node.js `>= 22`
- npm
- Um secret de webhook GitHub
- Para recursos de API/digest/dashboard: token GitHub (PAT/fine-grained) ou GitHub App

### Setup local

```bash
git clone https://github.com/notvictornw/Git-Notifier.git
cd Git-Notifier
npm install
cp config.yml.example config.yml
# edite config.yml
npm run dev
```

Servidor padrão: `http://localhost:3000`.

## Configuração

Arquivo: `config.yml` (ou `CONFIG_YML_CONTENT` com YAML completo). Exemplo: [`config.yml.example`](./config.yml.example).

```yaml
server:
  port: 3000

github:
  secret: "change-me-webhook-secret" # obrigatório
  token: ""                          # opcional: PAT / fine-grained token
  # app:
  #   appId: "123456"
  #   installationId: "12345678"
  #   privateKeyPath: "./private-key.pem"
  #   # ou privateKey: "-----BEGIN..."

telegram:
  botToken: ""
  chatId: ""

digest:
  enabled: false
  cron: "0 9 * * *"
  timezone: "UTC"
  lookbackHours: 24
  stalePrDays: 7
  staleIssueDays: 14
  maxItems: 10

dashboard:
  enabled: true
  path: "/dashboard"

repositories:
  "owner/repo":
    discord: "https://discord.com/api/webhooks/xxx/yyy"
    telegram: ""     # opcional override
    digest: true
    health: true
```

### Variáveis de ambiente

| Variável | Uso |
|---|---|
| `CONFIG_PATH` | Caminho alternativo para `config.yml` |
| `CONFIG_YML_CONTENT` | YAML completo inline |
| `GITHUB_WEBHOOK_SECRET` | Fallback do `github.secret` |
| `GITHUB_TOKEN` / `GH_TOKEN` | Token para GitHub API |
| `GITHUB_API_BASE` / `GITHUB_GRAPHQL_URL` | Endpoints API (GHE/custom) |
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_APP_INSTALLATION_ID` | Installation ID |
| `GITHUB_APP_PRIVATE_KEY` / `_PATH` | Private key PEM ou caminho |
| `TELEGRAM_BOT_TOKEN` | Token do bot Telegram |
| `TELEGRAM_CHAT_ID` | Chat padrão Telegram |

## Endpoints / API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Status do serviço + GitHub API/Telegram/digest/dashboard |
| POST | `/github` | Recebe webhooks GitHub |
| GET | `/api/status` | Status detalhado + rate limit |
| GET | `/api/repos` | Repos configurados |
| GET | `/api/health?repo=owner/repo` | Relatório(s) de saúde |
| GET | `/api/digest?repo=owner/repo&format=json\|md&send=false` | Gera digest; opcional envia |
| POST | `/api/digest/send?repo=owner/repo` | Gera e envia digest |
| GET | `/api/overview?repo=owner/repo` | Health + digest |
| GET | `/dashboard` | Dashboard HTML |

Detalhes: [`docs/api.md`](./docs/api.md).

## GitHub App / API

O projeto integra com a plataforma GitHub por dois caminhos:

- **Webhooks**: recebe eventos em `POST /github` com validação HMAC SHA-256.
- **GitHub API (REST/GraphQL)**: enriquece eventos, monta digest e calcula health com PAT ou GitHub App installation token.

Checklist rápido:
1. Configure `github.token` ou `github.app.*`.
2. Aponte webhooks para `/github`.
3. Valide `/api/status` e `/dashboard`.

## Docker

```bash
docker compose up -d --build
```

O compose monta `config.yml` read-only e aceita env vars. Veja [`docs/deployment_docker.md`](./docs/deployment_docker.md).

## Cloudflare Worker

Modo leve para webhook routing:

```bash
npm run build:worker
```

Use Node/Express para API completa, dashboard e scheduler.

## Scripts

```bash
npm run dev          # desenvolvimento com nodemon
npm start            # produção
npm run check        # syntax check
npm test             # node --test
npm run health -- owner/repo
npm run digest -- owner/repo
npm run digest:send -- owner/repo
npm run build:worker
```

## Estrutura do projeto

```text
.
??? .github/
?   ??? ISSUE_TEMPLATE/
?   ?   ??? bug_report.yml
?   ?   ??? config.yml
?   ?   ??? feature_request.yml
?   ??? workflows/ci.yml
?   ??? CODEOWNERS
?   ??? dependabot.yml
?   ??? PULL_REQUEST_TEMPLATE.md
??? docs/
??? src/
?   ??? app.js
?   ??? cli.js
?   ??? config/
?   ??? handlers/
?   ??? middleware/
?   ??? routes/
?   ??? services/
?   ??? utilities/
??? tests/
??? worker/
??? config.yml.example
??? CONTRIBUTING.md
??? Dockerfile
??? docker-compose.yml
??? LICENSE
??? README.md
??? SECURITY.md
??? SUPPORT.md
```

## Documentação

- [Getting Started](./docs/getting_started.md)
- [Configuration](./docs/configuration.md)
- [API](./docs/api.md)
- [Architecture](./docs/architecture.md)
- [GitHub Setup](./docs/github_setup.md)
- [Supported Events](./docs/events.md)
- [Local Development](./docs/local_development.md)
- [Docker Deployment](./docs/deployment_docker.md)
- [Troubleshooting](./docs/troubleshooting.md)

## Contribuindo

Veja [CONTRIBUTING.md](./CONTRIBUTING.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) e [SUPPORT.md](./SUPPORT.md).

## Licença

[MIT](./LICENSE) © notvictornw