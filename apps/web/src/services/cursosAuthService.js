// Serviço de autenticação SSO com a API de cursos.
//
// CORREÇÃO (01/09/2026 — autenticação do painel do aluno):
// O token da VPS (recebido da URL após o SSO ou renovado via bridge-login) é
// guardado em `sessionStorage` — escopo da SESSÃO ATUAL da aba: persiste
// entre recargas dentro da mesma aba (não perde o acesso ao atualizar a
// página), é limpo ao fechar a aba e NUNCA usa `localStorage`. Assim o token
// não fica visível na barra de endereço nem persiste além da sessão atual.
//
// CORREÇÃO ANTERIOR (31/08/2026): o token era mantido apenas em memória
// (variável de módulo), o que o perdia a cada recarga e NÃO capturava o token
// recebido na URL após o SSO. Agora a sessão atual é a fonte da verdade.
//
// O bridge-login é chamado VIA PROXY EXPRESS (apiServerClient.fetch('/cursos/
// bridge-login')) — mesma origem (/hcgi/api), evitando mixed content HTTPS→HTTP.
// O frontend envia SOMENTE o token PocketBase no header Authorization (Bearer);
// o segredo (CURSOS_API_BRIDGE_SECRET / x-bridge-secret) permanece no backend,
// que valida o usuário (authMiddleware) e adiciona o segredo internamente ao
// chamar a API externa de cursos. Nenhum segredo trafega pelo navegador. O
// token de cursos é renovado automaticamente quando expira ou quando uma
// chamada retorna 401.

import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';

const REFRESH_MARGIN_MS = 5 * 60 * 1000; // renova se faltar menos de 5 min

// ===== Armazenamento em SESSION STORAGE (sessão atual, não localStorage) =====
const TOKEN_KEY = 'cursos_api_token';
const EXPIRES_KEY = 'cursos_api_token_expires';

// Limpeza única (migração): remove eventuais tokens legados que a versão
// anterior persistia em localStorage, para que nenhum token da VPS fique
// em armazenamento persistente visível do navegador.
try {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
} catch (_) {}

export function obterToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch (_) { return ''; }
}

export function obterExpiracao() {
  try { return sessionStorage.getItem(EXPIRES_KEY) || ''; } catch (_) { return ''; }
}

export function armazenarToken(token, expiresAt) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
    if (expiresAt) sessionStorage.setItem(EXPIRES_KEY, expiresAt);
    else sessionStorage.removeItem(EXPIRES_KEY);
  } catch (_) {}
}

export function limparToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EXPIRES_KEY);
  } catch (_) {}
}

// Captura o token SSO recebido na URL (ex.: /curso/meus-cursos?token=…)
// após o redirecionamento SSO, armazena-o para a SESSÃO ATUAL e o remove da
// barra de endereço (a limpeza da URL é feita pelo componente da página).
// Retorna true quando um token foi capturado, false caso contrário.
// TTL conservador (10 min): ao expirar, garantirToken renova via bridge-login.
export function capturarTokenDaUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token && token.length > 0) {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      armazenarToken(token, expiresAt);
      return true;
    }
  } catch (_) {}
  return false;
}

// Verifica se há um token válido (presente e não próximo da expiração).
export function isTokenValido() {
  const token = obterToken();
  if (!token) return false;
  const exp = obterExpiracao();
  if (!exp) return false;
  const expMs = new Date(exp).getTime();
  if (Number.isNaN(expMs)) return false;
  return expMs - Date.now() > REFRESH_MARGIN_MS;
}

let refreshPromise = null;

// Renova o token chamando o PROXY EXPRESS /cursos/bridge-login (mesma origem,
// /hcgi/api). O frontend envia SOMENTE o token PocketBase no header
// Authorization (Bearer); o backend (cursos-sso.js) valida o usuário via
// authMiddleware e adiciona o segredo (x-bridge-secret) internamente ao
// chamar a API externa de cursos. Nenhum segredo trafega pelo navegador.
// Tratamento da resposta, erros, redirecionamentos e sessão preservados.
export async function renovarToken() {
  if (refreshPromise) return refreshPromise;

  const usuario = pb.authStore.record;
  const pbToken = pb.authStore.token;
  if (!pbToken || !usuario?.id) {
    limparToken();
    throw new Error('Sua sessão expirou. Faça login novamente para acessar seus cursos.');
  }

  refreshPromise = (async () => {
    // Chamada VIA PROXY EXPRESS (mesma origem /hcgi/api). O frontend envia
    // apenas o token PocketBase no header Authorization (Bearer); o backend
    // (rota /cursos/bridge-login em cursos-sso.js) valida o usuário via
    // authMiddleware e adiciona o segredo (x-bridge-secret) internamente ao
    // chamar a API externa de cursos. Nenhum segredo trafega pelo navegador.
    const res = await apiServerClient.fetch('/cursos/bridge-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pbToken}`,
      },
    });

    let data = {};
    try { data = await res.json(); } catch (_) { data = {}; }

    if (!res.ok) {
      if (res.status === 401) {
        limparToken();
        throw new Error('Sua sessão expirou. Faça login novamente para acessar seus cursos.');
      }
      throw new Error(data?.error || 'Não foi possível autenticar na plataforma de cursos. Tente novamente.');
    }

    if (!data?.token) {
      throw new Error('Não foi possível obter o token de acesso aos cursos. Tente novamente.');
    }

    armazenarToken(data.token, data.expiresAt || data.expires_at || '');
    return data.token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// Garante um token válido: retorna o atual se válido, ou renova caso contrário.
export async function garantirToken() {
  if (isTokenValido()) return obterToken();
  return renovarToken();
}

// Limpa automaticamente o token quando a sessão PocketBase é encerrada (logout).
// O listener é registrado uma vez; o SDK chama o callback a cada mudança do authStore.
let listenerRegistrado = false;
function registrarListenerLogout() {
  if (listenerRegistrado) return;
  try {
    if (pb.authStore && typeof pb.authStore.onChange === 'function') {
      pb.authStore.onChange(() => {
        if (!pb.authStore.isValid) limparToken();
      });
      listenerRegistrado = true;
    }
  } catch (_) {}
}
registrarListenerLogout();

export default {
  obterToken,
  obterExpiracao,
  armazenarToken,
  limparToken,
  capturarTokenDaUrl,
  isTokenValido,
  renovarToken,
  garantirToken,
};
