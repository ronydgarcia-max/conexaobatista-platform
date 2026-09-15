// Proxy de STATUS DOS CURSOS DO MENTOR para a API externa de cursos.
//
// O mentor (usuário autenticado da coleção `users`) precisa ver o status de
// moderação dos cursos que ele criou (Em análise / Aprovado / Reprovado) e o
// motivo da reprovação. O segredo `x-bridge-secret` permanece apenas no
// backend; o Express filtra os cursos pelo e-mail do mentor autenticado, de
// forma que o mentor só enxerga os próprios cursos.
//
// Rotas (protegidas por authMiddleware — coleção `users`):
//   GET    /cursos-mentor-status        → lista os cursos do mentor logado
//   DELETE /cursos-mentor-status/:id    → exclui um curso do mentor (com
//                                         verificação de propriedade)

import { Router } from "express";
import logger from "../utils/logger.js";

const router = Router();

const ADMIN_API_URL = (process.env.CURSOS_ADMIN_API_URL || "https://api.conexaobatista.com.br").replace(/\/+$/, "");
const CURSOS_API_URL = (process.env.CURSOS_API_URL || "https://api.conexaobatista.com.br").replace(/\/+$/, "");
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

// Busca os cursos do mentor na API externa, filtrando pelo e-mail dele.
// Retorna um array de cursos (cada um com status, motivo_reprovacao, etc.).
async function buscarCursosDoMentor(email) {
  const upstream = await fetch(
    `${ADMIN_API_URL}/admin/cursos?mentor_email=${encodeURIComponent(email)}`,
    { headers: { "x-bridge-secret": BRIDGE_SECRET } },
  );

  if (!upstream.ok) {
    throw new Error(
      `cursos-mentor-status listagem falhou: ${upstream.status} ${upstream.statusText}`,
    );
  }

  const data = await lerUpstream(upstream);
  return Array.isArray(data) ? data : data?.cursos || [];
}

// GET /cursos-mentor-status
// Lista os cursos criados pelo mentor autenticado (filtrado pelo e-mail).
router.get("/", async (req, res) => {
  const user = req.user;
  if (!user?.id) {
    return res.status(401).json({ error: "Não autenticado." });
  }

  const email = user.email || "";
  if (!email) {
    return res
      .status(422)
      .json({ error: "E-mail do mentor não encontrado na conta." });
  }

  if (!BRIDGE_SECRET) {
    throw new Error("CURSOS_API_BRIDGE_SECRET não configurado em apps/api/.env");
  }

  const cursos = await buscarCursosDoMentor(email);
  return res.status(200).json({ cursos });
});

// DELETE /cursos-mentor-status/:id
// Exclui um curso do mentor. Antes de excluir, verifica que o curso pertence
// ao mentor logado (comparando o e-mail do mentor com o mentor_email do
// curso) — assim um mentor não pode excluir cursos de outros.
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(422).json({ error: "ID do curso é obrigatório." });
  }

  const user = req.user;
  if (!user?.id) {
    return res.status(401).json({ error: "Não autenticado." });
  }

  const email = user.email || "";
  if (!email) {
    return res
      .status(422)
      .json({ error: "E-mail do mentor não encontrado na conta." });
  }

  if (!BRIDGE_SECRET) {
    throw new Error("CURSOS_API_BRIDGE_SECRET não configurado em apps/api/.env");
  }

  // Verificação de propriedade: o curso deve pertencer ao mentor logado.
  const cursos = await buscarCursosDoMentor(email);
  const curso = cursos.find((c) => String(c.id) === String(id));

  if (!curso) {
    return res
      .status(404)
      .json({ error: "Curso não encontrado ou não pertence a você." });
  }

  logger.info(
    `[cursos-mentor-status] Exclusão do curso id=${id} (${curso.titulo}) solicitada pelo mentor: ${email}`,
  );

  const upstream = await fetch(
    `${CURSOS_API_URL}/cursos/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { "x-bridge-secret": BRIDGE_SECRET },
    },
  );

  if (!upstream.ok) {
    const data = await lerUpstream(upstream).catch(() => null);
    const mensagem =
      (typeof data === "string" && data) ||
      data?.error ||
      data?.message ||
      "Não foi possível excluir o curso.";
    throw new Error(
      `cursos-mentor-status exclusão id=${id} falhou: ${upstream.status} ${upstream.statusText} — ${mensagem}`,
    );
  }

  const data = await lerUpstream(upstream);
  return res.status(200).json(
    data || { sucesso: true, mensagem: "Curso excluído" },
  );
});

export default router;
