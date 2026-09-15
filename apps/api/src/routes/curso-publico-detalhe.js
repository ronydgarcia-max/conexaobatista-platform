// Proxy PÚBLICO de detalhe de um curso publicado para a API externa de cursos
// (VPS — projeto cursos-api).
//
// O site Conexão Batista é servido em HTTPS, enquanto a API de cursos roda em
// HTTP (http://69.62.124.240:3333). Chamadas fetch diretas do navegador para
// um endpoint HTTP a partir de uma página HTTPS são bloqueadas como "mixed
// content". Por isso esta rota recebe a requisição do frontend (mesma origem,
// via /hcgi/api) e repassa ao backend de cursos.
//
// Usa o endpoint administrativo (com x-bridge-secret no backend, nunca
// exposto ao navegador) para obter campos adicionais não retornados pelo
// endpoint público — em particular `mentor_nome` e `matriz_curricular`.
// Retorna apenas cursos com status='publicado'.
//
// Rota pública (sem autenticação): GET /cursos-publicados/:id

import logger from "../utils/logger.js";
import { normalizarCategoria } from "../utils/categorias.js";
import pocketbaseClient from "../utils/pocketbaseClient.js";

const ADMIN_API_URL = (
  process.env.CURSOS_ADMIN_API_URL || "https://api.conexaobatista.com.br"
).replace(/\/+$/, "");
const BRIDGE_SECRET = process.env.CURSOS_API_BRIDGE_SECRET;

async function lerUpstream(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text || null;
  }
  return data;
}

export default async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(422).json({ error: "ID do curso é obrigatório." });
  }

  if (!BRIDGE_SECRET) {
    throw new Error("CURSOS_API_BRIDGE_SECRET não configurado em apps/api/.env");
  }

  // A API externa não expõe um endpoint público de curso individual com
  // mentor_nome; usamos a listagem administrativa (segredo no backend) e
  // localizamos o curso pelo id.
  const upstream = await fetch(`${ADMIN_API_URL}/admin/cursos`, {
    headers: { "x-bridge-secret": BRIDGE_SECRET },
  });

  if (!upstream.ok) {
    throw new Error(
      `curso-publico-detalhe falhou: ${upstream.status} ${upstream.statusText}`,
    );
  }

  const data = await lerUpstream(upstream);
  const lista = Array.isArray(data) ? data : data?.cursos || [];

  const curso = lista.find(
    (c) => c && String(c.id) === String(id) && c.status === "publicado",
  );

  if (!curso) {
    return res
      .status(404)
      .json({ error: "Curso não encontrado ou não publicado." });
  }

  // Complemento local: a API VPS não possui os campos objetivos /
  // publico_alvo / pre_requisitos no banco. A coleção local
  // `cursos_conteudo` (leitura pública) armazena esses campos por curso, e o
  // proxy os mescla ao resultado quando presentes.
  let supplement = null;
  try {
    const sup = await pocketbaseClient
      .collection("cursos_conteudo")
      .getFullList({ filter: `curso_api_id = "${String(curso.id)}"` });
    if (sup && sup.length > 0) supplement = sup[0];
  } catch (_) {}

  // ✅ LOG detalhado: mostra exatamente o que a API externa retorna para
  // este curso, para que a estrutura real dos dados (nomes dos campos,
  // tipos, formato) seja auditável no console do backend. Confirma se os
  // campos opcionais (objetivos / publico_alvo / pre_requisitos) existem
  // ou não na API externa — sem inventar dados quando ausentes.
  const camposDisponiveis = Object.keys(curso);
  logger.info(
    `[curso-publico-detalhe] Curso id=${curso.id} (${curso.titulo || "sem título"}) — campos disponíveis na API externa: ${camposDisponiveis.join(", ")}`,
  );
  logger.info(
    `[curso-publico-detalhe] Verificação de campos opcionais — ` +
      `objetivos=${JSON.stringify(curso.objetivos) ?? "undefined"}, ` +
      `publico_alvo=${JSON.stringify(curso.publico_alvo) ?? "undefined"}, ` +
      `pre_requisitos=${JSON.stringify(curso.pre_requisitos) ?? "undefined"}, ` +
      `objectives=${JSON.stringify(curso.objectives) ?? "undefined"}, ` +
      `target_audience=${JSON.stringify(curso.target_audience) ?? "undefined"}, ` +
      `prerequisites=${JSON.stringify(curso.prerequisites) ?? "undefined"}`,
  );

  // Mapeia campos opcionais que podem chegar sob nomes diferentes na API
  // externa (PT/EN) para os nomes canônicos esperados pelo frontend. Se o
  // campo não existir sob nenhuma variante, segue como null (o frontend
  // exibe um placeholder discreto — nenhum dado é inventado).
  const primeiroNaoVazio = (...vals) => {
    for (const v of vals) {
      if (v !== null && v !== undefined && String(v).trim() !== "") return v;
    }
    return null;
  };

  const cursoNormalizado = {
    ...curso,
    categoria: normalizarCategoria(curso.categoria),
    objetivos: primeiroNaoVazio(
      curso.objetivos,
      curso.objetivo,
      curso.course_objectives,
      curso.goals,
      curso.objetivos_curso,
      supplement?.objetivos,
    ),
    publico_alvo: primeiroNaoVazio(
      curso.publico_alvo,
      curso.publicoAlvo,
      curso.publico,
      curso.target_audience,
      curso.audience,
      supplement?.publico_alvo,
    ),
    pre_requisitos: primeiroNaoVazio(
      curso.pre_requisitos,
      curso.preRequisitos,
      curso.prerequisitos,
      curso.prerequisites,
      curso.requirements,
      curso.pre_requisito,
      supplement?.pre_requisitos,
    ),
  };

  logger.info(
    `[curso-publico-detalhe] Detalhe público solicitado — curso id=${curso.id} (${curso.titulo || "sem título"})`,
  );

  return res.status(200).json({ curso: cursoNormalizado });
};
