# Supported GitHub Events

O Git Notifier formata eventos GitHub em embeds Discord (e fallback texto para Telegram). Alguns eventos também recebem enriquecimento via GitHub API.

## Mapa de eventos

| Evento | Handler | Enriquecimento API | Notas |
|---|---:|:---:|---|
| `ping` | `ping.js` | não | validação inicial do webhook |
| `push` | `push.js` | sim | branch, commits, checks do HEAD |
| `pull_request` | `pull_request.js` | sim | diff, reviewers, labels, mergeable, checks |
| `issues` | `issues.js` | sim | labels, assignees, milestone, comments |
| `issue_comment` | `issue_comment.js` | não | comentário em issue/PR |
| `commit_comment` | `commit_comment.js` | não | comentário em commit |
| `release` | `release.js` | não | published/prerelease/draft |
| `create` | `create.js` | não | branch/tag |
| `delete` | `delete.js` | não | branch/tag |
| `fork` | `fork.js` | não | fork criado |
| `watch` | `watch.js` | não | star/watch |
| `discussion` | `discussion.js` | não | discussões |
| `discussion_comment` | `discussion_comment.js` | não | comentários em discussão |
| `workflow_run` | `workflow_run.js` | não | status/conclusion de workflow |
| `workflow_job` | `workflow_job.js` | não | status/conclusion de job |
| `deployment` | `deployment.js` | não | deploy criado |
| `deployment_status` | `deployment_status.js` | não | status de deploy |

## Como adicionar um evento

1. Crie `src/handlers/<evento>.js` exportando função `(payload, enriched?) => embeds[]`.
2. Registre em `src/handlers/index.js`.
3. Se precisar de enriquecimento, adicione lógica em `src/services/enrich.js` e no dispatch em `src/routes/github.js`.
4. Atualize esta doc e testes se aplicável.

## Payloads

O servidor espera `Content-Type: application/json` e usa `req.rawBody` para HMAC. O payload é encaminhado ao handler correspondente ao header `X-GitHub-Event`.