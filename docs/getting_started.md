# Getting Started

Guia rápido para colocar o Git Notifier rodando localmente.

## 1) Clonar e instalar

```bash
git clone https://github.com/notvictornw/Git-Notifier.git
cd Git-Notifier
npm install
```

Requisitos: Node.js `>= 22`.

## 2) Criar configuração

```bash
cp config.yml.example config.yml
```

Edite `config.yml`:
- `github.secret`: segredo do webhook GitHub (obrigatório)
- `repositories`: mapeamento repo → destino Discord/Telegram
- opcional: `github.token` ou `github.app.*` para API/enriquecimento/digest/dashboard
- opcional: `telegram.botToken/chatId`

## 3) Rodar

```bash
npm run dev
```

Verifique:

```bash
curl http://localhost:3000/
```

Resposta deve conter `status: "online"`.

## 4) Criar webhook Discord

Canal Discord → Edit Channel → Integrations → Webhooks → New Webhook → Copy URL.
Coloque a URL em `repositories["owner/repo"].discord` (ou string legado).

## 5) Expor localmente (para GitHub entregar webhook)

Use ngrok/cloudflared:

```bash
ngrok http 3000
# ou
cloudflared tunnel --url http://localhost:3000
```

Use a URL pública com `/github` no final.

## 6) Configurar webhook no GitHub

Repo → Settings → Webhooks → Add webhook:
- Payload URL: `https://SEU-TUNNEL/github`
- Content type: `application/json`
- Secret: igual ao `github.secret`
- Events: "Send me everything" ou selecione os eventos suportados

## 7) Testar

Faça um push/issue/PR no repo mapeado. Confirme:
- log do servidor com `200`
- mensagem no Discord/Telegram
- `GET /api/status` mostra config

## 8) Habilitar recursos de API

Defina `GITHUB_TOKEN` (ou PAT em config) ou credenciais de GitHub App. Depois:

```bash
npm run health -- owner/repo
npm run digest -- owner/repo
```

Abra o dashboard: `http://localhost:3000/dashboard`.

## Próximos

- [Configuration](./configuration.md)
- [API](./api.md)
- [GitHub Setup](./github_setup.md)
- [Troubleshooting](./troubleshooting.md)