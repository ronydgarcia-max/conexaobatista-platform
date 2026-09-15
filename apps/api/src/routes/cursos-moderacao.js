// Proxy de MODERAÇÃO DE CURSOS para a API externa de cursos.
//
// O frontend (painel administrativo) não pode chamar a API de cursos
// diretamente: o segredo `x-bridge-secret` deve permanecer apenas no backend.
// Estas rotas fazem o proxy via Express (mesma origem, /hcgi/api), injetando o
// header `x-bridge-secret` em todas as chamadas upstream.
//
// Rotas (todas protegidas por adminAuth — coleção `admins`):
//   GET  /cursos-moderacao/em-analise   → lista cursos com status=em_analise
//   POST /cursos-moderacao/:id/aprovar  → aprova um curso
//   POST /cursos-moderacao/:id/reprovar → reprova um curso (body: { motivo })

import { Router } from "express";
import logger from "../utils/logger.js";

const router = Router();

const ADMIN_API_URL = (process.env.CURSOS_ADMIN_API_URL || "https://api.conexaobatista.com.br").replace(/\/+$/, "");
const BRIDGE_SECRET = process.env.CURSOS_API_BRIDGE_SECRET;

// Helper: lê o corpo (texto) do upstream e tenta interpretar como JSON.
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

// GET /cursos-moderacao/em-analise
// Lista os cursos aguardando moderação (status=em_analise) da API externa.
router.get("/em-analise", async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[cursos-moderacao] Listagem de cursos em análise solicitada por: ${solicitante}`,
  );

  if (!BRIDGE_SECRET) {
    throw new Error("CURSOS_API_BRIDGE_SECRET não configurado em apps/api/.env");
  }

  const upstream = await fetch(
    `${ADMIN_API_URL}/admin/cursos?status=em_analise`,
    { headers: { "x-bridge-secret": BRIDGE_SECRET } },
  );

  if (!upstream.ok) {
    throw new Error(
      `cursos-moderacao em-analise falhou: ${upstream.status} ${upstream.statusText}`,
    );
  }

  const data = await lerUpstream(upstream);
  // A API externa retorna um array plano de cursos.
  const cursos = Array.isArray(data) ? data : data?.cursos || [];
  return res.status(200).json({ cursos });
});

// POST /cursos-moderacao/:id/aprovar
// Aprova um curso na API externa.
router.post("/:id/aprovar", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(422).json({ error: "ID do curso é obrigatório." });
  }

  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[cursos-moderacao] Aprovação do curso id=${id} solicitada por: ${solicitante}`,
  );

  if (!BRIDGE_SECRET) {
    throw new Error("CURSOS_API_BRIDGE_SECRET não configurado em apps/api/.env");
  }

  const upstream = await fetch(
    `${ADMIN_API_URL}/admin/cursos/${encodeURIComponent(id)}/aprovar`,
    {
      method: "POST",
      headers: {
        "x-bridge-secret": BRIDGE_SECRET,
        "Content-Type": "application/json",
      },
    },
  );

  if (!upstream.ok) {
    const data = await lerUpstream(upstream).catch(() => null);
    const mensagem =
      (typeof data === "string" && data) ||
      data?.error ||
      data?.message ||
      "Curso não encontrado";
    throw new Error(
      `cursos-moderacao aprovar id=${id} falhou: ${upstream.status} ${upstream.statusText} — ${mensagem}`,
    );
  }

  const data = await lerUpstream(upstream);
  return res.status(200).json(
    data || { sucesso: true, mensagem: "Curso aprovado" },
  );
});

// POST /cursos-moderacao/:id/reprovar
// Reprova um curso na API externa, exigindo um motivo no corpo.
router.post("/:id/reprovar", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(422).json({ error: "ID do curso é obrigatório." });
  }

  const motivo =
    (typeof req.body?.motivo === "string" && req.body.motivo.trim()) || "";

  if (!motivo) {
    return res
      .status(422)
      .json({ error: "Motivo da reprovação é obrigatório." });
  }

  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[cursos-moderacao] Reprovação do curso id=${id} solicitada por: ${solicitante}`,
  );

  if (!BRIDGE_SECRET) {
    throw new Error("CURSOS_API_BRIDGE_SECRET não configurado em apps/api/.env");
  }

  const upstream = await fetch(
    `${ADMIN_API_URL}/admin/cursos/${encodeURIComponent(id)}/reprovar`,
    {
      method: "POST",
      headers: {
        "x-bridge-secret": BRIDGE_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ motivo }),
    },
  );

  if (!upstream.ok) {
    const data = await lerUpstream(upstream).catch(() => null);
    const mensagem =
      (typeof data === "string" && data) ||
      data?.error ||
      data?.message ||
      "Curso não encontrado";
    throw new Error(
      `cursos-moderacao reprovar id=${id} falhou: ${upstream.status} ${upstream.statusText} — ${mensagem}`,
    );
  }

  const data = await lerUpstream(upstream);
  return res.status(200).json(
    data || { sucesso: true, mensagem: "Curso reprovado" },
  );
});

export default router;
