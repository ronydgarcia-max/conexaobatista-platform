import logger from "../utils/logger.js";
import { montarRelatorioAtualizacaoBloco02ValideMembresia } from "./relatorio-download.js";

/**
 * Download do relatório de ATUALIZAÇÃO - CONTEÚDO DO BLOCO 02 VALIDE SUA
 * MEMBRESIA (.txt gerado em memória).
 *
 * Documenta a substituição do texto explicativo do bloco "02 — Valide sua
 * membresia" da página "Como participar" (JoinPage.jsx), passando de três
 * opções (A/B/C) para duas opções (Validação pela igreja / Apadrinhamento),
 * mantendo o título, o layout, o padrão visual, a tipografia e a hierarquia.
 *
 * Rota protegida por adminAuth (coleção `admins`).
 * GET /relatorio-atualizacao-bloco-02-valide-membresia/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-atualizacao-bloco-02-valide-membresia] Solicitação de relatório de atualização do bloco 02 por: ${solicitante}`,
  );

  const conteudo = montarRelatorioAtualizacaoBloco02ValideMembresia();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-atualizacao-bloco-02-valide-membresia-25-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
