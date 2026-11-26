# Contributing

Obrigado por contribuir com o Git-Notifier.

## Antes de começar

- Leia o [README](./README.md) e a [documentação](./docs/).
- Para bugs, use o template de **Bug report**.
- Para ideias, use o template de **Feature request**.
- Para vulnerabilidades, siga a [Security Policy](./SECURITY.md). **Nunca** reporte vulnerabilidade em issue pública.

## Desenvolvimento local

```bash
npm ci
npm run check
npm test
npm run build:worker
npm run dev
```

## Padrões

- Node.js >= 22, ESM (`type: module`).
- Mudanças pequenas, focadas e com documentação quando necessário.
- Não commitar segredos (`config.yml`, tokens, webhooks, private keys).
- Se alterar config/comportamento, atualize `config.yml.example`, `README.md` e `docs/`.

## Pull Requests

1. Crie branch a partir de `main`.
2. Faça commits claros e separados por categoria.
3. Rode `npm run check` e `npm test`.
4. Abra PR usando o template.
5. Descreva risco, teste e impacto.

## Commits

Sugestão de prefixos:

- `fix:` correção
- `feat:` funcionalidade
- `docs:` documentação
- `test:` testes
- `ci:` CI/workflows
- `chore:` manutenção
- `fix(security):` correção de segurança

## Revisão

PRs podem receber pedidos de ajuste por clareza, segurança, compatibilidade ou cobertura de testes. Mantenha o tom respeitoso conforme o [Code of Conduct](./CODE_OF_CONDUCT.md).
