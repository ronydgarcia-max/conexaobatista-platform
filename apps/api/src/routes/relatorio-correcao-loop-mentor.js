import logger from "../utils/logger.js";
import { montarRelatorioCorrecaoLoop } from "./relatorio-download.js";

/**
 * Download do relatório de CORREÇÃO DE LOOP - PÁGINA DE BOAS-VINDAS DO
 * MENTOR (.txt gerado em memória). Rota protegida (apenas administradores
 * autenticados). Cada solicitação é registrada em logs sem expor dados
 * sensíveis.
 *
 * GET /relatorio-correcao-loop-mentor/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-correcao-loop-mentor] Solicitação de relatório de correção de loop por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoLoop();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcao-loop-mentor-16-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
