import logger from "../utils/logger.js";
import { montarRelatorioCorrecaoJwt } from "./relatorio-download.js";

/**
 * Download do relatório de CORREÇÃO DE ERRO MENTOR_JWT_SECRET (.txt gerado em
 * memória) documentando a correção do erro MENTOR_SEGREDO_AUSENTE no fluxo do
 * Mentor, com a geração de um segredo forte e dedicado, o teste do fluxo e a
 * confirmação do ambiente/URL.
 *
 * Rota protegida por adminAuth (apenas administradores — validação contra a
 * coleção `admins`). Cada solicitação é registrada em logs sem expor dados
 * sensíveis (segredos, senhas, tokens, JWTs).
 *
 * GET /relatorio-correcao-jwt/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-correcao-jwt] Solicitação de relatório de correção mentor jwt por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoJwt();

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="relatorio-correcao-mentor-jwt-16-08-2026-1700.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
