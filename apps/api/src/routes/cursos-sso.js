// SSO entre PocketBase e a API de cursos externa (http://69.62.124.240:3333).
//
// O frontend (HTTPS) não pode chamar a API de cursos (HTTP) diretamente por causa
// do mixed content. Estas rotas fazem o proxy via Express (mesma origem, /hcgi/api),
// mantendo o CURSOS_API_BRIDGE_SECRET no backend (nunca exposto ao navegador).
//
// Rotas (todas protegidas por authMiddleware — exige sessão PocketBase válida):
//   POST /cursos/bridge-login   → obtém/renova o JWT do usuário na API de cursos
//   GET  /cursos/meus           → lista cursos matriculados do usuário
//   GET  /cursos/:id/token      → obtém token de acesso a um curso específico

import jwt from 'jsonwebtoken';
import pocketbaseClient from '../utils/pocketbaseClient.js';

const CURSOS_API_URL = (process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br').replace(/\/+$/, '');
const CURSOS_API_BRIDGE_SECRET = process.env.CURSOS_API_BRIDGE_SECRET;

// ---------- POST /cursos/bridge-login ----------
export async function bridgeLogin(req, res) {
  if (!CURSOS_API_BRIDGE_SECRET) {
    return res.status(500).json({ error: 'Integração de cursos não configurada.' });
  }
  const user = req.user;
  if (!user?.id) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  try {
    // ✅ Sincroniza o usuário do PocketBase com a API externa de cursos ANTES
    // do bridge-login. A API externa exige que o usuário exista no seu banco;
    // sem isso, o bridge-login retorna "Usuário não encontrado. Chame
    // /usuarios/ensure primeiro.". O ensure é idempotente (cria se faltar,
    // atualiza se existir), então chamá-lo sempre é seguro.
    try {
      await fetch(`${CURSOS_API_URL}/usuarios/ensure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bridge-secret': CURSOS_API_BRIDGE_SECRET,
        },
        body: JSON.stringify({
          pocketbase_id: user.id,
          email: user.email,
          nome: user.name || user.email,
        }),
      });
    } catch (_) {
      // não fatal — segue para o bridge-login, que reportará o erro real
    }

    const upstream = await fetch(`${CURSOS_API_URL}/auth/bridge-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bridge-secret': CURSOS_API_BRIDGE_SECRET,
      },
      body: JSON.stringify({ pocketbase_id: user.id, email: user.email }),
    });

    const text = await upstream.text();
    let data = null;
    try { data = text ? JSON.parse(text) : {}; } catch (_) { data = { message: text }; }

    if (!upstream.ok) {
      return res.status(upstream.status === 401 || upstream.status === 403 ? 401 : 502).json({
        error: data?.error || data?.message || 'Não foi possível autenticar na plataforma de cursos.',
      });
    }

    const token = data.token || '';
    let expiresAt = data.expiresAt || data.expires_at || '';

    // Decodifica o JWT (sem verificar) para extrair o exp, se não vier explícito.
    if (!expiresAt && token) {
      try {
        const decoded = jwt.decode(token);
        if (decoded?.exp) {
          expiresAt = new Date(decoded.exp * 1000).toISOString();
        }
      } catch (_) {}
    }

    // Persiste o token no registro do usuário no PocketBase (best-effort).
    try {
      await pocketbaseClient.collection('users').update(user.id, {
        cursos_api_token: token,
        cursos_api_token_expires: expiresAt || '',
      });
    } catch (_) {
      // não fatal — o token ainda é retornado ao frontend
    }

    return res.json({ token, expiresAt, usuario: data.usuario || null });
  } catch (err) {
    return res.status(502).json({
      error: 'Serviço de cursos indisponível no momento. Tente novamente em instantes.',
    });
  }
}

// Helper para rotas proxy que recebem o token de cursos via header x-cursos-token.
async function proxyCursos(req, res, path, fallbackMessage) {
  const cursosToken = req.headers['x-cursos-token'];
  if (!cursosToken) {
    return res.status(401).json({ error: 'Token de cursos ausente. Renove sua sessão.' });
  }

  try {
    const upstream = await fetch(`${CURSOS_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${cursosToken}` },
    });

    const text = await upstream.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }

    if (!upstream.ok) {
      const status = upstream.status === 401 || upstream.status === 403 ? 401 : upstream.status;
      const message = typeof data === 'string' ? data : (data?.error || data?.message || fallbackMessage);
      return res.status(status).json({ error: message, details: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({
      error: 'Serviço de cursos indisponível no momento. Tente novamente em instantes.',
    });
  }
}

// ---------- GET /cursos/meus ----------
export async function meusCursos(req, res) {
  return proxyCursos(req, res, '/cursos/usuario/meus', 'Não foi possível carregar seus cursos.');
}

// ---------- GET /cursos/:id/token ----------
// Proxy para a VPS, enriquecido com os dados do usuário PocketBase.
//
// O JWT de acesso ao curso é gerado E validado pela própria VPS (assinado com
// o segredo dela), por isso seus campos não podem ser alterados deste lado
// sem invalidar a assinatura. O token devolvido pela VPS contém
// { id, curso_id, iat, exp } — suficiente para a VPS autorizar
// /aluno/cursos/:id/aulas. Para o frontend ter o contexto completo do
// usuário, anexamos usuario_id, email e nome (lidos do req.user) ao lado do
// token na resposta JSON.
export async function acessarCurso(req, res) {
  const { id } = req.params;
  if (!id) {
    return res.status(422).json({ error: 'ID do curso é obrigatório.' });
  }

  const cursosToken = req.headers['x-cursos-token'];
  if (!cursosToken) {
    return res.status(401).json({ error: 'Token de cursos ausente. Renove sua sessão.' });
  }

  const user = req.user || {};

  try {
    const upstream = await fetch(`${CURSOS_API_URL}/cursos/${encodeURIComponent(id)}/token`, {
      headers: { Authorization: `Bearer ${cursosToken}` },
    });

    const text = await upstream.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }

    if (!upstream.ok) {
      const status = upstream.status === 401 || upstream.status === 403 ? 401 : upstream.status;
      const message = typeof data === 'string' ? data : (data?.error || data?.message || 'Não foi possível acessar este curso.');
      return res.status(status).json({ error: message, details: data });
    }

    const token = (data && (data.token || data.curso_token)) || '';

    // Enriquece a resposta com os dados do usuário autenticado no PocketBase.
    // O token em si permanece o gerado pela VPS (não pode ser resignado aqui).
    return res.status(200).json({
      ...((data && typeof data === 'object') ? data : {}),
      token,
      usuario_id: user.id || '',
      email: user.email || '',
      nome: user.name || user.nome || '',
      token_type: 'Bearer',
    });
  } catch (err) {
    return res.status(502).json({
      error: 'Serviço de cursos indisponível no momento. Tente novamente em instantes.',
    });
  }
}

export default { bridgeLogin, meusCursos, acessarCurso };
