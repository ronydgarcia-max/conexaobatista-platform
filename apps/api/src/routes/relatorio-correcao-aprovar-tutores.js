import logger from "../utils/logger.js";
import { formatarDataHoraBrasilia } from "./relatorio-download.js";

/**
 * Monta o relatório de CORREÇÃO - ERRO AO APROVAR TUTORES (.txt) documentando
 * a correção realizada em 18/08/2026: o hook PocketBase admin_validacoes.pb.js
 * declarava localmente `isAuthAdmin`/`firstId`, mas o bundler de hooks não
 * tornava a função disponível no momento da chamada (ReferenceError:
 * isAuthAdmin is not defined), fazendo toda aprovação/rejeição de tutor
 * falhar com erro 500. Corrigido importando as funções de vinculos_utils.js.
 * Gerado em memória (não persiste arquivo). NÃO expõe segredos, tokens,
 * JWTs ou credenciais.
 *
 * Arquivo: relatorio-correcao-aprovar-tutores-18-08-2026-[HORA_BRASILIA].txt
 */
function montarRelatorioCorrecaoAprovarTutores() {
  const sep = "=".repeat(78);
  const sepMenor = "-".repeat(78);
  const agora = new Date();
  const horaBr = agora.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
  const horaArquivo = horaBr.replace(":", "");
  const dataHoraBrasilia = formatarDataHoraBrasilia(agora);

  const linhas = [];

  // ===== Cabeçalho =====
  linhas.push(sep);
  linhas.push("RELATÓRIO DE ALTERAÇÕES - O Conexão Batista");
  linhas.push(sep);
  linhas.push("Período das alterações: 18/08/2026");
  linhas.push("Gerado em: " + dataHoraBrasilia);
  linhas.push(
    "Arquivo: relatorio-correcao-aprovar-tutores-18-08-2026-" +
      horaArquivo +
      ".txt",
  );
  linhas.push("");
  linhas.push("AVISO: O conteúdo deste relatório é baseado exclusivamente no");
  linhas.push("histórico real das alterações realizadas e registradas. Nenhuma");
  linhas.push("informação foi resumida, corrigida, completada ou inventada.");
  linhas.push("Nenhuma informação sensível (segredos, tokens, JWTs, credenciais");
  linhas.push("ou valores reais) é exposta neste relatório.");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Índice =====
  linhas.push("ÍNDICE DE ALTERAÇÕES");
  linhas.push(sepMenor);
  linhas.push("  1. Correção - Erro ao Aprovar Tutores");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Detalhamento =====
  linhas.push("DETALHAMENTO DAS ALTERAÇÕES");
  linhas.push(sep);
  linhas.push("");

  // 1 — Correção Erro ao Aprovar Tutores
  linhas.push("1. CORREÇÃO - ERRO AO APROVAR TUTORES");
  linhas.push("   Data/hora: 18/08/2026 " + dataHoraBrasilia);
  linhas.push(sepMenor);
  linhas.push("Problema:");
  linhas.push('- Ao clicar em "Aprovar" na página de Aprovação de Tutores');
  linhas.push("  (/adm/aprovacao-tutores) a ação falhava com erro 500");
  linhas.push('  ("Something went wrong while processing your request.").');
  linhas.push("- O frontend chama pb.collection('users').update(id, {...}) para");
  linhas.push("  alterar mentor_status de 'pendente' para 'aprovado'/'rejeitado'.");
  linhas.push("- Essa escrita dispara o hook onRecordUpdateRequest da coleção");
  linhas.push("  users em admin_validacoes.pb.js, que abortava com:");
  linhas.push('  "ReferenceError: isAuthAdmin is not defined".');
  linhas.push("");
  linhas.push("Causa raiz:");
  linhas.push("- O arquivo admin_validacoes.pb.js declarava localmente, no topo");
  linhas.push("  do módulo, as funções `isAuthAdmin` e `firstId` (function");
  linhas.push("  declarations). O bundler de hooks do PocketBase não as tornava");
  linhas.push("  disponíveis no escopo do callback onRecordUpdateRequest no");
  linhas.push("  momento da chamada, gerando o ReferenceError e abortando toda");
  linhas.push("  aprovação/rejeição de tutor (e também a promoção de admin e a");
  linhas.push("  aprovação de representantes pelo caminho REST).");
  linhas.push("");
  linhas.push("Localização: BACKEND (hook PocketBase).");
  linhas.push("");
  linhas.push("Solução:");
  linhas.push("- Removidas as declarações locais de `isAuthAdmin` e `firstId` de");
  linhas.push("  admin_validacoes.pb.js.");
  linhas.push("- As funções passaram a ser importadas de vinculos_utils.js via");
  linhas.push("  require(`${__hooks}/vinculos_utils.js`), que já exporta ambas");
  linhas.push("  (isAuthAdmin, firstId) e é o mesmo módulo já usado com sucesso");
  linhas.push("  por vinculos_flow.pb.js.");
  linhas.push("- Cada handler onRecordUpdateRequest agora obtém isAuthAdmin,");
  linhas.push("  firstId e validarAcaoAdmin do require no início do callback.");
  linhas.push("");
  linhas.push("Arquivo modificado:");
  linhas.push("- /apps/pocketbase/pb_hooks/admin_validacoes.pb.js");
  linhas.push("");
  linhas.push("Código ANTES:");
  linhas.push(sepMenor);
  linhas.push("  function isAuthAdmin(auth) {");
  linhas.push("    if (!auth) return false;");
  linhas.push('    try { if (auth.collection().name === "admins") return true; } catch (_) {}');
  linhas.push('    try { if (auth.collectionName === "admins") return true; } catch (_) {}');
  linhas.push("    return false;");
  linhas.push("  }");
  linhas.push("");
  linhas.push("  function firstId(raw) {");
  linhas.push('    return Array.isArray(raw) ? raw[0] || "" : raw || "";');
  linhas.push("  }");
  linhas.push("");
  linhas.push("  onRecordUpdateRequest((e) => {");
  linhas.push("    if (e.hasSuperuserAuth()) { e.next(); return; }");
  linhas.push("    const { validarAcaoAdmin } = require(`${__hooks}/vinculos_utils.js`);");
  linhas.push("    // ...");
  linhas.push("    if (!isAuthAdmin(auth)) {  // <-- ReferenceError aqui");
  linhas.push("      throw new BadRequestError(...);");
  linhas.push("    }");
  linhas.push("  }, 'users');");
  linhas.push("");
  linhas.push("Código DEPOIS:");
  linhas.push(sepMenor);
  linhas.push("  // Declarações locais de isAuthAdmin/firstId REMOVIDAS.");
  linhas.push("");
  linhas.push("  onRecordUpdateRequest((e) => {");
  linhas.push("    if (e.hasSuperuserAuth()) { e.next(); return; }");
  linhas.push("    const { isAuthAdmin, firstId, validarAcaoAdmin } =");
  linhas.push("      require(`${__hooks}/vinculos_utils.js`);");
  linhas.push("    // ...");
  linhas.push("    if (!isAuthAdmin(auth)) {  // <-- agora definida via require");
  linhas.push("      throw new BadRequestError(...);");
  linhas.push("    }");
  linhas.push("  }, 'users');");
  linhas.push("");
  linhas.push("Teste realizado:");
  linhas.push('- Clicar em "Aprovar": ✅ Sucesso (sem erro 500).');
  linhas.push("- Status do tutor muda (pendente → aprovado): ✅ Confirmado.");
  linhas.push("- Sem erro (ReferenceError ausente): ✅ Confirmado.");
  linhas.push('- Rejeição de tutor (pendente → rejeitado): ✅ também corrigida');
  linhas.push("  pelo mesmo caminho.");
  linhas.push("");
  linhas.push("Impacto:");
  linhas.push("- Aprovação de tutores agora funciona sem erros.");
  linhas.push("- Rejeição de tutores também funciona (mesmo hook).");
  linhas.push("- Promoção de administrador e aprovação de representantes pelo");
  linhas.push("  caminho REST (admin), que compartilhavam o mesmo hook, também");
  linhas.push("  foram corrigidos.");
  linhas.push("- O status do tutor (mentor_status) atualiza corretamente e os");
  linhas.push("  campos de auditoria (mentor_aprovado_por, mentor_data_aprovacao)");
  linhas.push("  são preenchidos pelo hook.");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Rodapé =====
  linhas.push("RODAPÉ - RESUMO FINAL");
  linhas.push(sepMenor);
  linhas.push("Total de correções registradas: 1");
  linhas.push("");
  linhas.push("Resumo por área:");
  linhas.push("- BACKEND (hook PocketBase admin_validacoes.pb.js): 1 (1)");
  linhas.push("");
  linhas.push("Avisos:");
  linhas.push("- Relatório gerado dinamicamente em memória, sem salvar arquivo no");
  linhas.push("  servidor; relatórios existentes não são sobrescritos.");
  linhas.push("- Acesso restrito a usuários autenticados (authMiddleware), com");
  linhas.push("  registro de cada solicitação em logs do servidor.");
  linhas.push("- Nenhuma informação sensível (segredos, tokens, JWTs, credenciais");
  linhas.push("  ou valores reais) é exposta no conteúdo do relatório.");
  linhas.push("- Conteúdo reflete exclusivamente o histórico real das alterações.");
  linhas.push("");
  linhas.push("Status final: Relatório de correção do erro ao aprovar tutores");
  linhas.push("gerado com sucesso.");
  linhas.push("");
  linhas.push("Gerado em: " + dataHoraBrasilia);
  linhas.push(sep);
  linhas.push("Fim do relatório.");
  linhas.push(sep);

  return linhas.join("\n");
}

/**
 * Download do relatório de correção do erro ao aprovar tutores (.txt gerado
 * em memória). Rota protegida por authMiddleware (apenas usuários
 * autenticados). Registra o acesso em logs sem expor segredos.
 * GET /relatorio-correcao-aprovar-tutores/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.username || "usuário desconhecido";
  logger.info(
    `[relatorio-correcao-aprovar-tutores] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoAprovarTutores();
  const agora = new Date();
  const horaBr = agora.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
  const horaArquivo = horaBr.replace(":", "");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="relatorio-correcao-aprovar-tutores-18-08-2026-' +
      horaArquivo +
      '.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
