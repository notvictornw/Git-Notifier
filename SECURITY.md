# Security Policy

A seguran?a do Git-Notifier ? levada a s?rio. Se voc? encontrou uma vulnerabilidade, **n?o abra issue p?blica**.

## Vers?es suportadas

| Vers?o | Suportada |
| --- | --- |
| `main` (?ltima) | ? |
| Releases antigas | ? |

## Como reportar uma vulnerabilidade

Use o canal privado do GitHub:

- **Preferred:** [Private vulnerability reporting](https://github.com/notvictornw/Git-Notifier/security/advisories/new)
- Se n?o conseguir usar o fluxo privado, abra um contato com o mantenedor pelo GitHub sem expor detalhes explor?veis publicamente.

### O que incluir

1. Descri??o clara da vulnerabilidade e impacto.
2. Passos de reprodu??o ou prova de conceito (PoC).
3. Componente afetado (webhook, assinatura HMAC, API GitHub, dashboard, CLI, Docker, worker etc.).
4. Vers?o/commit afetado.
5. Mitiga??o sugerida, se houver.

### O que esperar

- **Confirma??o inicial:** at? 72 horas.
- **Triagem:** avalia??o de severidade/impacto e plano de corre??o.
- **Corre??o:** patch e release conforme criticidade.
- **Divulga??o:** coordenada ap?s corre??o dispon?vel, quando aplic?vel.

## Escopo

Em escopo (exemplos):

- Bypass de valida??o de assinatura HMAC do webhook.
- Exposi??o de segredos/tokens por logs, endpoints, dashboard ou erros.
- SSRF, injection, path traversal, auth bypass, RCE.
- Vulnerabilidades em depend?ncias com impacto real no projeto.
- Falhas que permitam spoofing de eventos GitHub ou envio indevido de notifica??es.

Fora de escopo (exemplos):

- Relat?rios sem impacto de seguran?a demonstr?vel.
- Spam, engenharia social, ataques f?sicos.
- Vulnerabilidades apenas em servi?os de terceiros fora do controle do repo.
- Segredos expostos por usu?rios em forks/configura??es privadas pr?prias.

## Boas pr?ticas operacionais

- `config.yml` cont?m segredos e **n?o deve ser commitado** (j? est? no `.gitignore`).
- Use `config.yml.example` como base.
- Rotacione imediatamente: GitHub webhook secret, PAT/App private key, Discord webhooks, Telegram bot token.
- Use HTTPS no endpoint p?blico.
- Mantenha depend?ncias atualizadas; alertas do Dependabot devem ser tratados com prioridade.
