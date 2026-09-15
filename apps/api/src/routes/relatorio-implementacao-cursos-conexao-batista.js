import logger from "../utils/logger.js";
import { montarRelatorioImplementacaoCursosConexaoBatista } from "./relatorio-download.js";

/**
 * Download do relatório de IMPLEMENTAÇÃO - CURSOS CONEXÃO BATISTA
 * (.txt gerado em memória) documentando três mudanças:
 *   1. Exibição da avaliação da IA no painel de Moderação de Cursos
 *      (ia_score, ia_veredito, parecer_ia, motivo_reprovacao).
 *   2. Ajuste do campo Sexo no cadastro (remoção de "Outro", manutenção de
 *      "Prefiro não informar").
 *   3. Filtro de igreja encadeado (UF -> Cidade -> Igreja) e campo CPF com
 *      validação módulo 11 (local, sem API externa).
 *
 * Rota protegida por adminAuth (administradores da coleção `admins`), pois o
 * download é disparado pela área administrativa (/adm/relatorio-alteracoes).
 * Cada solicitação é registrada em logs sem expor dados sensíveis (segredos,
 * senhas, tokens, JWTs ou valores reais).
 *
 * GET /relatorio-implementacao-cursos-conexao-batista/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-implementacao-cursos-conexao-batista] Solicitação de relatório de implementação Cursos Conexão Batista por: ${solicitante}`,
  );

  const conteudo = montarRelatorioImplementacaoCursosConexaoBatista();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-implementacao-cursos-conexao-batista-20-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
