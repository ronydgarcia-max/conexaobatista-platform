// Hook para consumir o proxy Express de moderação e status de cursos.
//
// O segredo `x-bridge-secret` NUNCA é exposto no navegador — ele vive apenas
// no backend (apps/api/.env) e é injetado pelo proxy Express. O frontend chama
// apenas as rotas do proxy (/hcgi/api/cursos-moderacao/* e
// /hcgi/api/cursos-mentor-status) via apiServerClient.
//
// Funções expostas:
//   listarCursosEmAnalise()        → GET  /cursos-moderacao/em-analise
//   aprovarCurso(id)               → POST /cursos-moderacao/:id/aprovar
//   reprovarCurso(id, motivo)      → POST /cursos-moderacao/:id/reprovar
//   listarCursosMentor()           → GET  /cursos-mentor-status
//   excluirCursoMentor(id)         → DELETE /cursos-mentor-status/:id

import { useCallback } from 'react';
import apiServerClient from '@/lib/apiServerClient';
import pb from '@/lib/pocketbaseClient';

// Lê o token de autenticação (PocketBase) disponível no authStore.
function authHeader() {
  const token = pb.authStore.token || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Trata a resposta: lança um Error com mensagem amigável em PT-BR se não ok.
async function tratarResposta(res, mensagemPadrao) {
  let data = null;
  const text = await res.text().catch(() => '');
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text || null; }

  if (!res.ok) {
    let mensagem = mensagemPadrao;
    if (typeof data === 'string' && data) mensagem = data;
    else if (data?.error) mensagem = data.error;
    else if (data?.message) mensagem = data.message;

    if (res.status === 401) {
      mensagem = 'Sua sessão expirou. Faça login novamente.';
    } else if (res.status === 403) {
      mensagem = 'Acesso restrito a administradores.';
    } else if (res.status === 404) {
      mensagem = data?.error || 'Curso não encontrado.';
    } else if (res.status === 422) {
      mensagem = data?.error || 'Dados inválidos.';
    }

    const err = new Error(mensagem);
    err.status = res.status;
    err.details = data;
    throw err;
  }

  return data;
}

// Normaliza um curso retornado pelo proxy para um objeto de exibição,
// aceitando variações de nomes de campos.
export function normalizarCurso(c) {
  if (!c) return null;
  return {
    id: c.id ?? c.curso_id ?? c._id ?? null,
    titulo: c.titulo || c.title || c.nome || 'Curso',
    descricao: c.descricao || c.description || c.resumo || '',
    categoria: c.categoria || c.category || '',
    preco: c.preco ?? c.price ?? null,
    imagem_url: c.imagem_url || c.imagem || c.img || c.thumbnail || c.cover || '',
    created_at: c.created_at || c.createdAt || c.data || '',
    status: c.status || '',
    motivo_reprovacao: c.motivo_reprovacao || c.motivoReprovacao || c.motivo || '',
    mentor_nome: c.mentor_nome || c.mentorNome || c.mentor || '',
    mentor_email: c.mentor_email || c.mentorEmail || '',
    // Campos da avaliação automática da IA (moderação Groq).
    ia_score: c.ia_score ?? c.iaScore ?? null,
    ia_veredito: c.ia_veredito || c.iaVeredito || '',
    parecer_ia: c.parecer_ia || c.parecerIa || '',
    raw: c,
  };
}

// Formata um preço (string/number) em R$ pt-BR. Retorna "Gratuito" se 0.
export function formatarPreco(preco) {
  const n = typeof preco === 'number' ? preco : parseFloat(preco);
  if (Number.isNaN(n) || n === 0) return 'Gratuito';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Formata uma data ISO em "dd/mm/aaaa às HH:mm" (horário de Brasília).
export function formatarData(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return String(iso);
  }
}

export function useCursosAPI() {
  // GET /cursos-moderacao/em-analise → { cursos: [...] }
  const listarCursosEmAnalise = useCallback(async () => {
    const res = await apiServerClient.fetch('/cursos-moderacao/em-analise', {
      headers: { ...authHeader() },
    });
    const data = await tratarResposta(res, 'Não foi possível carregar os cursos em análise.');
    const lista = Array.isArray(data) ? data : data?.cursos || [];
    return lista.map(normalizarCurso).filter(Boolean);
  }, []);

  // POST /cursos-moderacao/:id/aprovar
  const aprovarCurso = useCallback(async (id) => {
    if (!id) {
      const err = new Error('ID do curso é obrigatório.');
      err.status = 422;
      throw err;
    }
    const res = await apiServerClient.fetch(
      `/cursos-moderacao/${encodeURIComponent(id)}/aprovar`,
      { method: 'POST', headers: { ...authHeader(), 'Content-Type': 'application/json' } },
    );
    return tratarResposta(res, 'Erro ao aprovar curso. Tente novamente.');
  }, []);

  // POST /cursos-moderacao/:id/reprovar (body: { motivo })
  const reprovarCurso = useCallback(async (id, motivo) => {
    if (!id) {
      const err = new Error('ID do curso é obrigatório.');
      err.status = 422;
      throw err;
    }
    const motivoTrim = (typeof motivo === 'string' ? motivo.trim() : '') || '';
    if (!motivoTrim) {
      const err = new Error('Informe o motivo da reprovação.');
      err.status = 422;
      throw err;
    }
    const res = await apiServerClient.fetch(
      `/cursos-moderacao/${encodeURIComponent(id)}/reprovar`,
      {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoTrim }),
      },
    );
    return tratarResposta(res, 'Erro ao reprovar curso. Tente novamente.');
  }, []);

  // GET /cursos-mentor-status → { cursos: [...] } (cursos do mentor logado)
  const listarCursosMentor = useCallback(async () => {
    const res = await apiServerClient.fetch('/cursos-mentor-status', {
      headers: { ...authHeader() },
    });
    const data = await tratarResposta(res, 'Não foi possível carregar seus cursos.');
    const lista = Array.isArray(data) ? data : data?.cursos || [];
    return lista.map(normalizarCurso).filter(Boolean);
  }, []);

  // DELETE /cursos-mentor-status/:id
  const excluirCursoMentor = useCallback(async (id) => {
    if (!id) {
      const err = new Error('ID do curso é obrigatório.');
      err.status = 422;
      throw err;
    }
    const res = await apiServerClient.fetch(
      `/cursos-mentor-status/${encodeURIComponent(id)}`,
      { method: 'DELETE', headers: { ...authHeader() } },
    );
    return tratarResposta(res, 'Erro ao excluir o curso. Tente novamente.');
  }, []);

  return {
    listarCursosEmAnalise,
    aprovarCurso,
    reprovarCurso,
    listarCursosMentor,
    excluirCursoMentor,
  };
}

export default useCursosAPI;
