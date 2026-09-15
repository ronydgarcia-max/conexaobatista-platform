import logger from "../utils/logger.js";
import { montarRelatorioDiagnostico } from "./relatorio-download.js";

/**
 * Download do relatório de DIAGNÓSTICO DE ERRO (.txt gerado em memória)
 * documentando a variável de ambiente ausente no fluxo Mentor
 * (MENTOR_JWT_SECRET), que provoca o erro "Integração de segurança não
 * configurada. Contate o administrador." (código MENTOR_SEGREDO_AUSENTE).
 *
 * Rota protegida por adminAuth (apenas administradores, validação contra a
 * coleção admins). GET /relatorio-diagnostico/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-diagnostico] Solicitação de relatório de diagnóstico por: ${solicitante}`,
  );

  const conteudo = montarRelatorioDiagnostico();

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="relatorio-diagnostico-mentor-16-08-2026-1650.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
