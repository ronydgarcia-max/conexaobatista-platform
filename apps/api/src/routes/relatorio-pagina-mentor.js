import logger from "../utils/logger.js";
import { montarRelatorioPaginaMentor } from "./relatorio-download.js";

/**
 * Download do relatório da PÁGINA DE BOAS-VINDAS DO MENTOR (.txt gerado em
 * memória) documentando a criação da página de boas-vindas do mentor com
 * layout split-screen integrado, gerenciamento de imagem pela área
 * administrativa, regra de gênero para a saudação e reutilização da lógica
 * de SSO existente.
 *
 * Rota protegida por adminAuth (apenas administradores — validação contra a
 * coleção `admins`). Cada solicitação é registrada em logs sem expor dados
 * sensíveis (segredos, senhas, tokens, JWTs).
 *
 * GET /relatorio-pagina-mentor/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-pagina-mentor] Solicitação de relatório da página de boas-vindas do mentor por: ${solicitante}`,
  );

  const conteudo = montarRelatorioPaginaMentor();

  // Hora atual (São Paulo) incluída no nome do arquivo.
  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-pagina-mentor-boas-vindas-16-08-2026-${horaArquivo}.txt`;

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
