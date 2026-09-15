import logger from "../utils/logger.js";
import { montarRelatorioListaCanonicaCategorias } from "./relatorio-download.js";

/**
 * Download do relatório de IMPLEMENTAÇÃO - LISTA CANÔNICA DE CATEGORIAS
 * (.txt gerado em memória) documentando:
 *   1. Criação da lista canônica de 33 categorias (apps/api/src/utils/
 *      categorias.js) + endpoint público GET /categorias.
 *   2. Migração dos 3 cursos existentes (Bíblia → Teologia e Bíblia;
 *      Discipulado → Discipulado e Vida Cristã; Liderança → Liderança e
 *      Administração Eclesiástica) — executada na VPS via UPDATE no banco
 *      cursos_db; o proxy /cursos-publicados normaliza os nomes antigos
 *      enquanto a migração não é replicada.
 *   3. Remoção do filtro "Nível" (Iniciante/Intermediário/Avançado) da
 *      página pública /cursos (não existe coluna de nível na tabela cursos).
 *   4. Substituição das categorias fixas (Fé/Negócios/Profissional) pelas
 *      categorias canônicas carregadas dinamicamente do endpoint GET
 *      /categorias, e exibição dos cursos publicados reais via proxy
 *      GET /cursos-publicados.
 *
 * NÃO expõe segredos, tokens, JWTs ou credenciais.
 *
 * Rota protegida por adminAuth (administradores da coleção `admins`). Cada
 * solicitação é registrada em logs sem expor dados sensíveis.
 *
 * GET /relatorio-lista-canonica-categorias/download
 */
export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-lista-canonica-categorias] Solicitação de relatório da lista canônica de categorias por: ${solicitante}`,
  );

  const conteudo = montarRelatorioListaCanonicaCategorias();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-lista-canonica-categorias-24-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
