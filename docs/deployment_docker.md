# Docker Deployment

## Docker Compose (recomendado)

```bash
git clone https://github.com/notvictornw/Git-Notifier.git
cd Git-Notifier
cp config.yml.example config.yml
# editar config.yml
docker compose up -d --build
```

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
- Alternativamente passe env vars (`GITHUB_WEBHOOK_SECRET`, `GITHUB_TOKEN`, `TELEGRAM_*`, etc).
- Não embuta segredos na imagem.

## Build manual

```bash
docker build -t git-notifier:latest .
docker run -d --name git-notifier -p 3000:3000 \
  -v ${PWD}/config.yml:/usr/src/app/config.yml:ro \
  git-notifier:latest
```

No PowerShell use `${PWD}`; no bash `$(pwd)`.

## Healthcheck

O container expõe `GET /`. Você pode adicionar healthcheck no compose:

```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost:3000/"]
  interval: 30s
  timeout: 5s
  retries: 3
```