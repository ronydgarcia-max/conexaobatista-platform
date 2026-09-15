import logger from "../utils/logger.js";
import { montarRelatorioCorrecaoCursosDestaque } from "./relatorio-download.js";

/**
 * Download do relatório de CORREÇÃO - SEÇÃO CURSOS EM DESTAQUE COM DADOS
 * REAIS (.txt gerado em memória).
 *
 * Documenta a substituição do conteúdo fictício/mock da seção
 * "Cursos em destaque - Comece a aprender hoje" da home da plataforma de
 * cursos (CursoHomePage.jsx) por cursos reais do banco via
 * GET /cursos-publicados, mantendo o título, o layout e os estilos CSS.
 *
 * Rota protegida por adminAuth (coleção `admins`).
 * GET /relatorio-correcao-cursos-destaque/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-correcao-cursos-destaque] Solicitação de relatório de correção da seção cursos em destaque por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoCursosDestaque();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcao-cursos-destaque-24-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
