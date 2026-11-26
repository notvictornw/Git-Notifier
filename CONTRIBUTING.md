# Contributing

Obrigado por contribuir com o Git-Notifier.

## Antes de come?ar

- Leia o [README](./README.md) e a [documenta??o](./docs/).
- Para bugs, use o template de **Bug report**.
- Para ideias, use o template de **Feature request**.
- Para vulnerabilidades, siga a [Security Policy](./SECURITY.md). **Nunca** reporte vulnerabilidade em issue p?blica.

## Desenvolvimento local

```bash
npm ci
npm run check
npm test
npm run build:worker
npm run dev
```

## Padr?es

- Node.js >= 22, ESM (`type: module`).
- Mudan?as pequenas, focadas e com documenta??o quando necess?rio.
- N?o commitar segredos (`config.yml`, tokens, webhooks, private keys).
- Se alterar config/comportamento, atualize `config.yml.example`, `README.md` e `docs/`.

## Pull Requests

1. Crie branch a partir de `main`.
2. Fa?a commits claros e separados por categoria.
3. Rode `npm run check` e `npm test`.
4. Abra PR usando o template.
5. Descreva risco, teste e impacto.

## Commits

Sugest?o de prefixos:

- `fix:` corre??o
- `feat:` funcionalidade
- `docs:` documenta??o
- `test:` testes
- `ci:` CI/workflows
- `chore:` manuten??o
- `fix(security):` corre??o de seguran?a

## Revis?o

PRs podem receber pedidos de ajuste por clareza, seguran?a, compatibilidade ou cobertura de testes. Mantenha o tom respeitoso conforme o [Code of Conduct](./CODE_OF_CONDUCT.md).
