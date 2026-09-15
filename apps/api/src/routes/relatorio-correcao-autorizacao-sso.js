import logger from "../utils/logger.js";
import { montarRelatorioCorrecaoAutorizacaoSso } from "./relatorio-download.js";

/**
 * Download do relatório de CORREÇÃO DE ERRO DE AUTORIZAÇÃO NA ROTA DE
 * RELATÓRIO SSO (.txt gerado em memória) documentando a investigação do
 * erro "Unauthorized" ao acessar /relatorio-ajuste-sso-mentor/download,
 * a causa raiz (middleware authMiddleware validava contra a coleção
 * `users`, mas a rota é acessada por administradores da coleção `admins`)
 * e a correção para adminAuth.
 *
 * Rota protegida por adminAuth (apenas administradores da coleção `admins`).
 * Cada solicitação é registrada em logs sem expor dados sensíveis (segredos,
 * senhas, tokens, JWTs ou valores reais).
 *
 * GET /relatorio-correcao-autorizacao-sso/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-correcao-autorizacao-sso] Solicitação de relatório de correção de autorização sso por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoAutorizacaoSso();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcao-autorizacao-sso-16-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
