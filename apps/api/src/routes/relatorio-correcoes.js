import { montarRelatorioCorrecoes } from "./relatorio-download.js";
import { adminAuth } from "./relatorio-alteracoes.js";
import logger from "../utils/logger.js";

/**
 * Download do relatório de CORREÇÕES DE SEGURANÇA (.txt gerado em memória)
 * cobrindo as 5 correções pontuais de 16/08/2026 (P1.1, P2.1, P2.3, P2.2,
 * P0.3/P2.3), com Status/Evidência/Observação para cada uma.
 *
 * Arquivo: relatorio-correcoes-seguranca-16-08-2026-1530.txt
 *
 * GET /relatorio-correcoes/download
 *
 * Protegido por adminAuth (valida token contra a coleção `admins`), para
 * coerência com os demais relatórios do painel /adm/relatorio-alteracoes
 * (que enviam o token admin via Bearer). Cada solicitação é registrada em
 * logs sem expor dados sensíveis.
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-correcoes] Solicitação de download por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecoes();

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="relatorio-correcoes-seguranca-16-08-2026-1530.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
