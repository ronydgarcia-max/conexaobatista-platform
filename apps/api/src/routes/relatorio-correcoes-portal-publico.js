import logger from "../utils/logger.js";
import { montarRelatorioCorrecoesPortalPublico } from "./relatorio-download.js";

/**
 * Download do relatório de CORREÇÕES - PORTAL PÚBLICO DOS CURSOS (.txt gerado
 * em memória).
 *
 * Documenta cinco correções da camada de apresentação do portal público
 * "Cursos Conexão Batista":
 *   1. Indicador visual de clicabilidade na miniatura (CourseCard).
 *   2. Página de detalhes com dados reais da API (descrição, matriz
 *      curricular, mentor, preço) via GET /cursos-publicados/:id.
 *   3. Fluxo de inscrição real (gratuito → matrícula na plataforma;
 *      pago → carrinho real com preço da API).
 *   4. Área do aluno com autenticação real (PocketBase) e cursos
 *      matriculados reais (GET /cursos/meus), sem conteúdo demonstrativo.
 *   5. Consistência de preço em todos os pontos — sem valores hardcoded.
 *
 * Rota protegida por adminAuth (coleção `admins`).
 * GET /relatorio-correcoes-portal-publico/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-correcoes-portal-publico] Solicitação de relatório de correções do portal público por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecoesPortalPublico();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcoes-portal-publico-25-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
