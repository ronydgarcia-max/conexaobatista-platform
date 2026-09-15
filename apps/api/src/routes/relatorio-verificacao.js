import logger from "../utils/logger.js";
import { montarRelatorioVerificacao } from "./relatorio-download.js";

/**
 * Download do relatório de VERIFICAÇÃO DE SEGURANÇA (.txt gerado em memória)
 * com as respostas dos blocos P0, P1 e P2 (10 itens verificados).
 *
 * Rota protegida por authMiddleware (apenas usuários autenticados).
 * GET /relatorio-verificacao/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.username || "usuário desconhecido";
  logger.info(
    `[relatorio-verificacao] Solicitação de relatório de verificação por: ${solicitante}`,
  );

  const conteudo = montarRelatorioVerificacao();

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="relatorio-verificacao-seguranca-16-08-2026-1435.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
