import logger from "../utils/logger.js";
import { montarRelatorioCorrecoesPendentesPortal } from "./relatorio-download.js";

/**
 * Download do relatório de CORREÇÕES PENDENTES - PORTAL PÚBLICO (.txt gerado
 * em memória).
 *
 * Documenta duas correções pendentes do portal público "Cursos Conexão
 * Batista":
 *   1. Campos "Objetivos", "Público-alvo" e "Pré-requisitos" não apareciam
 *      na página de detalhes — mapeamento robusto de variantes de nomes de
 *      campos (PT/EN) no proxy e no normalizador do frontend.
 *   2. Botão "Inscrever-se" retornava "Serviço de cursos indisponível" —
 *      CURSOS_API_URL apontava para um endereço IP morto (timeout); corrigida
 *      para o domínio funcional, além de tratamento de erro específico.
 *
 * Rota protegida por adminAuth (coleção `admins`).
 * GET /relatorio-correcoes-pendentes-portal/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-correcoes-pendentes-portal] Solicitação de relatório de correções pendentes do portal por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecoesPendentesPortal();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcoes-pendentes-portal-26-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
