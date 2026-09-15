import logger from "../utils/logger.js";
import { montarRelatorioCorrecaoPaginaCursos } from "./relatorio-download.js";

/**
 * Download do relatório de CORREÇÃO - PÁGINA DE CURSOS ATUALIZADA COM
 * CATEGORIAS DINÂMICAS (.txt gerado em memória).
 *
 * Documenta:
 *   - Remoção completa do filtro "Nível" em /curso/cursos
 *   - Substituição das categorias fixas (Fé/Negócios/Profissional) pelas
 *     33 categorias canônicas via GET /categorias
 *   - Listagem de cursos publicados reais via GET /cursos-publicados
 *
 * Rota protegida por adminAuth (coleção `admins`).
 * GET /relatorio-correcao-pagina-cursos/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-correcao-pagina-cursos] Solicitação de relatório de correção da página de cursos por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoPaginaCursos();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcao-pagina-cursos-24-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
