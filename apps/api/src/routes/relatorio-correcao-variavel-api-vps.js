// Relatório administrativo da auditoria da variável de ambiente que aponta
// para a API da VPS. Nenhum segredo ou valor sensível é incluído no relatório.
// GET /relatorio-correcao-variavel-api-vps/download

import logger from "../utils/logger.js";

const VARIAVEIS_APPS_API_ENV = [
  "PORT",
  "CORS_ORIGIN",
  "CURSOS_API_URL",
  "CURSOS_API_BRIDGE_SECRET",
  "CURSOS_ADMIN_API_URL",
  "MENTOR_JWT_SECRET",
  "MENTOR_REAL_URL",
  "MENTOR_ENV",
  "MENTOR_PAINEL_SSO_URL",
  "JWT_SECRET",
];

function montarRelatorio() {
  const dataHora = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

  return [
    "================================================================================",
    "RELATÓRIO DE AUDITORIA DA VARIÁVEL DE AMBIENTE DA API DA VPS",
    "================================================================================",
    "",
    `Data/Hora (Brasília): ${dataHora}`,
    "Fonte verificada: apps/api/.env (único arquivo .env localizado no projeto).",
    "",
    "--------------------------------------------------------------------------------",
    "1. VARIÁVEIS DE AMBIENTE IDENTIFICADAS",
    "--------------------------------------------------------------------------------",
    "Foram identificados somente os nomes abaixo. Valores não são reproduzidos;",
    "segredos, tokens, chaves e credenciais não são incluídos neste relatório.",
    ...VARIAVEIS_APPS_API_ENV.map((nome) => `  - ${nome}`),
    "",
    "--------------------------------------------------------------------------------",
    "2. AUDITORIA DA OCORRÊNCIA SOLICITADA",
    "--------------------------------------------------------------------------------",
    "Domínio procurado: curso.conexaobatista.com.br",
    "Domínio de destino: cursos.conexaobatista.com.br",
    "Variável candidata principal: CURSOS_API_URL.",
    "Resultado da busca exata no arquivo de ambiente e no código do projeto:",
    "NÃO ENCONTRADA a ocorrência do domínio singular curso.conexaobatista.com.br.",
    "A configuração de ambiente já contém o domínio plural em sua configuração",
    "correspondente; o valor completo foi omitido por segurança.",
    "",
    "--------------------------------------------------------------------------------",
    "3. ALTERAÇÃO APLICADA",
    "--------------------------------------------------------------------------------",
    "Substituição curso.conexaobatista.com.br → cursos.conexaobatista.com.br:",
    "NÃO APLICADA, pois a ocorrência singular solicitada não existe na configuração",
    "real identificada. Nenhuma outra parte de qualquer valor foi alterada.",
    "Valor antigo: NÃO APLICÁVEL — ocorrência não encontrada.",
    "Valor novo: NÃO APLICÁVEL — nenhuma substituição necessária.",
    "Confirmação: a configuração foi preservada para evitar alterar um host, path",
    "ou porta que não corresponda exatamente à ocorrência solicitada.",
    "",
    "--------------------------------------------------------------------------------",
    "4. REDEPLOY, REBUILD E VALIDAÇÕES",
    "--------------------------------------------------------------------------------",
    "- Nenhum rebuild específico de variável de ambiente foi necessário, pois não",
    "  houve alteração de valor no arquivo .env.",
    "- Reload/redeploy da aplicação: REALIZADO via reload_app após a inclusão deste",
    "  relatório administrativo e do respectivo registro no painel.",
    "- Busca exata por curso.conexaobatista.com.br: NÃO ENCONTRADA.",
    "- Valores de segredos, tokens, chaves e credenciais: não expostos.",
    "- Validação de tráfego real até a VPS após o reload: NÃO COMPROVADA; não foi",
    "  executada uma requisição autenticada contra a API externa nesta tarefa.",
    "",
    "================================================================================",
    "FIM DO RELATÓRIO",
    "================================================================================",
  ].join("\n");
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    "[relatorio-correcao-variavel-api-vps] Solicitação por: " + solicitante,
  );

  const dataHoraArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/[/: ]/g, "-");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="relatorio-correcao-variavel-api-vps-${dataHoraArquivo}.txt"`,
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(montarRelatorio());
};
