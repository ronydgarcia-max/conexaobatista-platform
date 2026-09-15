import logger from "../utils/logger.js";
import { montarRelatorioLimpezaCampoCidadeAntigo } from "./relatorio-download.js";

/**
 * Download do relatório de LIMPEZA - REMOÇÃO DO CAMPO ANTIGO DE CIDADE
 * (.txt gerado em memória) documentando a remoção do campo antigo "Cidade"
 * (input de texto para digitar) do formulário de cadastro de usuário
 * (SignupPage.jsx) e da página "Minha conta" (MinhaContaPage.jsx),
 * mantendo apenas o novo filtro encadeado (UF -> Cidade -> Igreja) do
 * componente IgrejaFilterFields.jsx. A coluna `cidade` da coleção `users`
 * (PocketBase) NÃO é removida — dados antigos permanecem salvos, apenas
 * deixam de ser editáveis via formulário.
 *
 * Rota protegida por adminAuth (administradores da coleção `admins`). Cada
 * solicitação é registrada em logs sem expor dados sensíveis (segredos,
 * senhas, tokens, JWTs ou valores reais).
 *
 * GET /relatorio-limpeza-campo-cidade-antigo/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-limpeza-campo-cidade-antigo] Solicitação de relatório de limpeza do campo antigo de cidade por: ${solicitante}`,
  );

  const conteudo = montarRelatorioLimpezaCampoCidadeAntigo();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-limpeza-campo-cidade-antigo-24-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
