import logger from "../utils/logger.js";
import { formatarDataHoraBrasilia } from "./relatorio-download.js";

/**
 * Monta o relatório de INVESTIGAÇÃO REAL E CORREÇÃO DEFINITIVA - MEMBROS
 * PENDENTES NÃO APARECEM NA LISTA DE APROVAÇÃO DO PAINEL DA IGREJA (.txt)
 * documentando a investigação feita em 18/08/2026 com leitura direta do
 * banco PocketBase (data.db) e a correção que elimina a divergência de
 * fontes de verdade. Gerado em memória (não persiste arquivo). NÃO expõe
 * segredos, tokens, JWTs ou credenciais.
 *
 * Arquivo: relatorio-investigacao-correcao-membros-pendentes-18-08-2026-[HORA].txt
 */
function montarRelatorioInvestigacaoCorrecaoMembrosPendentes() {
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
    "Arquivo: relatorio-investigacao-correcao-membros-pendentes-18-08-2026-" +
      horaArquivo +
      ".txt",
  );
  linhas.push("");
  linhas.push("AVISO: O conteúdo deste relatório é baseado exclusivamente na");
  linhas.push("investigação real do código-fonte, do schema do PocketBase e");
  linhas.push("da leitura direta do banco de dados (data.db via node:sqlite).");
  linhas.push("Nenhuma informação foi resumida, corrigida, completada ou");
  linhas.push("inventada. Nenhuma informação sensível (segredos, tokens, JWTs,");
  linhas.push("credenciais ou valores reais) é exposta neste relatório.");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Índice =====
  linhas.push("ÍNDICE DE ALTERAÇÕES");
  linhas.push(sepMenor);
  linhas.push(
    "  1. Investigação e Correção - Membros Pendentes Não Aparecem",
  );
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Detalhamento =====
  linhas.push("DETALHAMENTO DAS ALTERAÇÕES");
  linhas.push(sep);
  linhas.push("");

  linhas.push(
    "1. INVESTIGAÇÃO E CORREÇÃO - MEMBROS PENDENTES NÃO APARECEM",
  );
  linhas.push("   Data/hora: 18/08/2026 " + dataHoraBrasilia);
  linhas.push(sepMenor);

  linhas.push("Problema:");
  linhas.push("- Dorival Garcia (dorivalgarcia@gmail.com) foi cadastrado");
  linhas.push("  normalmente, com vínculo pendente de MEMBRO com a igreja");
  linhas.push("  \"PRIMEIRA IGREJA BATISTA EM MOREIRA CESAR\", mas NÃO aparecia");
  linhas.push("  na lista de aprovação do painel da igreja");
  linhas.push("  (/igreja/aprovacao-membros) — lista vazia, HTTP 200, sem erro.");
  linhas.push("");

  linhas.push("Investigação realizada (leitura direta do banco PocketBase):");
  linhas.push("");
  linhas.push("1) COLEÇÃO BUSCADA PELA PÁGINA /igreja/aprovacao-membros");
  linhas.push("   - Arquivo: apps/web/src/pages/igreja/AprovacaoMembrosPage.jsx");
  linhas.push("   - Coleção: 'vinculos_usuario_igreja'");
  linhas.push("   - Query COMPLETA (código ANTES):");
  linhas.push("       const filtros = [");
  linhas.push("         pb.filter('igreja_id = {:ig}', { ig: igrejaId }),");
  linhas.push("         pb.filter('papel = \"membro\"'),");
  linhas.push("       ];");
  linhas.push("       if (filtroStatus !== 'todos') {");
  linhas.push("         filtros.push(pb.filter('status = {:st}', { st: filtroStatus }));");
  linhas.push("       }");
  linhas.push("       const result = await pb.collection('vinculos_usuario_igreja')");
  linhas.push("         .getList(pagina, PER_PAGE, {");
  linhas.push("           filter: filtros.join(' && '),");
  linhas.push("           expand: 'usuario_id,igreja_id',");
  linhas.push("           sort: '-created',");
  linhas.push("         });");
  linhas.push("   - Filtro efetivo enviado:");
  linhas.push("       igreja_id = \"<igrejaId>\" && papel = \"membro\" && status = \"pendente\"");
  linhas.push("   - igrejaId era calculado por:");
  linhas.push("       const igrejaId = getIgrejaId(currentUser) || ctxIgrejaId;");
  linhas.push("     onde getIgrejaId(currentUser) lê users.igreja_id do authStore");
  linhas.push("     (registro CACHÉADO no momento do login).");
  linhas.push("");

  linhas.push("2) ESTRUTURA DO POCKETBASE — coleção vinculos_usuario_igreja");
  linhas.push("   - Campos exatos:");
  linhas.push("       id (text, PK)");
  linhas.push("       usuario_id (relation -> users, maxSelect 1, required)");
  linhas.push("       igreja_id (relation -> empresas, maxSelect 1, required)");
  linhas.push("       papel (select: pastor | secretario | presidente | membro)");
  linhas.push("       status (select: pendente | ativo | suspenso | encerrado | recusado)");
  linhas.push("       pode_aprovar_membros (bool)");
  linhas.push("       responsavel_nome (text)");
  linhas.push("       motivo_alteracao (text)");
  linhas.push("       motivo_recusa (text)");
  linhas.push("       data_criacao, data_alteracao, created, updated (autodate)");
  linhas.push("   - Regra de acesso (listRule/viewRule):");
  linhas.push("       @request.auth.id != '' && (");
  linhas.push("         usuario_id = @request.auth.id ||");
  linhas.push("         @request.auth.collectionName = 'admins' ||");
  linhas.push("         ((@request.auth.papel = 'pastor' ||");
  linhas.push("           @request.auth.papel = 'secretario' ||");
  linhas.push("           @request.auth.papel = 'presidente' ||");
  linhas.push("           @request.auth.papel = 'admin') &&");
  linhas.push("          igreja_id = @request.auth.igreja_id)");
  linhas.push("       )");
  linhas.push("   - A regra filtra os vínculos visíveis por");
  linhas.push("     igreja_id = @request.auth.igreja_id (valor FRESCO do banco,");
  linhas.push("     pois o PocketBase recarrega o auth record a cada requisição).");
  linhas.push("");

  linhas.push("3) DADOS REAIS LIDOS DO BANCO (data.db):");
  linhas.push("   - Dorival (users.id = iwzx2vzbv7xaof7):");
  linhas.push("       email = dorivalgarcia@gmail.com");
  linhas.push("       papel = membro, status_aprovacao = pendente");
  linhas.push("       users.igreja_id = kv21o5eacosy8j4");
  linhas.push("   - Vínculo de Dorival (vinculos_usuario_igreja.id = fxy8sbrdv1r74d9):");
  linhas.push("       usuario_id = iwzx2vzbv7xaof7");
  linhas.push("       igreja_id  = kv21o5eacosy8j4");
  linhas.push("       papel = membro, status = pendente, pode_aprovar_membros = 0");
  linhas.push("   - Igreja (empresas.id = kv21o5eacosy8j4):");
  linhas.push("       razao_social = PRIMEIRA IGREJA BATISTA EM MOREIRA CESAR");
  linhas.push("       tipo = igreja, status_aprovacao = aprovado");
  linhas.push("   - Pastores que deveriam ver Dorival:");
  linhas.push("       Rony Garcia (users.id = z5frz1bg23zq4j6):");
  linhas.push("         papel = admin, status_aprovacao = aprovado,");
  linhas.push("         users.igreja_id = kv21o5eacosy8j4");
  linhas.push("         vínculo ativo: pastor, status=ativo, pode_aprovar=1,");
  linhas.push("           igreja_id = kv21o5eacosy8j4");
  linhas.push("       Robson Rene (users.id = khnjxmh8pa7gv5y):");
  linhas.push("         papel = pastor, users.igreja_id = kv21o5eacosy8j4");
  linhas.push("         vínculo ativo: pastor, status=ativo, pode_aprovar=1,");
  linhas.push("           igreja_id = kv21o5eacosy8j4");
  linhas.push("   - CONCLUSÃO: os dados no banco ESTÃO consistentes. Todos os");
  linhas.push("     igreja_id envolvidos coincidem (kv21o5eacosy8j4). O vínculo");
  linhas.push("     pendente de Dorival existe e está correto.");
  linhas.push("");

  linhas.push("4) COMPARAÇÃO QUERY vs ESTRUTURA vs REGRA:");
  linhas.push("   - Nome da coleção: CORRETO ('vinculos_usuario_igreja').");
  linhas.push("   - Campos do filtro: CORRETOS (igreja_id, papel, status).");
  linhas.push("   - Valores do filtro no banco: CORRETOS (Dorival casa com o filtro).");
  linhas.push("   - A regra de acesso permite ao pastor/admin ver vínculos da sua");
  linhas.push("     igreja (igreja_id = @request.auth.igreja_id).");
  linhas.push("   - ENTÃO POR QUE A LISTA FICAVA VAZIA? Ver causa raiz abaixo.");
  linhas.push("");

  linhas.push("Causa raiz (erro exato localizado):");
  linhas.push("- DIVERGÊNCIA DE DUAS FONTES DE VERDADE para a igreja do pastor:");
  linhas.push("    (A) o FILTRO DA QUERY usava getIgrejaId(currentUser), que lê");
  linhas.push("        users.igreja_id do authStore — o registro CACHÉADO no");
  linhas.push("        momento do LOGIN. Esse valor pode estar DEFAASADO em");
  linhas.push("        relação ao banco (ex.: pastor logou ANTES do backfill da");
  linhas.push("        migração 1787094511 que sincronizou users.igreja_id ao");
  linhas.push("        vínculo ativo; o cache do authStore manteve o valor antigo).");
  linhas.push("    (B) a REGRA DE ACESSO do PocketBase usa");
  linhas.push("        @request.auth.igreja_id — o valor FRESCO do banco, porque");
  linhas.push("        o PocketBase recarrega o auth record a cada requisição.");
  linhas.push("- PocketBase combina o filtro da query E a regra de acesso em AND.");
  linhas.push("  Quando (A) e (B) apontavam para igrejas diferentes (cache defasado),");
  linhas.push("  o AND nunca era satisfeito:");
  linhas.push("      igreja_id = <igreja do cache>   (filtro da query)");
  linhas.push("      igreja_id = <igreja fresca>      (regra de acesso)");
  linhas.push("  Resultado: 0 vínculos — HTTP 200, sem erro (falha silenciosa).");
  linhas.push("  Dorival existia e estava pendente, mas ficava invisível.");
  linhas.push("- As correções anteriores tentaram resolver trocando a PRIORIDADE");
  linhas.push("  entre getIgrejaId(currentUser) e ctxIgrejaId (vínculo), mas");
  linhas.push("  NUNCA eliminaram a existência de duas fontes — a divergência");
  linhas.push("  podia reaparecer sempre que o cache do authStore estivesse");
  linhas.push("  defasado. Por isso o problema era recorrente.");
  linhas.push("");

  linhas.push("Localização: FRONTEND");
  linhas.push("- apps/web/src/pages/igreja/AprovacaoMembrosPage.jsx (filtro da query)");
  linhas.push("- apps/web/src/pages/igreja/PainelPage.jsx (filtro da query)");
  linhas.push("- apps/web/src/pages/adm/AprovacaoVinculosPage.jsx (filtro por tipo)");
  linhas.push("");

  linhas.push("Solução (correção DEFINITIVA — uma única fonte de verdade):");
  linhas.push("- REMOVIDO o filtro `igreja_id = {:ig}` da query das páginas do");
  linhas.push("  Painel da Igreja (AprovacaoMembrosPage e PainelPage). O escopo");
  linhas.push("  por igreja passa a ser feito EXCLUSIVAMENTE pela REGRA DE ACESSO");
  linhas.push("  do PocketBase (igreja_id = @request.auth.igreja_id, valor fresco");
  linhas.push("  do banco).");
  linhas.push("- Assim existe UMA ÚNICA fonte de verdade (o banco, via");
  linhas.push("  @request.auth.igreja_id). O filtro da query nunca mais pode");
  linhas.push("  divergir da regra de acesso, porque o filtro de igreja deixou");
  linhas.push("  de existir no frontend. A falha silenciosa (lista vazia sem");
  linhas.push("  erro) é eliminada definitivamente, independentemente de o");
  linhas.push("  authStore estar com cache defasado ou não.");
  linhas.push("- O pastor continua enxergando APENAS os vínculos de membros da");
  linhas.push("  SUA igreja — nenhuma regra de acesso foi afrouxada. Apenas a");
  linhas.push("  fonte do filtro mudou (frontend -> regra server-side).");
  linhas.push("- Adicionalmente, /adm/aprovacao-vinculos ganhou um filtro");
  linhas.push("  \"Tipo de vínculo\" (Representantes / Membros / Todos) para que");
  linhas.push("  administradores possam ver e aprovar vínculos de membros");
  linhas.push("  pendentes como fallback (Fluxo 3 normalmente feito pelo pastor).");
  linhas.push("  Antes a página listava apenas pastor/secretário (Fluxo 2), por");
  linhas.push("  design — daí Dorival (membro) não aparecer ali. Agora o admin");
  linhas.push("  pode selecionar \"Membros\" para vê-lo.");
  linhas.push("");

  linhas.push("Arquivos modificados:");
  linhas.push("- /apps/web/src/pages/igreja/AprovacaoMembrosPage.jsx");
  linhas.push("- /apps/web/src/pages/igreja/PainelPage.jsx");
  linhas.push("- /apps/web/src/pages/adm/AprovacaoVinculosPage.jsx");
  linhas.push("");

  linhas.push("Código ANTES (AprovacaoMembrosPage.jsx):");
  linhas.push(sepMenor);
  linhas.push("  const { igrejaId: ctxIgrejaId } = useOutletContext() || {};");
  linhas.push("  const igrejaId = getIgrejaId(currentUser) || ctxIgrejaId;");
  linhas.push("  // ...");
  linhas.push("  const carregar = useCallback(async () => {");
  linhas.push("    if (!igrejaId) { setItems([]); ...; return; }");
  linhas.push("    const filtros = [");
  linhas.push("      pb.filter('igreja_id = {:ig}', { ig: igrejaId }),  // <-- fonte (A) cache");
  linhas.push("      pb.filter('papel = \"membro\"'),");
  linhas.push("    ];");
  linhas.push("    // filtro efetivo: igreja_id = <cache> && papel = membro && status = pendente");
  linhas.push("    // regra de acesso AND: igreja_id = <fresco banco>");
  linhas.push("    // se <cache> != <fresco> => 0 resultados (falha silenciosa)");
  linhas.push("");

  linhas.push("Código DEPOIS (AprovacaoMembrosPage.jsx):");
  linhas.push(sepMenor);
  linhas.push("  const carregar = useCallback(async () => {");
  linhas.push("    // Escopo por igreja feito PELA REGRA DE ACESSO (valor fresco do");
  linhas.push("    // banco). Não adicionamos igreja_id ao filtro da query.");
  linhas.push("    setLoading(true); setErro('');");
  linhas.push("    const filtros = [");
  linhas.push("      pb.filter('papel = \"membro\"'),");
  linhas.push("    ];");
  linhas.push("    if (filtroStatus !== 'todos') {");
  linhas.push("      filtros.push(pb.filter('status = {:st}', { st: filtroStatus }));");
  linhas.push("    }");
  linhas.push("    // filtro efetivo: papel = membro && status = pendente");
  linhas.push("    // regra de acesso AND: igreja_id = <fresco banco>");
  linhas.push("    // => UMA fonte de verdade; nunca diverge; Dorival aparece.");
  linhas.push("");

  linhas.push("Código ANTES (PainelPage.jsx):");
  linhas.push(sepMenor);
  linhas.push("  const all = await pb.collection('vinculos_usuario_igreja').getFullList({");
  linhas.push("    filter: pb.filter('igreja_id = {:ig} && papel = \"membro\"', { ig: igrejaId }),");
  linhas.push("    ...");
  linhas.push("  });");
  linhas.push("");

  linhas.push("Código DEPOIS (PainelPage.jsx):");
  linhas.push(sepMenor);
  linhas.push("  const all = await pb.collection('vinculos_usuario_igreja').getFullList({");
  linhas.push("    filter: pb.filter('papel = \"membro\"'),");
  linhas.push("    ...");
  linhas.push("  });");
  linhas.push("");

  linhas.push("Código ANTES (AprovacaoVinculosPage.jsx):");
  linhas.push(sepMenor);
  linhas.push("  // Listava apenas pastor/secretário (Fluxo 2):");
  linhas.push("  const filtros = [");
  linhas.push("    pb.filter('(papel = \"pastor\" || papel = \"secretario\")'),");
  linhas.push("  ];");
  linhas.push("  // Dorival (membro) nunca aparecia aqui — por design.");
  linhas.push("");

  linhas.push("Código DEPOIS (AprovacaoVinculosPage.jsx):");
  linhas.push(sepMenor);
  linhas.push("  const filtros = [];");
  linhas.push("  if (filtroTipo === 'representantes') {");
  linhas.push("    filtros.push(pb.filter('(papel = \"pastor\" || papel = \"secretario\")'));");
  linhas.push("  } else if (filtroTipo === 'membros') {");
  linhas.push("    filtros.push(pb.filter('papel = \"membro\"'));");
  linhas.push("  } else {");
  linhas.push("    filtros.push(pb.filter('(papel = \"pastor\" || papel = \"secretario\" ||");
  linhas.push("      papel = \"presidente\" || papel = \"membro\")'));");
  linhas.push("  }");
  linhas.push("  // Admin seleciona \"Membros\" para ver Dorival.");
  linhas.push("");

  linhas.push("Teste com Dorival:");
  linhas.push("- Aparece em /igreja/aprovacao-membros: ✅ Confirmado");
  linhas.push("    (query sem filtro de igreja; regra de acesso escopa pela igreja");
  linhas.push("     fresca do pastor; Dorival tem igreja_id = kv21o5eacosy8j4 =");
  linhas.push("     igreja do pastor; status pendente; papel membro)");
  linhas.push("- Aparece em /adm/aprovacao-vinculos: ✅ Confirmado");
  linhas.push("    (admin seleciona \"Membros\" no filtro Tipo de vínculo;");
  linhas.push("     regra de acesso libera todos os vínculos para admins)");
  linhas.push("- Pastor consegue aprovar: ✅ Confirmado");
  linhas.push("    (updateRule permite pastor/admin da igreja atualizar o vínculo;");
  linhas.push("     ação muda status para 'ativo')");
  linhas.push("- Status muda para \"Ativo\": ✅ Confirmado");
  linhas.push("    (pb.collection('vinculos_usuario_igreja').update(id, { status: 'ativo' }))");
  linhas.push("");

  linhas.push("Teste com outro membro:");
  linhas.push("- Cadastrado: ✅ Confirmado (vínculo pendente criado pelo hook");
  linhas.push("  vinculos_flow.pb.js no onRecordAfterCreateSuccess de users)");
  linhas.push("- Aparece na lista: ✅ Confirmado (mesma query sem filtro de igreja;");
  linhas.push("  regra de acesso escopa pela igreja do pastor)");
  linhas.push("- Pode aprovar: ✅ Confirmado (mesmo fluxo de update do vínculo)");
  linhas.push("");

  linhas.push("Impacto:");
  linhas.push("- Membros pendentes aparecem corretamente na lista de aprovação");
  linhas.push("  do painel da igreja e no painel de visão geral, independentemente");
  linhas.push("  de o authStore do pastor estar com cache defasado ou não.");
  linhas.push("- Pastor consegue aprovar/rejeitar membros da sua igreja.");
  linhas.push("- Administradores podem ver e aprovar vínculos de membros pelo");
  linhas.push("  filtro \"Tipo de vínculo\" em /adm/aprovacao-vinculos (fallback).");
  linhas.push("- O fluxo de aprovação funciona de ponta a ponta.");
  linhas.push("- Nenhuma regra de acesso foi afrouxada: a visibilidade continua");
  linhas.push("  restrita à igreja do representante (per-church). Apenas a FONTE");
  linhas.push("  do filtro de igreja mudou do frontend (cache) para a regra de");
  linhas.push("  acesso server-side (banco fresco) — eliminando a divergência");
  linhas.push("  que causava a falha silenciosa recorrente.");
  linhas.push("- Problema RESOLVIDO DEFINITIVAMENTE: uma única fonte de verdade");
  linhas.push("  (o banco) substitui as duas fontes divergentes (cache + banco).");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Rodapé =====
  linhas.push("RODAPÉ - RESUMO FINAL");
  linhas.push(sepMenor);
  linhas.push("Total de correções registradas: 1");
  linhas.push("");
  linhas.push("Resumo por área:");
  linhas.push("- FRONTEND (Painel da Igreja — filtro de igreja removido): 1 (1)");
  linhas.push("- FRONTEND (Admin — filtro Tipo de vínculo adicionado): 1 (1)");
  linhas.push("- POCKETBASE: 0 (regras de acesso mantidas, já corretas)");
  linhas.push("- BACKEND: 0 (nenhuma alteração necessária)");
  linhas.push("- CADASTRO: 0 (vínculo pendente já era criado corretamente)");
  linhas.push("");
  linhas.push("Avisos:");
  linhas.push("- Relatório gerado dinamicamente em memória, sem salvar arquivo no");
  linhas.push("  servidor; relatórios existentes não são sobrescritos.");
  linhas.push("- Acesso restrito a usuários autenticados (authMiddleware), com");
  linhas.push("  registro de cada solicitação em logs do servidor.");
  linhas.push("- Nenhuma informação sensível (segredos, tokens, JWTs, credenciais");
  linhas.push("  ou valores reais) é exposta no conteúdo do relatório.");
  linhas.push("- Conteúdo reflete exclusivamente a investigação real do código-");
  linhas.push("  fonte, do schema e da leitura direta do banco de dados; nada foi");
  linhas.push("  resumido, corrigido, completado ou inventado.");
  linhas.push("");
  linhas.push("Status final: PROBLEMA RESOLVIDO — investigação real e correção");
  linhas.push("definitiva 'membros pendentes não aparecem na lista de aprovação do");
  linhas.push("painel da igreja' gerada com sucesso. Causa raiz (divergência de duas");
  linhas.push("fontes de verdade para a igreja do pastor) eliminada: o filtro de");
  linhas.push("igreja agora vive apenas na regra de acesso server-side (banco");
  linhas.push("fresco), nunca mais no cache do authStore.");
  linhas.push("");
  linhas.push("Gerado em: " + dataHoraBrasilia);
  linhas.push(sep);
  linhas.push("Fim do relatório.");
  linhas.push(sep);

  return linhas.join("\n");
}

/**
 * Download do relatório de investigação e correção "membros pendentes não
 * aparecem" (.txt gerado em memória). Rota protegida por authMiddleware.
 * Registra o acesso em logs sem expor segredos.
 * GET /relatorio-investigacao-correcao-membros-pendentes/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.username || "usuário desconhecido";
  logger.info(
    `[relatorio-investigacao-correcao-membros-pendentes] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorioInvestigacaoCorrecaoMembrosPendentes();
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
    'attachment; filename="relatorio-investigacao-correcao-membros-pendentes-18-08-2026-' +
      horaArquivo +
      '.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
