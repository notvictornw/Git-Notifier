# Troubleshooting

## Webhook não chega

- Confirme URL pública termina com `/github`.
- GitHub → Settings → Webhooks → Recent Deliveries: veja status/response.
- Servidor rodando? `GET /` deve responder.
- Content type deve ser `application/json`.

## `401 Invalid signature`

- `github.secret` no config deve ser **igual** ao Secret do webhook no GitHub.
- Proxy/reverse proxy não pode alterar body raw.
- Se usou `CONFIG_YML_CONTENT`, confirme secret correto.

## `400 Bad Request`

- JSON inválido, ausente `X-GitHub-Event`, ou content-type incorreto.
- Veja logs do servidor.

## Repo ignorado

- Verifique chave em `repositories` no formato `owner/repo` (case-insensitive).
- Confirme que o evento veio do repo esperado.

## GitHub API não configurada

- `/api/status` mostra `github.apiConfigured: false`.
- Configure `github.token`/`GITHUB_TOKEN` ou `github.app.*`.
- Para GitHub App: appId, installationId, privateKey válidos.

## Digest vazio/erro

- Sem credenciais API: endpoints retornam erro claro.
- Repo sem permissão/token sem acesso.
- Rate limit: veja `GET /api/status`.

## Telegram não envia

- `telegram.botToken` e `chatId` (ou por repo) configurados.
- Bot precisa ter permissão no chat/canal.

## Discord 429/5xx

- Normal sob burst; `src/services/discord.js` faz fila e retry com backoff/respeita `retry_after`.

## CI falhando por caminho hardcoded

- Testes devem resolver paths via `import.meta.url`/repo root, nunca caminho absoluto de máquina local.