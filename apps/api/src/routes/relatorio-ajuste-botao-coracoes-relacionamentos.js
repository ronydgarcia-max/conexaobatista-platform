import logger from "../utils/logger.js";
import { montarRelatorioAjusteBotaoCoracoesRelacionamentos } from "./relatorio-download.js";

/**
 * Download do relatório de AJUSTE - BOTÃO CORAÇÕES CONECTADOS MOVIDO PARA A
 * PÁGINA RELACIONAMENTOS (.txt gerado em memória) documentando a remoção do
 * botão "Acessar Corações Conectados" da página "Área do Mentor"
 * (MentorBoasVindasPage.jsx) e sua adição à página "Relacionamentos"
 * (EntryPage.jsx — rota /relacionamentos), mantendo a mesma funcionalidade
 * (POST /coracoes-sso-token + redirecionamento para
 * https://coracoes.conexaobatista.com.br?token=JWT).
 *
 * Rota protegida por adminAuth (administradores da coleção `admins`). Cada
 * solicitação é registrada em logs sem expor dados sensíveis (segredos,
 * senhas, tokens, JWTs ou valores reais).
 *
 * GET /relatorio-ajuste-botao-coracoes-relacionamentos/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-ajuste-botao-coracoes-relacionamentos] Solicitação de relatório de ajuste do botão Corações Conectados (movido para Relacionamentos) por: ${solicitante}`,
  );

  const conteudo = montarRelatorioAjusteBotaoCoracoesRelacionamentos();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-ajuste-botao-coracoes-relacionamentos-20-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
