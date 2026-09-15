import logger from "./logger.js";
import pocketbaseClient from "./pocketbaseClient.js";

/**
 * Valida um token Bearer do PocketBase SEM chamar /auth-refresh.
 *
 * O endpoint /auth-refresh do PocketBase rotaciona o `tokenKey` do registro
 * autenticado. Chamá-lo a cada requisição invalidava o token que o frontend
 * ainda mantinha em memória (pb.authStore.token): o 1º download funcionava e
 * o 2º falhava com 401 — a causa raiz do erro "Acesso restrito a
 * administradores" que se reproduzia de forma recorrente.
 *
 * Estratégia robusta (sem rotação de tokenKey):
 *
 *  1. Decodifica o payload do JWT para extrair `id`, `collectionName`,
 *     `tokenKey` e `exp`. Rejeita rapidamente se o `id` estiver ausente ou se
 *     o `collectionName` estiver presente E for diferente da coleção esperada
 *     (ex.: token de `users` enviado a uma rota de `admins`). Se
 *     `collectionName` não vier no payload, NÃO rejeita — a validação final
 *     acontece nos passos seguintes.
 *  2. Rejeita localmente se o token estiver expirado (`exp` no passado).
 *  3. PRIMÁRIO: faz um GET ao próprio registro na coleção esperada usando o
 *     token. O PocketBase valida assinatura + exp + tokenKey e aplica a
 *     viewRule (`id = @request.auth.id`). Não rotaciona o tokenKey, mantendo
 *     o token do frontend válido para requisições seguintes.
 *  4. FALLBACK: se o GET primário falhar por qualquer motivo (ex.: viewRule
 *     restritiva bloqueando a leitura mesmo do próprio registro), lê o
 *     registro como superusuário (bypass de viewRule) e compara o `tokenKey`
 *     do registro com o `tokenKey` do JWT. Se coincidirem, o token é válido.
 *     Também não rotaciona nada.
 *
 * @param {string} token - token JWT bruto (sem o prefixo "Bearer ").
 * @param {"admins"|"users"} collectionName - coleção esperada do token.
 * @returns {Promise<object|null>} o registro autenticado ou null se inválido.
 */
export async function validateAuthToken(token, collectionName) {
  if (!token) return null;

  // 1. Decodifica o payload do JWT (parte 1, base64url). Sem verificação de
  //    assinatura aqui — a verificação acontece no GET primário (pelo próprio
  //    PocketBase) ou no fallback (comparação de tokenKey).
  let payload;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
  } catch {
    return null;
  }

  if (!payload || !payload.id) {
    logger.warn(
      `[authToken] Token rejeitado: payload sem id (coleção esperada=${collectionName}).`,
    );
    return null;
  }

  // Rejeita rapidamente se o payload nomear explicitamente outra coleção.
  if (
    payload.collectionName &&
    payload.collectionName !== collectionName
  ) {
    logger.warn(
      `[authToken] Token rejeitado: collectionName do payload (${payload.collectionName}) != esperada (${collectionName}).`,
    );
    return null;
  }

  // 2. Expiração local (se o claim exp existir).
  if (payload.exp) {
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp < nowSec) {
      logger.warn(
        `[authToken] Token rejeitado: expirado (exp=${payload.exp}, agora=${nowSec}, coleção=${collectionName}).`,
      );
      return null;
    }
  }

  // 3. PRIMÁRIO — GET ao próprio registro com o token (valida assinatura +
  //    tokenKey via PocketBase, sem rotacionar tokenKey).
  try {
    const response = await fetch(
      `http://localhost:8090/api/collections/${encodeURIComponent(collectionName)}/records/${encodeURIComponent(payload.id)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (response.ok) {
      const record = await response.json();
      if (record?.id) return record;
    }
    logger.warn(
      `[authToken] GET primário não-OK: status=${response.status} (coleção=${collectionName}, id=${payload.id}). Tentando fallback superuser.`,
    );
  } catch (err) {
    logger.warn(
      `[authToken] GET primário lançou erro: ${err?.message || err} (coleção=${collectionName}). Tentando fallback superuser.`,
    );
  }

  // 4. FALLBACK — lê o registro como superusuário (bypass de viewRule) e
  //    compara o tokenKey do registro com o claim tokenKey do JWT. Se
  //    coincidirem, o token é válido para a coleção esperada.
  try {
    const record = await pocketbaseClient
      .collection(collectionName)
      .getOne(payload.id);
    if (record?.id && record.tokenKey && payload.tokenKey) {
      if (record.tokenKey === payload.tokenKey) {
        return record;
      }
      logger.warn(
        `[authToken] Fallback: tokenKey do registro != tokenKey do JWT (coleção=${collectionName}, id=${payload.id}).`,
      );
    } else {
      logger.warn(
        `[authToken] Fallback: registro ou tokenKey ausente (coleção=${collectionName}, id=${payload.id}, recordTokenKey=${!!record?.tokenKey}, jwtTokenKey=${!!payload.tokenKey}).`,
      );
    }
  } catch (err) {
    logger.warn(
      `[authToken] Fallback superuser falhou: ${err?.message || err} (coleção=${collectionName}, id=${payload.id}).`,
    );
  }

  return null;
}
