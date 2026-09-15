import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import logger from "../utils/logger.js";

/**
 * Download do SCRIPT SQL COMPLETO do banco de dados cursos_db (PostgreSQL):
 * tabelas usuarios, cursos, matriculas e avaliacoes, com índices, constraints,
 * triggers e dados de exemplo. Comentado em português e pronto para executar.
 *
 * Rota protegida por adminAuth (coleção `admins`), pois o download é
 * disparado pela área administrativa (/adm/relatorio-alteracoes). Cada
 * solicitação é registrada em logs, sem expor dados sensíveis.
 *
 * GET /relatorio-schema-sql/download
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARQUIVO_SQL = path.resolve(__dirname, "..", "static", "schema-cursos-db.sql");

export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-schema-sql] Solicitação de download do script SQL (cursos_db) por: ${solicitante}`,
  );

  let conteudo;
  try {
    conteudo = fs.readFileSync(ARQUIVO_SQL, "utf8");
  } catch (err) {
    logger.error(`[relatorio-schema-sql] Erro ao ler o script SQL: ${err.message}`);
    return res
      .status(500)
      .json({ error: "Não foi possível gerar o script SQL do banco cursos_db." });
  }

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `schema-cursos-db-16-08-2026-${horaArquivo}.sql`;

  res.setHeader("Content-Type", "application/sql; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
