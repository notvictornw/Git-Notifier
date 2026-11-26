# Security Policy

A segurança do Git-Notifier é levada a sério. Se você encontrou uma vulnerabilidade, **não abra issue pública**.

## Versões suportadas

| Versão | Suportada |
| --- | --- |
| `main` (última) | ✅ |
| Releases antigas | ❌ |

## Como reportar uma vulnerabilidade

Use o canal privado do GitHub:

- **Preferred:** [Private vulnerability reporting](https://github.com/notvictornw/Git-Notifier/security/advisories/new)
- Se não conseguir usar o fluxo privado, abra um contato com o mantenedor pelo GitHub sem expor detalhes exploráveis publicamente.

### O que incluir

1. Descrição clara da vulnerabilidade e impacto.
2. Passos de reprodução ou prova de conceito (PoC).
3. Componente afetado (webhook, assinatura HMAC, API GitHub, dashboard, CLI, Docker, worker etc.).
4. Versão/commit afetado.
5. Mitigação sugerida, se houver.

### O que esperar

- **Confirmação inicial:** até 72 horas.
- **Triagem:** avaliação de severidade/impacto e plano de correção.
- **Correção:** patch e release conforme criticidade.
- **Divulgação:** coordenada após correção disponível, quando aplicável.

## Escopo

Em escopo (exemplos):

- Bypass de validação de assinatura HMAC do webhook.
- Exposição de segredos/tokens por logs, endpoints, dashboard ou erros.
- SSRF, injection, path traversal, auth bypass, RCE.
- Vulnerabilidades em dependências com impacto real no projeto.
- Falhas que permitam spoofing de eventos GitHub ou envio indevido de notificações.

Fora de escopo (exemplos):

- Relatórios sem impacto de segurança demonstrável.
- Spam, engenharia social, ataques físicos.
- Vulnerabilidades apenas em serviços de terceiros fora do controle do repo.
- Segredos expostos por usuários em forks/configurações privadas próprias.

## Boas práticas operacionais

- `config.yml` contém segredos e **não deve ser commitado** (já está no `.gitignore`).
- Use `config.yml.example` como base.
- Rotacione imediatamente: GitHub webhook secret, PAT/App private key, Discord webhooks, Telegram bot token.
- Use HTTPS no endpoint público.
- Mantenha dependências atualizadas; alertas do Dependabot devem ser tratados com prioridade.
