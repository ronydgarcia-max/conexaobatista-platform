import logger from "../utils/logger.js";
import { montarRelatorioCorrecaoHeaderPainelMentor } from "./relatorio-download.js";

/**
 * Download do relatório de CORREÇÃO - HEADER DO PAINEL MENTOR NÃO ATUALIZA
 * COM DADOS DO JWT (.txt gerado em memória) documentando a correção do
 * painel do mentor (painel-mentor.html) cujo header permanecia estático
 * ("Olá, Mentor" / avatar "M") após o login SSO, pois não existiam as
 * funções decodificarJWT() e atualizarHeader(), nem menu dropdown ou botão
 * "Sair". A correção adiciona a decodificação do payload do JWT
 * ({ pocketbase_id, email, nome, role, destino }) e a atualização do
 * header com o primeiro nome e a inicial do avatar, além do dropdown e
 * do botão Sair.
 *
 * Rota protegida por authMiddleware (usuários autenticados da coleção
 * `users`). Cada solicitação é registrada em logs sem expor dados
 * sensíveis (segredos, senhas, tokens, JWTs ou valores reais).
 *
 * GET /relatorio-correcao-header-painel-mentor/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.id || "usuário desconhecido";
  logger.info(
    `[relatorio-correcao-header-painel-mentor] Solicitação de relatório de correção do header do painel mentor por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoHeaderPainelMentor();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcao-header-painel-mentor-19-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
