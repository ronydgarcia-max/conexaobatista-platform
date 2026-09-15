import logger from "../utils/logger.js";
import { formatarDataHoraBrasilia } from "./relatorio-download.js";

/**
 * Monta o relatório de CORREÇÃO - ERRO AO BUSCAR DADOS DE USUÁRIOS (.txt)
 * documentando a correção realizada em 18/08/2026: o hook PocketBase
 * admin_validacoes.pb.js declarava as constantes de validação
 * (MENTOR_STATUS_FINAIS, PAPEIS_PERMITIDOS, VINCULO_STATUS_FINAIS) no topo
 * do arquivo (nível de módulo), mas os callbacks de hooks do PocketBase
 * rodam em escopos JSVM isolados onde bindings de nível de arquivo ficam
 * undefined. Ao aprovar/rejeitar um tutor, o callback referenciava
 * MENTOR_STATUS_FINAIS e abortava com "ReferenceError: MENTOR_STATUS_FINAIS
 * is not defined", fazendo toda escrita na coleção users falhar com erro
 * 400 ("Something went wrong while processing your request.").
 * Corrigido movendo as constantes para DENTRO de cada callback.
 * Gerado em memória (não persiste arquivo). NÃO expõe segredos, tokens,
 * JWTs ou credenciais.
 *
 * Arquivo: relatorio-correcao-erro-usuarios-18-08-2026-[HORA_BRASILIA].txt
 */
function montarRelatorioCorrecaoErroUsuarios() {
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
    "Arquivo: relatorio-correcao-erro-usuarios-18-08-2026-" +
      horaArquivo +
      ".txt",
  );
  linhas.push("");
  linhas.push("AVISO: O conteúdo deste relatório é baseado exclusivamente na");
  linhas.push("investigação real do código-fonte e dos logs de erro do");
  linhas.push("PocketBase. Nenhuma informação foi resumida, corrigida,");
  linhas.push("completada ou inventada. Nenhuma informação sensível (segredos,");
  linhas.push("tokens, JWTs, credenciais ou valores reais) é exposta neste");
  linhas.push("relatório.");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Índice =====
  linhas.push("ÍNDICE DE ALTERAÇÕES");
  linhas.push(sepMenor);
  linhas.push("  1. Correção - Erro ao Buscar Dados de Usuários");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Detalhamento =====
  linhas.push("DETALHAMENTO DAS ALTERAÇÕES");
  linhas.push(sep);
  linhas.push("");

  // 1 — Correção Erro ao Buscar Dados de Usuários
  linhas.push("1. CORREÇÃO - ERRO AO BUSCAR DADOS DE USUÁRIOS");
  linhas.push("   Data/hora: 18/08/2026 " + dataHoraBrasilia);
  linhas.push(sepMenor);
  linhas.push("Problema:");
  linhas.push("- Erro 400 (Bad Request) ao buscar/atualizar dados de usuários");
  linhas.push("  no PocketBase a partir da área administrativa.");
  linhas.push("- Endpoint afetado:");
  linhas.push("  PATCH /hcgi/platform/api/collections/users/records/<ID>");
  linhas.push("- Mensagem retornada:");
  linhas.push('  "Something went wrong while processing your request."');
  linhas.push('- Sintoma observado: clicar em "Aprovar" na página de Aprovação');
  linhas.push("  de Tutores (/adm/aprovacao-tutores) falhava; a página de");
  linhas.push("  Aprovação de Representantes (/adm/aprovacao-representantes)");
  linhas.push("  também não conseguia gravar decisões.");
  linhas.push("");
  linhas.push("Causa raiz:");
  linhas.push("- O hook PocketBase admin_validacoes.pb.js declarava as");
  linhas.push("  constantes de validação no TOPO do arquivo (nível de módulo):");
  linhas.push("    const PAPEIS_PERMITIDOS = [...];");
  linhas.push("    const MENTOR_STATUS_FINAIS = [...];");
  linhas.push("    const VINCULO_STATUS_FINAIS = [...];");
  linhas.push("- Os callbacks de hooks do PocketBase (onRecordUpdateRequest)");
  linhas.push("  rodam em escopos JSVM ISOLADOS. Bindings de nível de arquivo");
  linhas.push('  (const/let/var no topo do módulo) ficam UNDEFINED dentro do');
  linhas.push('  callback. (Ver HOOKS.md: "Define every helper and constant');
  linhas.push('  inside its callback; file-level bindings may be undefined.")');
  linhas.push("- Ao aprovar/rejeitar um tutor, o callback referenciava");
  linhas.push("  MENTOR_STATUS_FINAIS (em allowedValues) e abortava com:");
  linhas.push('  "ReferenceError: MENTOR_STATUS_FINAIS is not defined".');
  linhas.push("- O erro era registrado no log do PocketBase (auxiliary.db):");
  linhas.push('  PATCH /api/collections/users/records/<ID> — auth: "admins",');
  linhas.push('  error: "ReferenceError: MENTOR_STATUS_FINAIS is not defined".');
  linhas.push("- A escrita inteira na coleção users era abortada → HTTP 400.");
  linhas.push("");
  linhas.push("Localização: BACKEND (hook PocketBase).");
  linhas.push("");
  linhas.push("Solução:");
  linhas.push("- Removidas as declarações de nível de arquivo de");
  linhas.push("  PAPEIS_PERMITIDOS, MENTOR_STATUS_FINAIS e");
  linhas.push("  VINCULO_STATUS_FINAIS do topo de admin_validacoes.pb.js.");
  linhas.push("- Cada constante agora é declarada DENTRO do callback que a");
  linhas.push("  utiliza (escopo do callback), garantindo que esteja definida");
  linhas.push("  no momento do uso:");
  linhas.push("    * callback 'users': PAPEIS_PERMITIDOS + MENTOR_STATUS_FINAIS");
  linhas.push("    * callback 'vinculos_usuario_igreja': VINCULO_STATUS_FINAIS");
  linhas.push("- As funções isAuthAdmin, firstId e validarAcaoAdmin continuam");
  linhas.push("  sendo importadas via require(vinculos_utils.js) (correção");
  linhas.push("  anterior, mantida).");
  linhas.push("");
  linhas.push("Arquivo modificado:");
  linhas.push("- /apps/pocketbase/pb_hooks/admin_validacoes.pb.js");
  linhas.push("");
  linhas.push("Código ANTES:");
  linhas.push(sepMenor);
  linhas.push("  // Topo do arquivo — bindings de nível de módulo");
  linhas.push("  const PAPEIS_PERMITIDOS = ['pastor','secretario',...];");
  linhas.push("  const MENTOR_STATUS_FINAIS = ['aprovado','rejeitado'];");
  linhas.push("  const VINCULO_STATUS_FINAIS = ['ativo','recusado'];");
  linhas.push("");
  linhas.push("  onRecordUpdateRequest((e) => {");
  linhas.push("    if (e.hasSuperuserAuth()) { e.next(); return; }");
  linhas.push("    const { isAuthAdmin, ... } = require(`${__hooks}/vinculos_utils.js`);");
  linhas.push("    // ...");
  linhas.push("    validarAcaoAdmin({");
  linhas.push("      field: 'mentor_status',");
  linhas.push("      allowedValues: MENTOR_STATUS_FINAIS,  // <-- ReferenceError");
  linhas.push("      ...");
  linhas.push("    });");
  linhas.push("  }, 'users');");
  linhas.push("");
  linhas.push("Código DEPOIS:");
  linhas.push(sepMenor);
  linhas.push("  // Sem constantes no topo do arquivo.");
  linhas.push("");
  linhas.push("  onRecordUpdateRequest((e) => {");
  linhas.push("    if (e.hasSuperuserAuth()) { e.next(); return; }");
  linhas.push("    // Constantes declaradas DENTRO do callback (escopo isolado):");
  linhas.push("    const PAPEIS_PERMITIDOS = ['pastor','secretario',...];");
  linhas.push("    const MENTOR_STATUS_FINAIS = ['aprovado','rejeitado'];");
  linhas.push("    const { isAuthAdmin, ... } = require(`${__hooks}/vinculos_utils.js`);");
  linhas.push("    // ...");
  linhas.push("    validarAcaoAdmin({");
  linhas.push("      field: 'mentor_status',");
  linhas.push("      allowedValues: MENTOR_STATUS_FINAIS,  // <-- agora definida");
  linhas.push("      ...");
  linhas.push("    });");
  linhas.push("  }, 'users');");
  linhas.push("");
  linhas.push("Teste realizado:");
  linhas.push("- Página carrega: ✅ Sucesso (sem erro 400).");
  linhas.push("- Dados carregam: ✅ Confirmado.");
  linhas.push("- Sem erro 400: ✅ Confirmado.");
  linhas.push("- ReferenceError ausente dos logs do PocketBase após a correção:");
  linhas.push("  ✅ Confirmado (nenhuma nova entrada ReferenceError após reload).");
  linhas.push("");
  linhas.push("Impacto:");
  linhas.push("- Página de Aprovação de Representantes funciona.");
  linhas.push("- Página de Aprovação de Tutores funciona (aprovar/rejeitar).");
  linhas.push("- Promoção de administrador funciona (mesmo hook).");
  linhas.push("- Dados de usuários carregam e gravam corretamente.");
  linhas.push("- Sem erros HTTP 400 nas escritas da coleção users.");
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
  linhas.push("- Conteúdo reflete exclusivamente a investigação real do código-");
  linhas.push("  fonte e dos logs de erro; nada foi resumido, corrigido,");
  linhas.push("  completado ou inventado.");
  linhas.push("");
  linhas.push("Status final: Relatório de correção do erro ao buscar dados de");
  linhas.push("usuários gerado com sucesso.");
  linhas.push("");
  linhas.push("Gerado em: " + dataHoraBrasilia);
  linhas.push(sep);
  linhas.push("Fim do relatório.");
  linhas.push(sep);

  return linhas.join("\n");
}

/**
 * Download do relatório de correção do erro ao buscar dados de usuários
 * (.txt gerado em memória). Rota protegida por authMiddleware (apenas
 * usuários autenticados). Registra o acesso em logs sem expor segredos.
 * GET /relatorio-correcao-erro-usuarios/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.username || "usuário desconhecido";
  logger.info(
    `[relatorio-correcao-erro-usuarios] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoErroUsuarios();
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
    'attachment; filename="relatorio-correcao-erro-usuarios-18-08-2026-' +
      horaArquivo +
      '.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
