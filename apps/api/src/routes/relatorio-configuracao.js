import logger from "../utils/logger.js";
import { montarRelatorioConfiguracao } from "./relatorio-download.js";

/**
 * Download do relatório de CONFIGURAÇÃO MENTOR (.txt gerado em memória)
 * documentando a configuração das variáveis de ambiente MENTOR_ENV e
 * MENTOR_REAL_URL e a verificação do fluxo Mentor.
 *
 * Rota protegida por adminAuth (apenas administradores — validação contra a
 * coleção `admins`). Cada solicitação é registrada em logs sem expor dados
 * sensíveis (segredos, senhas, tokens, JWTs).
 *
 * GET /relatorio-configuracao/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-configuracao] Solicitação de relatório de configuração mentor por: ${solicitante}`,
  );

  const conteudo = montarRelatorioConfiguracao();

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="relatorio-configuracao-mentor-16-08-2026-1645.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
