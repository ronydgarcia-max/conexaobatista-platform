import logger from "../utils/logger.js";
import { montarRelatorioCorrecaoFluxo } from "./relatorio-download.js";

/**
 * Download do relatório de CORREÇÃO DE FLUXO - PÁGINA DE BOAS-VINDAS DO
 * MENTOR (.txt gerado em memória) documentando a correção do fluxo de
 * navegação para a página de boas-vindas do mentor (menu e CTA agora apontam
 * para /curso/boas-vindas; /curso/mentor permanece como página de credencial).
 *
 * Rota protegida por adminAuth (apenas administradores — validação contra a
 * coleção `admins`). Cada solicitação é registrada em logs sem expor dados
 * sensíveis (segredos, senhas, tokens, JWTs).
 *
 * GET /relatorio-correcao-fluxo-mentor/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-correcao-fluxo-mentor] Solicitação de relatório de correção de fluxo do mentor por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoFluxo();

  // Hora atual (São Paulo) incluída no nome do arquivo.
  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcao-fluxo-mentor-16-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${nomeArquivo}"`,
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
