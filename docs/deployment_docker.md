# Docker Deployment

## Docker Compose (recomendado)

```bash
git clone https://github.com/notvictornw/Git-Notifier.git
cd Git-Notifier
cp config.yml.example config.yml
# editar config.yml (github.secret + repositories.*.discord)
docker compose up -d --build
```

> Importante: crie `config.yml` antes do `docker compose up`. Se o arquivo não existir, o Docker pode criar um diretório no caminho do mount.

Logs:

```bash
docker compose logs -f
```

Parar:

```bash
docker compose down
```

## Config/secrets

- Monte `config.yml` como volume read-only (`./config.yml:/usr/src/app/config.yml:ro`).
- Alternativamente passe env vars (`GITHUB_WEBHOOK_SECRET`, `GITHUB_TOKEN`, `TELEGRAM_*`, etc) ou `CONFIG_YML_CONTENT`.
- Não embuta segredos na imagem. `.env.example` lista as env vars suportadas.

## Build manual

```bash
docker build -t git-notifier:latest .
docker run -d --name git-notifier -p 3000:3000 \
  -v ${PWD}/config.yml:/usr/src/app/config.yml:ro \
  git-notifier:latest
```

No PowerShell use `${PWD}`; no bash `$(pwd)`.

## Healthcheck

O `docker-compose.yml` já inclui healthcheck em `GET /`. Para build manual:

```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost:3000/"]
  interval: 30s
  timeout: 5s
  retries: 3
```