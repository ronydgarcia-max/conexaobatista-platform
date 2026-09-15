import logger from "../utils/logger.js";
import { montarRelatorioAjusteSso } from "./relatorio-download.js";

/**
 * Download do relatório de AJUSTE SSO - IDENTIFICADOR ÚNICO NO JWT (.txt
 * gerado em memória) documentando a investigação do payload do JWT do SSO
 * do mentor e a confirmação de que o campo "email" (e os identificadores
 * únicos "id" e "pocketbase_id") JÁ estão presentes no token.
 *
 * Rota protegida por adminAuth (apenas administradores da coleção `admins`).
 * Cada solicitação é registrada em logs sem expor dados sensíveis (segredos,
 * senhas, tokens, JWTs ou valores reais).
 *
 * GET /relatorio-ajuste-sso-mentor/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-ajuste-sso-mentor] Solicitação de relatório de ajuste sso mentor por: ${solicitante}`,
  );

  const conteudo = montarRelatorioAjusteSso();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-ajuste-sso-mentor-16-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
