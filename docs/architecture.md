# Architecture

## Visão geral

O Git Notifier opera em dois planos:

1. **Plano de eventos (webhook push)**: GitHub envia webhook → Express valida assinatura → handler formata embed → enriquecimento opcional via GitHub API → notifier envia para Discord/Telegram.
2. **Plano de polling/síntese (API pull)**: CLI, dashboard ou scheduler consultam GitHub API para montar digest/health reports.

## Componentes

- `src/app.js`: bootstrap Express, middlewares, routers, scheduler.
- `src/config/config.js`: carrega YAML/env, normaliza repos (string ou objeto), valida porta/secret.
- `src/routes/github.js`: endpoint `/github`, validação já feita por middleware de assinatura, enriquecimento condicional, fanout por notifier.
- `src/routes/health.js`: status do serviço + status de configuração da API.
- `src/routes/digest.js`: API de digest (gerar/enviar).
- `src/routes/dashboard.js`: UI HTML + APIs JSON para health/repos/status/overview.
- `src/services/github.js`: client GitHub REST/GraphQL; PAT ou GitHub App installation token.
- `src/services/enrich.js`: busca dados extras para PR/issue/push com cache curto.
- `src/services/digest.js`: agrega PRs/issues/workflow runs e classifica stale/unlabeled/failing.
- `src/services/health.js`: calcula score e listas operacionais por repo.
- `src/services/scheduler.js`: tick 30s, cron 5 campos, timezone, dispara digest.
- `src/services/notifier.js`: abstrai entrega Discord+Telegram.
- `src/services/discord.js`: fila por webhook, retry 429/5xx.
- `src/services/telegram.js`: Bot API, chunking, formatação HTML.
- `src/handlers/*`: mapeamento evento GitHub → embeds Discord.
- `worker/index.js`: variante Cloudflare Worker (webhook routing leve; sem scheduler/dashboard/API completa).

## Fluxo webhook

```text
GitHub -> POST /github
  -> signature middleware (raw body HMAC SHA-256)
  -> validator
  -> github route
      -> repo config lookup
      -> optional enrichment (GitHub API)
      -> handler(payload, enriched)
      -> notifier.notify(repo, embeds)
          -> discord queue -> Discord webhook
          -> telegram sendMessage
  -> 200 queued
```

## Fluxo digest/health

```text
scheduler/CLI/dashboard
  -> digest/health service
  -> github.js REST calls (PRs/issues/workflow runs/repo)
  -> aggregate + score + format
  -> JSON/Markdown/Discord embeds/Telegram HTML
```

## Design decisions

- **Sem DB**: estado operacional vem da API do GitHub; cache só em memória.
- **Backward-compatible config**: evita quebrar installs existentes.
- **Segredos fora do git**: `config.yml` ignorado; `config.yml.example` versionado.
- **Falha parcial tolerada**: enriquecimento falha? webhook ainda notifica payload base. Repo falha no digest? reporta erro por repo.