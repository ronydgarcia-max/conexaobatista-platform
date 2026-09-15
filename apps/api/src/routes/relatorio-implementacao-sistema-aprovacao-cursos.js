import logger from "../utils/logger.js";
import { montarRelatorioImplementacaoSistemaAprovacaoCursos } from "./relatorio-download.js";

/**
 * Download do relatório de IMPLEMENTAÇÃO - SISTEMA DE APROVAÇÃO DE CURSOS
 * (.txt gerado em memória) documentando o sistema completo de moderação de
 * cursos no painel administrativo (/adm/moderacao-cursos) e o status de
 * moderação no painel do mentor (/curso/mentor-cursos), consumindo as rotas
 * da API externa de cursos (https://api.conexaobatista.com.br) via proxy
 * Express com o header x-bridge-secret (segredo mantido no backend).
 *
 * Rota protegida por authMiddleware (usuários autenticados da coleção
 * `users`). Cada solicitação é registrada em logs sem expor dados
 * sensíveis (segredos, senhas, tokens, JWTs ou valores reais).
 *
 * GET /relatorio-implementacao-sistema-aprovacao-cursos/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.id || "usuário desconhecido";
  logger.info(
    `[relatorio-implementacao-sistema-aprovacao-cursos] Solicitação de relatório de implementação do sistema de aprovação de cursos por: ${solicitante}`,
  );

  const conteudo = montarRelatorioImplementacaoSistemaAprovacaoCursos();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-implementacao-sistema-aprovacao-cursos-19-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
