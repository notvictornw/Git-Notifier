# Configuration

Configuração via `config.yml` (ou `CONFIG_YML_CONTENT` com YAML completo). Veja `config.yml.example`.

## Estrutura

```yaml
server:
  port: 3000

github:
  secret: "required-webhook-secret"
  token: ""                 # opcional: PAT / fine-grained token
  apiBase: "https://api.github.com"
  graphqlUrl: "https://api.github.com/graphql"
  app:                      # opcional: GitHub App
    appId: ""
    installationId: ""
    privateKeyPath: ""      # ou privateKey

telegram:
  botToken: ""
  chatId: ""

digest:
  enabled: false
  cron: "0 9 * * *"        # min hour dom month dow
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
    discord: "https://discord.com/api/webhooks/..."
    telegram: ""            # opcional; fallback para telegram.chatId
    digest: true
    health: true
```

## Repositórios: compatibilidade

Formato antigo:

```yaml
repositories:
  "owner/repo": "https://discord.com/api/webhooks/..."
```

Formato novo suporta flags e Telegram por repo.

## Variáveis de ambiente

| Variável | Efeito |
|---|---|
| `CONFIG_PATH` | Caminho alternativo do config.yml |
| `CONFIG_YML_CONTENT` | YAML completo inline (cloud/secret) |
| `GITHUB_WEBHOOK_SECRET` | Fallback para `github.secret` |
| `GITHUB_TOKEN` / `GH_TOKEN` | Token GitHub API |
| `GITHUB_API_BASE` / `GITHUB_GRAPHQL_URL` | Endpoints GitHub (GHE compat) |
| `GITHUB_APP_ID` | App ID |
| `GITHUB_APP_INSTALLATION_ID` | Installation ID |
| `GITHUB_APP_PRIVATE_KEY` / `_PATH` | Private key PEM ou caminho |
| `TELEGRAM_BOT_TOKEN` | Bot token |
| `TELEGRAM_CHAT_ID` | Chat default |

## Segurança

- `config.yml` é ignorado pelo git; use `config.yml.example`.
- Rotacione segredos se já foram commitados (o histórico antigo deste repo exigiu scrub).
- Use tokens com menor privilégio possível (read-only para repos monitorados).