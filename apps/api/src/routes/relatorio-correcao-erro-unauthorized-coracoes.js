import logger from "../utils/logger.js";
import { montarRelatorioCorrecaoErroUnauthorizedCoracoes } from "./relatorio-download.js";

/**
 * Download do relatório de CORREÇÃO - ERRO UNAUTHORIZED NA ROTA DE DOWNLOAD
 * DO RELATÓRIO DE INTEGRAÇÃO CORAÇÕES CONECTADOS (.txt gerado em memória)
 * documentando a correção da rota
 * GET /relatorio-implementacao-integracao-coracoes-conectados/download, que
 * retornava 401 Unauthorized mesmo com administrador autenticado porque usava
 * authMiddleware (valida a coleção `users`) em vez de adminAuth (valida a
 * coleção `admins`). Corrigido para adminAuth.
 *
 * Rota protegida por adminAuth (administradores da coleção `admins`). Cada
 * solicitação é registrada em logs sem expor dados sensíveis (segredos,
 * senhas, tokens, JWTs ou valores reais).
 *
 * GET /relatorio-correcao-erro-unauthorized-coracoes/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-correcao-erro-unauthorized-coracoes] Solicitação de relatório de correção do erro Unauthorized (Corações) por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoErroUnauthorizedCoracoes();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcao-erro-unauthorized-coracoes-20-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
