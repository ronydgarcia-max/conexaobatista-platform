import logger from "../utils/logger.js";
import { montarRelatorioCorrecaoAutenticacaoPainel } from "./relatorio-download.js";

/**
 * Download do relatório de CORREÇÃO - AUTENTICAÇÃO DO PAINEL DO MENTOR
 * (.txt gerado em memória) documentando a investigação completa do fluxo
 * "Acessar painel do mentor" (SITE Horizons + VPS cursos-api) e a correção
 * aplicada no painel-mentor.html (API_BASE adaptativo) + a ação requerida
 * na VPS (rota /sso repassar o token para /painel?token=).
 *
 * Rota protegida por adminAuth (apenas administradores da coleção `admins`),
 * pois o download é disparado pela área administrativa (/adm/relatorio-alteracoes).
 * Cada solicitação é registrada em logs sem expor dados sensíveis (segredos,
 * senhas, tokens, JWTs ou valores reais).
 *
 * GET /relatorio-correcao-autenticacao-painel/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-correcao-autenticacao-painel] Solicitação de relatório de correção da autenticação do painel do mentor por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoAutenticacaoPainel();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcao-autenticacao-painel-18-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
