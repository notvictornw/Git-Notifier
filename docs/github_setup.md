# GitHub Setup

## Webhook (recebimento de eventos)

1. Repo no GitHub → **Settings** → **Webhooks** → **Add webhook**.
2. **Payload URL**: `https://seu-dominio/github`
3. **Content type**: `application/json` (obrigatório).
4. **Secret**: mesmo valor de `github.secret` no `config.yml`.
5. **SSL verification**: habilitado em produção.
6. **Events**: "Send me everything" ou selecione os suportados (ver [events.md](./events.md)).
7. Salve. O evento `ping` deve retornar `200`.

### Troubleshooting rápido

- `401 Unauthorized`: secret diferente ou assinatura inválida.
- `400 Bad Request`: JSON malformado, content-type errado, headers ausentes.
- `404 Not Found`: URL sem `/github` ou repo não mapeado (repo não mapeado retorna 200 ignored no worker/modos específicos; no Express retorna ignored com mensagem).
- Timeout: seu servidor precisa responder rápido; entrega Discord é enfileirada.

## GitHub API (enriquecimento/digest/dashboard)

O gateway pode funcionar só com webhooks, mas recursos avançados precisam de API:

- enriquecimento de PR/issue/push
- digest
- health/dashboard
- rate limit/status

### Opção A: PAT / Fine-grained token

- Crie um token com acesso **read-only** aos repositórios monitorados.
- Configure `github.token` ou `GITHUB_TOKEN`.
- Bom para uso pessoal/simples.

### Opção B: GitHub App (recomendado para integração pública)

- Crie um GitHub App.
- Permissões mínimas sugeridas (read-only): Pull requests, Issues, Actions, Metadata, Contents (conforme necessidade).
- Instale o App nos repos alvo.
- Configure `github.app.appId`, `installationId`, `privateKey/privateKeyPath`.
- O servidor gera JWT e troca por installation token automaticamente.

## Segurança operacional

- Rotacione secrets/tokens expostos.
- Nunca commite `config.yml`.
- Use menor privilégio possível.