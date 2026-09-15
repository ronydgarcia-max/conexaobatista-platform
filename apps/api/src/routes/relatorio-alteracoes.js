import { Router } from "express";
import logger from "../utils/logger.js";
import { montarRelatorio, montarRelatorioSeguranca } from "./relatorio-download.js";
import { validateAuthToken } from "../utils/authToken.js";

/**
 * Middleware de autenticação para a coleção `admins` do PocketBase.
 *
 * Valida o token Bearer decodificando o JWT e lendo o próprio registro do
 * admin via GET — SEM chamar /auth-refresh. O auth-refresh do PocketBase
 * rotaciona o `tokenKey` do registro, o que invalida o token que o frontend
 * ainda tem em memória; chamá-lo a cada requisição fazia o 1º download
 * funcionar e o 2º falhar com 401 (token "velho" invalidado pela rotação) —
 * a causa raiz do erro "Acesso restrito a administradores" recorrente.
 *
 * Exportado para reutilização em outras rotas administrativas (ex.:
 * relatório de verificação de segurança).
 */
export async function adminAuth(req, res, next) {
  const reject = () => res.status(401).json({ error: "Unauthorized" });
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return reject();
  const token = header.slice("Bearer ".length).trim();
  const record = await validateAuthToken(token, "admins");
  if (!record) return reject();
  req.admin = record;
  return next();
}

/**
 * Metadados do relatório (período, nº de alterações, tamanho aproximado).
 * GET /relatorio-alteracoes/info
 */
async function info(req, res) {
  const conteudo = montarRelatorio();
  const tamanhoBytes = Buffer.byteLength(conteudo, "utf-8");
  const tamanhoKb = (tamanhoBytes / 1024).toFixed(1);

  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-alteracoes] Consulta de metadados por: ${solicitante}`,
  );

  return res.status(200).json({
    periodo: "15/08/2026 a 16/08/2026",
    totalAlteracoes: 10,
    tamanhoBytes,
    tamanhoTexto: `${tamanhoKb} KB`,
    arquivo: "relatorio-alteracoes-15-16-agosto-2026.txt",
    ultimaAtualizacao: "16/08/2026",
  });
}

/**
 * Download do relatório (.txt gerado em memória).
 * GET /relatorio-alteracoes/download
 */
async function download(req, res) {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-alteracoes] Solicitação de download por: ${solicitante}`,
  );

  const conteudo = montarRelatorio();

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="relatorio-alteracoes-15-16-agosto-2026.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
}

const ARQUIVO_SEGURANCA = "relatorio-alteracoes-16-agosto-2026-seguranca.txt";

/**
 * Metadados do relatório de SEGURANÇA (8 alterações dos Blocos 1, 2 e 3).
 * GET /relatorio-alteracoes/seguranca/info
 */
async function segurancaInfo(req, res) {
  const conteudo = montarRelatorioSeguranca();
  const tamanhoBytes = Buffer.byteLength(conteudo, "utf-8");
  const tamanhoKb = (tamanhoBytes / 1024).toFixed(1);

  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-alteracoes] Consulta de metadados (segurança) por: ${solicitante}`,
  );

  return res.status(200).json({
    periodo: "16/08/2026",
    totalAlteracoes: 8,
    tamanhoBytes,
    tamanhoTexto: `${tamanhoKb} KB`,
    arquivo: ARQUIVO_SEGURANCA,
    ultimaAtualizacao: "16/08/2026",
  });
}

/**
 * Download do relatório de SEGURANÇA (.txt gerado em memória).
 * GET /relatorio-alteracoes/seguranca/download
 */
async function segurancaDownload(req, res) {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-alteracoes] Solicitação de download (segurança) por: ${solicitante}`,
  );

  const conteudo = montarRelatorioSeguranca();

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${ARQUIVO_SEGURANCA}"`,
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
}

const router = Router();

router.get("/info", adminAuth, info);
router.get("/download", adminAuth, download);
router.get("/seguranca/info", adminAuth, segurancaInfo);
router.get("/seguranca/download", adminAuth, segurancaDownload);

export default router;
