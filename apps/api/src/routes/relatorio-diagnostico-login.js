import logger from "../utils/logger.js";
import { montarRelatorioDiagnosticoLogin } from "./relatorio-download.js";

/**
 * Download do relatório de DIAGNÓSTICO DE ERRO DE LOGIN (.txt gerado em
 * memória) documentando a investigação do erro
 * "Usuário ou senha inválidos. Verifique e tente novamente." reportado pelo
 * usuário mentor noellilgarcia@gmail.com ao tentar autenticar-se em /login.
 *
 * A rota realiza uma verificação AO VIVO no PocketBase (coleções users e
 * admins) no momento da geração, registra o motivo exato da falha em logs
 * (sem expor senhas ou credenciais) e repassa o resultado à função que
 * monta o relatório, de modo que o conteúdo reflita o estado real atual.
 *
 * Rota protegida por adminAuth (apenas administradores, validação contra a
 * coleção admins). GET /relatorio-diagnostico-login/download
 */
const EMAIL_TESTADO = "noellilgarcia@gmail.com";
const ARQUIVO = "relatorio-diagnostico-login-mentor-16-08-2026-1720.txt";

async function consultarPocketBase(path) {
  const url = `http://localhost:8090${path}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    logger.error(
      `[relatorio-diagnostico-login] falha ao consultar PocketBase: ${String(err)}`,
    );
    return null;
  }
}

export default async (req, res) => {
  const solicitante =
    req.admin?.name || req.admin?.username || "administrador desconhecido";
  logger.info(
    `[relatorio-diagnostico-login] Solicitação de relatório de diagnóstico de login por: ${solicitante}`,
  );

  // Verificação ao vivo no banco de dados.
  const filtroEmail = encodeURIComponent(`email="${EMAIL_TESTADO}"`);
  const [usersData, adminsData, totalData] = await Promise.all([
    consultarPocketBase(
      `/api/collections/users/records?filter=${filtroEmail}&fields=id&perPage=1`,
    ),
    consultarPocketBase(
      `/api/collections/admins/records?filter=${filtroEmail}&fields=id&perPage=1`,
    ),
    consultarPocketBase(`/api/collections/users/records?perPage=1&fields=id`),
  ]);

  const existeUsers = !!(usersData && usersData.totalItems > 0);
  const existeAdmins = !!(adminsData && adminsData.totalItems > 0);
  const totalUsers = totalData?.totalItems ?? 0;

  // Determina o motivo exato da falha e registra em logs (sem expor senha).
  let problema;
  let causaRaiz;
  if (existeUsers) {
    problema =
      "Conta existente na coleção users — a falha de login deve-se a senha incorreta ou conta não verificada.";
    causaRaiz =
      "O e-mail está cadastrado, portanto a rejeição da autenticação pelo PocketBase indica credenciais inválidas (senha incorreta) ou e-mail não verificado.";
  } else if (existeAdmins) {
    problema =
      "Conta existente apenas na coleção admins — login de mentor deve ser feito em /login com conta de usuário (users), não de administrador.";
    causaRaiz =
      "O e-mail pertence a um administrador (coleção admins); a página /login autentica apenas em users.";
  } else {
    problema =
      "Conta de usuário inexistente no banco de dados (coleção users e admins).";
    causaRaiz =
      "O e-mail " +
      EMAIL_TESTADO +
      " não está cadastrado na coleção users nem na coleção admins do PocketBase.";
  }

  logger.info(
    `[relatorio-diagnostico-login] Motivo exato da falha de login para ${EMAIL_TESTADO}: ` +
      `existeUsers=${existeUsers}, existeAdmins=${existeAdmins}, totalUsers=${totalUsers}. ` +
      `Problema: ${problema}`,
  );

  const conteudo = montarRelatorioDiagnosticoLogin({
    existeUsers,
    existeAdmins,
    totalUsers,
    problema,
    causaRaiz,
  });

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${ARQUIVO}"`,
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
