import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import logger from "../utils/logger.js";

/**
 * Download do arquivo único "painel-mentor.html" — painel completo do mentor
 * para ConexãoCursos em HTML + CSS + JavaScript puro (sem frameworks).
 *
 * O arquivo é servido como anexo (Content-Disposition: attachment) para
 * download imediato, com Content-Type text/html e charset UTF-8.
 *
 * Rota protegida por adminAuth (apenas administradores — validação contra a
 * coleção `admins`). Cada solicitação é registrada em logs sem expor dados
 * sensíveis.
 *
 * GET /adm/painel-mentor-download
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARQUIVO_HTML = path.resolve(__dirname, "..", "static", "painel-mentor.html");

export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[painel-mentor-download] Solicitação de download do painel do mentor por: ${solicitante}`,
  );

  let conteudo;
  try {
    conteudo = fs.readFileSync(ARQUIVO_HTML, "utf8");
  } catch (err) {
    logger.error(`[painel-mentor-download] Erro ao ler arquivo: ${err.message}`);
    return res.status(500).json({
      error: "Não foi possível gerar o arquivo do painel do mentor.",
    });
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="painel-mentor.html"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
