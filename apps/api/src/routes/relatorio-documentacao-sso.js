import logger from "../utils/logger.js";
import { montarRelatorioDocumentacaoSso } from "./relatorio-download.js";

/**
 * Download do relatório de DOCUMENTAÇÃO - FLUXO SSO DO MENTOR (.txt gerado
 * em memória). Documenta exatamente o que o botão "Vamos lá!" envia no
 * redirecionamento SSO para a VPS: URL, método HTTP, campos do corpo,
 * estrutura/claims do JWT, formato de envio e segurança. Rota protegida
 * (apenas administradores autenticados). Cada solicitação é registrada em
 * logs sem expor dados sensíveis.
 *
 * GET /relatorio-documentacao-sso/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-documentacao-sso] Solicitação de relatório de documentação SSO por: ${solicitante}`,
  );

  const conteudo = montarRelatorioDocumentacaoSso();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-documentacao-sso-mentor-16-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
