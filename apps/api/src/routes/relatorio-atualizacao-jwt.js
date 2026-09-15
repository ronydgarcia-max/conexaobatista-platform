import logger from "../utils/logger.js";
import { montarRelatorioAtualizacaoJwt } from "./relatorio-download.js";

/**
 * Download do relatório de ATUALIZAÇÃO DE SEGREDOS JWT (.txt gerado em
 * memória) documentando a atualização das variáveis de ambiente
 * MENTOR_JWT_SECRET e JWT_SECRET no arquivo apps/api/.env, o rebuild/deploy,
 * o uso de cada variável e o impacto da rotação de segredos.
 *
 * Rota protegida por adminAuth (apenas administradores da coleção `admins`).
 * Cada solicitação é registrada em logs sem expor dados sensíveis (segredos,
 * senhas, tokens, JWTs ou valores reais de variáveis de ambiente).
 *
 * GET /relatorio-atualizacao-jwt/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-atualizacao-jwt] Solicitação de relatório de atualização jwt por: ${solicitante}`,
  );

  const conteudo = montarRelatorioAtualizacaoJwt();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-atualizacao-jwt-16-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
