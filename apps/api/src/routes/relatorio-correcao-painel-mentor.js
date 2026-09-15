import logger from "../utils/logger.js";
import { montarRelatorioCorrecaoPainelMentor } from "./relatorio-download.js";

/**
 * Download do relatório de CORREÇÃO - BOTÃO "PAINEL DO MENTOR" COM TOKEN SSO
 * (.txt gerado em memória) documentando a correção do painel do mentor
 * (painel-mentor.html) que não autenticava as chamadas /mentor/dashboard
 * (HTTP 401) porque o token SSO chegava pela query string (?token=) e o
 * painel só lia o token do localStorage. A correção adiciona a captura do
 * token da URL e o persiste no localStorage para todas as chamadas
 * autenticadas.
 *
 * Rota protegida por adminAuth (apenas administradores da coleção `admins`).
 * Cada solicitação é registrada em logs sem expor dados sensíveis (segredos,
 * senhas, tokens, JWTs ou valores reais).
 *
 * GET /relatorio-correcao-painel-mentor/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-correcao-painel-mentor] Solicitação de relatório de correção do botão painel do mentor por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoPainelMentor();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcao-painel-mentor-16-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
