# Local Development

## Rodar local

```bash
npm install
cp config.yml.example config.yml
npm run dev
```

## Checks úteis

```bash
npm run check
npm test
node src/cli.js --help
node src/cli.js repos
```

## Expor webhook local

GitHub precisa alcançar seu endpoint. Opções:

### ngrok
```bash
ngrok http 3000
```
Payload URL: `https://<id>.ngrok-free.app/github`

### cloudflared
```bash
cloudflared tunnel --url http://localhost:3000
```
Payload URL: `https://<id>.trycloudflare.com/github`

## Testar sem GitHub real

Você pode simular com `curl` (precisa gerar assinatura HMAC SHA-256 com o mesmo secret). Para desenvolvimento normal, é mais fácil usar webhook real + "Recent Deliveries" no GitHub.

## Estrutura de dev

- `src/app.js`: bootstrap Express
- `src/routes/*`: endpoints HTTP
- `src/services/*`: GitHub API, digest, health, notifier, scheduler
- `src/handlers/*`: formatação de eventos
- `tests/*`: node:test

## CI

Workflow em `.github/workflows/ci.yml` roda check, test e build do worker em Node 22/24.