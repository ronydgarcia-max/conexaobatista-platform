import logger from "../utils/logger.js";
import { montarRelatorioImplementacaoBotaoMentor } from "./relatorio-download.js";

/**
 * Download do relatório de IMPLEMENTAÇÃO - BOTÃO "ACESSAR PAINEL DO MENTOR"
 * (.txt gerado em memória) documentando a criação do endpoint
 * GET /mentor-sso-token (geração de JWT HS256, TTL 600s) e do redirecionamento
 * SSO via GET https://api.conexaobatista.com.br/sso?token=TOKEN.
 *
 * Rota protegida por adminAuth (apenas administradores — validação contra a
 * coleção `admins`). Cada solicitação é registrada em logs sem expor dados
 * sensíveis (segredos, senhas, tokens, JWTs).
 *
 * GET /relatorio-implementacao-botao-mentor/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-implementacao-botao-mentor] Solicitação de relatório de implementação do botão do mentor por: ${solicitante}`,
  );

  const conteudo = montarRelatorioImplementacaoBotaoMentor();

  // Hora atual (São Paulo) incluída no nome do arquivo.
  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-implementacao-botao-mentor-16-08-2026-${horaArquivo}.txt`;

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
