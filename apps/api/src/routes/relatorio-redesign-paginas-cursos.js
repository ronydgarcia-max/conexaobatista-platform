import logger from "../utils/logger.js";
import { montarRelatorioRedesignPaginasCursos } from "./relatorio-download.js";

/**
 * Download do relatório de REDESIGN - PÁGINAS DE DETALHES DE CURSOS
 * (.txt gerado em memória).
 *
 * Documenta a adaptação visual das páginas de cursos do portal Conexão
 * Batista com estrutura profissional e educacional (banner, breadcrumb,
 * título destacado, resumo rápido em sidebar, abas "Sobre o curso" e
 * "Matriz curricular" e chamada visual para inscrição), preservando a
 * identidade visual própria do portal e SEM alterar backend, APIs,
 * autenticação, SSO, regras de matrícula, integração com Mentor nem
 * fluxos existentes.
 *
 * Rota protegida por adminAuth (coleção `admins`).
 * GET /relatorio-redesign-paginas-cursos/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-redesign-paginas-cursos] Solicitação de relatório de redesign das páginas de cursos por: ${solicitante}`,
  );

  const conteudo = montarRelatorioRedesignPaginasCursos();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-redesign-paginas-cursos-25-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
