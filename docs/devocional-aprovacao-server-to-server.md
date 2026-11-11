# Integração server-to-server do Devocional com a plataforma

## Rota

```http
POST /api/v1/internal/devocional/approval/check
Authorization: Bearer <token-de-integracao>
Content-Type: application/json
X-Request-Id: <uuid-opcional>
```

## Requisição

```json
{
  "memberId": "id-do-membro-na-plataforma",
  "churchId": "id-da-igreja-na-plataforma"
}
```

## Resposta

A resposta usa `contractVersion: "1.0"` e normaliza a decisão para:

- `aprovado`
- `pendente`
- `recusado`
- `suspenso`
- `cancelado`
- `desconhecido`

Somente `aprovado` retorna `permissions.devocional: true`. Estados desconhecidos, ausência de vínculo e indisponibilidade da fonte nunca liberam acesso.

## Configuração

A plataforma recebe somente o hash SHA-256 do token de integração:

```env
DEVOCIONAL_INTEGRATION_TOKEN_SHA256=<hash-sha256>
```

O token bruto não deve ser registrado em logs, respostas ou no frontend.

## Segurança

A rota valida o `status_aprovacao` do usuário e o vínculo em `vinculos_usuario_igreja`. A API Devocional não pode enviar ou escolher o próprio status. Erros internos retornam `APPROVAL_UNAVAILABLE` sem expor detalhes do PocketBase.
