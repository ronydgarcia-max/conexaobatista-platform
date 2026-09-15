import logger from "../utils/logger.js";
import { montarRelatorioImplementacaoIntegracaoCoracoesConectados } from "./relatorio-download.js";

/**
 * Download do relatório de IMPLEMENTAÇÃO - INTEGRAÇÃO COM CORAÇÕES CONECTADOS
 * (.txt gerado em memória) documentando a adição dos campos dataNascimento e
 * estadoCivil à coleção `users`, a inclusão desses campos no cadastro e em
 * "Minha conta", e a rota SSO POST /coracoes-sso-token que gera um JWT HS256
 * (TTL 600s) com o payload exato esperado pelo app Corações Conectados.
 *
 * Rota protegida por authMiddleware (usuários autenticados da coleção
 * `users`). Cada solicitação é registrada em logs sem expor dados sensíveis
 * (segredos, senhas, tokens, JWTs ou valores reais).
 *
 * GET /relatorio-implementacao-integracao-coracoes-conectados/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.id || "usuário desconhecido";
  logger.info(
    `[relatorio-implementacao-integracao-coracoes-conectados] Solicitação de relatório por: ${solicitante}`,
  );

  const conteudo = montarRelatorioImplementacaoIntegracaoCoracoesConectados();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-implementacao-integracao-coracoes-conectados-20-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
