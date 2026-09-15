import logger from "../utils/logger.js";
import { montarRelatorioSchemaSql } from "./relatorio-download.js";

/**
 * Download do RELATÓRIO DE ALTERAÇÕES referente à criação do schema SQL do
 * banco cursos_db (.txt gerado em memória, sem persistir arquivo).
 *
 * Rota protegida por adminAuth (coleção `admins`). Cada solicitação é
 * registrada em logs, sem expor dados sensíveis.
 *
 * GET /relatorio-schema-sql/relatorio
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-schema-sql] Solicitação do relatório de schema SQL por: ${solicitante}`,
  );

  const conteudo = montarRelatorioSchemaSql();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-schema-sql-16-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
