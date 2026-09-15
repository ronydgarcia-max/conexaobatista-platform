// Assistente de IA "Batista" — rota de chat com streaming SSE.
//
// POST /batista/message
//   Body: { message: string, history?: [{role, content}] }
//   Resposta: text/event-stream (eventos: content / error / completed + [DONE])
//
// - Autenticação OPCIONAL: usuários logados recebem respostas personalizadas
//   (nome, e-mail, cursos matriculados, progresso); visitantes (guest) recebem
//   apenas informações públicas.
// - O LLM é acionado via o proxy de IA integrado da plataforma
//   (INTEGRATED_AI_API_URL / INTEGRATED_AI_API_KEY — provisionados pelo host).
// - O histórico da conversa vem do cliente (por conversa) e é limitado para
//   não estourar o contexto do modelo.

import { Router } from 'express';
import { Buffer } from 'node:buffer';
import { PassThrough, Readable } from 'node:stream';
import Pocketbase from 'pocketbase';
import { integratedAiRateLimit } from '../middleware/integrated-ai-rate-limit.js';
import { buildSystemPrompt } from '../constants/batistaKnowledge.js';

const router = Router();

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';
const CURSOS_API_URL = (process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br').replace(/\/+$/, '');
const MAX_HISTORY = 12;

function sse(res, obj) {
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
}

// Tenta carregar o contexto do usuário a partir do token PocketBase (base64).
// Retorna { ctx, userId } ou null (visitante). Nunca lança — falha = guest.
async function loadUserContext(authHeader) {
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;

  let decoded;
  try {
    decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
  if (!decoded?.token || !decoded?.record) return null;

  try {
    const pb = new Pocketbase(POCKETBASE_URL);
    pb.authStore.save(decoded.token, decoded.record);
    const refreshed = await pb.collection(decoded.record.collectionName).authRefresh();
    const rec = refreshed.record;

    const ctx = {
      nome: rec.name || rec.username || '',
      email: rec.email || '',
      username: rec.username || '',
      cidade: rec.cidade || '',
      mentor_status: rec.mentor_status || '',
      mentor_solicitado: !!rec.mentor_solicitado,
      cursos: [],
    };

    // Cursos matriculados via API externa (best-effort).
    const cursosToken = rec.cursos_api_token || '';
    if (cursosToken) {
      try {
        const r = await fetch(`${CURSOS_API_URL}/cursos/usuario/meus`, {
          headers: { Authorization: `Bearer ${cursosToken}` },
          signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          const data = await r.json();
          ctx.cursos = Array.isArray(data) ? data : (data.cursos || data.items || data.data || []);
        }
      } catch {
        /* serviço de cursos indisponível — segue sem cursos */
      }
    }

    return { ctx, userId: rec.id };
  } catch {
    return null;
  }
}

router.post('/message', integratedAiRateLimit, async (req, res) => {
  const { message, history, context } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(422).json({ error: 'A mensagem é obrigatória.' });
  }

  // Contexto detectado pelo frontend: 'curso' | 'logado' | 'visitante'.
  // Determina qual base de conhecimento e quais dados do usuário injetar.
  const ctxType = ['curso', 'logado', 'visitante'].includes(context) ? context : 'visitante';

  // Cabeçalhos SSE já no início — qualquer falha vira evento de erro no fluxo.
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // 1. Contexto do usuário (opcional) + prompt contextualizado.
  let systemPrompt;
  try {
    const userCtx = await loadUserContext(req.headers.authorization);
    // No contexto 'curso', aproveita os dados do usuário se houver.
    // Em 'logado'/'visitante' fora de /curso, os dados de cursos não são
    // buscados (loadUserContext já busca, mas o buildSystemPrompt decide
    // o que incluir — para não-logado, userCtx será null).
    systemPrompt = buildSystemPrompt(ctxType, userCtx ? userCtx.ctx : null);
  } catch {
    systemPrompt = buildSystemPrompt(ctxType, null);
  }

  // 2. Histórico da conversa (limitado).
  const trimmedHistory = (Array.isArray(history) ? history : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content }));

  // 3. Chamada ao proxy de IA (LLM provisionado pela plataforma).
  let upstream;
  try {
    upstream = await fetch(`${process.env.INTEGRATED_AI_API_URL}/generate`, {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.INTEGRATED_AI_API_KEY}`,
        ...(process.env.PROXY_ENTRANCE_ID && { 'X-Proxy-Entrance-Id': process.env.PROXY_ENTRANCE_ID }),
      },
      body: JSON.stringify({
        website_id: process.env.WEBSITE_ID,
        history: [...trimmedHistory, { role: 'user', content: message.trim() }],
        system_prompt: systemPrompt,
        stream: true,
        environment: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
      }),
    });
  } catch {
    sse(res, { type: 'error', data: { content: 'Ops! Não consegui me conectar agora. 🙏 Tente novamente em instantes.' } });
    sse(res, { type: 'completed', data: { content: '[COMPLETED]' } });
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  if (!upstream.ok || !upstream.body) {
    sse(res, { type: 'error', data: { content: 'Tive um probleminha para montar a resposta. Tente de novo em instantes. 🙌' } });
    sse(res, { type: 'completed', data: { content: '[COMPLETED]' } });
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  // 4. Encaminha o SSE do proxy para o cliente.
  const passThrough = new PassThrough();
  Readable.fromWeb(upstream.body).pipe(passThrough);
  passThrough.pipe(res, { end: false });

  passThrough.on('end', () => {
    res.end();
  });

  res.on('close', () => {
    passThrough.destroy();
    upstream.body?.cancel?.().catch(() => {});
  });
});

export default router;
