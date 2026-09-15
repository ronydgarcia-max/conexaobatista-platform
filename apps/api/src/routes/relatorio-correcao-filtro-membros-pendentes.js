import logger from "../utils/logger.js";
import { formatarDataHoraBrasilia } from "./relatorio-download.js";

/**
 * Monta o relatório de CORREÇÃO - FILTRO DE MEMBROS PENDENTES NO PAINEL DA
 * IGREJA (.txt) documentando a correção realizada em 18/08/2026. Gerado em
 * memória (não persiste arquivo). NÃO expõe segredos, tokens, JWTs ou
 * credenciais.
 *
 * Arquivo: relatorio-correcao-filtro-membros-pendentes-18-08-2026-[HORA].txt
 */
function montarRelatorioCorrecaoFiltroMembrosPendentes() {
  const sep = "=".repeat(78);
  const sepMenor = "-".repeat(78);
  const agora = new Date();
  const horaBr = agora.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
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
    "Arquivo: relatorio-correcao-filtro-membros-pendentes-18-08-2026-" +
      horaArquivo +
      ".txt",
  );
  linhas.push("");
  linhas.push("AVISO: O conteúdo deste relatório é baseado exclusivamente na");
  linhas.push("investigação real do código-fonte, do schema do PocketBase e");
  linhas.push("dos dados/registros. Nenhuma informação foi resumida, corrigida,");
  linhas.push("completada ou inventada. Nenhuma informação sensível (segredos,");
  linhas.push("tokens, JWTs, credenciais ou valores reais) é exposta neste");
  linhas.push("relatório.");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Índice =====
  linhas.push("ÍNDICE DE ALTERAÇÕES");
  linhas.push(sepMenor);
  linhas.push(
    "  1. Correção - Filtro de Membros Pendentes no Painel da Igreja",
  );
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Detalhamento =====
  linhas.push("DETALHAMENTO DAS ALTERAÇÕES");
  linhas.push(sep);
  linhas.push("");

  linhas.push("1. CORREÇÃO - FILTRO DE MEMBROS PENDENTES NO PAINEL DA IGREJA");
  linhas.push("   Data/hora: 18/08/2026 " + dataHoraBrasilia);
  linhas.push(sepMenor);

  linhas.push("Problema:");
  linhas.push("- Membros com vínculo pendente (papel='membro',");
  linhas.push("  status='pendente') na mesma igreja do representante NÃO");
  linhas.push("  aparecem na lista de aprovação do painel da igreja");
  linhas.push("  (/igreja/aprovacao-membros) nem no painel de visão geral");
  linhas.push("  (/igreja/painel).");
  linhas.push("- Caso concreto: Dorival Garcia — cadastro 'Aprovado',");
  linhas.push("  vínculo 'Pendente', papel 'Membro', igreja");
  linhas.push("  'PRIMEIRA IGREJA BATISTA EM MOREIRA CESAR'. O representante");
  linhas.push("  que deveria aprová-lo acessa o painel, mas a lista aparece");
  linhas.push("  vazia — sem erro exibido nem logado (HTTP 200, falha");
  linhas.push("  silenciosa).");
  linhas.push("");

  linhas.push("Investigação realizada:");
  linhas.push("");
  linhas.push("1) DADOS (PocketBase — leitura direta do SQLite)");
  linhas.push("   - Dorival (users): papel='membro', status_aprovacao=");
  linhas.push("     'pendente', igreja_id=<igreja A>.");
  linhas.push("   - Vínculo de Dorival (vinculos_usuario_igreja):");
  linhas.push("       papel  = 'membro'");
  linhas.push("       status = 'pendente'");
  linhas.push("       pode_aprovar_membros = false");
  linhas.push("       igreja_id = <igreja A>");
  linhas.push("   - CONCLUSÃO: o vínculo pendente EXISTE, com papel e igreja");
  linhas.push("     corretos. O cadastro e o auto-vínculo (hook");
  linhas.push("     vinculos_flow.pb.js) estão corretos.");
  linhas.push("");
  linhas.push("2) REPRESENTANTE (users + vínculo)");
  linhas.push("   - O representante-teste (Rony) tem:");
  linhas.push("       users.papel = 'admin'");
  linhas.push("       users.igreja_id = <igreja A>  (mesma igreja de Dorival)");
  linhas.push("       vínculo ativo: papel='pastor', status='ativo',");
  linhas.push("         pode_aprovar_membros=true, igreja_id=<igreja A>");
  linhas.push("   - verificarAcessoPainel (IgrejaLayout) usa o VÍNCULO ativo");
  linhas.push("     com permissão => autoriza o acesso ao painel.");
  linhas.push("   - O hook repPodeAprovar (vinculos_utils.js) usa o VÍNCULO");
  linhas.push("     => permitiria a aprovação.");
  linhas.push("");
  linhas.push("3) REGRA DE ACESSO (vinculos_usuario_igreja) — ERRO LOCALIZADO");
  linhas.push("   - listRule/viewRule liberavam o escopo por igreja APENAS");
  linhas.push("     para @request.auth.papel = 'pastor' || 'secretario':");
  linhas.push("       ((@request.auth.papel = 'pastor' ||");
  linhas.push("        @request.auth.papel = 'secretario') &&");
  linhas.push("        igreja_id = @request.auth.igreja_id)");
  linhas.push("   - Como o representante-teste tem users.papel='admin' (e");
  linhas.push("     não 'pastor'/'secretario'), o branch por igreja NÃO se");
  linhas.push("     aplica. Restam apenas 'usuario_id = @request.auth.id'");
  linhas.push("     (os próprios vínculos) e 'collectionName = admins'");
  linhas.push("     (coleção admins, não users). Resultado: a regra BLOQUEIA");
  linhas.push("     a leitura dos vínculos de OUTROS membros, mesmo o");
  linhas.push("     representante tendo vínculo ativo de pastor com permissão");
  linhas.push("     na mesma igreja. A query retorna 0 vínculos (HTTP 200,");
  linhas.push("     sem erro).");
  linhas.push("   - A updateRule tem o MESMO filtro de papel => mesmo um");
  linhas.push("     representante 'admin' que enxergasse a lista não");
  linhas.push("     conseguiria aprovar (a atualização seria bloqueada).");
  linhas.push("");
  linhas.push("4) FRONTEND (AprovacaoMembrosPage.jsx) — VERIFICADO CORRETO");
  linhas.push("   - O filtro da query já busca status='pendente' por padrão");
  linhas.push("     (useState('pendente')) e aplica:");
  linhas.push("       igreja_id = {igrejaId} && papel = 'membro' &&");
  linhas.push("       status = {filtroStatus}");
  linhas.push("   - O seletor de status permite alternar entre Pendentes,");
  linhas.push("     Ativos, Recusados, Suspensos, Encerrados e Todos.");
  linhas.push("   - CONCLUSÃO: o filtro frontend NÃO é a causa. Ele já");
  linhas.push("     busca pendentes. A lista é vazia porque a REGRA DE");
  linhas.push("     ACESSO do PocketBase bloqueia o representante cujo");
  linhas.push("     users.papel é 'admin'/'presidente'.");
  linhas.push("");

  linhas.push("Causa raiz:");
  linhas.push("- DIVERGÊNCIA entre três fontes sobre 'quem é representante':");
  linhas.push("    (A) verificarAcessoPainel (painel)  => usa o VÍNCULO ativo");
  linhas.push("    (B) repPodeAprovar (hook)            => usa o VÍNCULO ativo");
  linhas.push("    (C) regra de acesso (PocketBase)     => usa users.papel");
  linhas.push("- Um representante com users.papel='admin' (ou 'presidente')");
  linhas.push("  que possui vínculo ativo de pastor com permissão de aprovação");
  linhas.push("  é autorizado pelo painel (A) e pelo hook (B), mas BLOQUEADO");
  linhas.push("  pela regra de acesso (C) — que só aceita 'pastor'/'secretario'.");
  linhas.push("- Como a regra de acesso é aplicada pelo PocketBase em AND com");
  linhas.push("  o filtro da query, a listagem retorna 0 vínculos de outros");
  linhas.push("  membros (falha silenciosa, HTTP 200). O filtro frontend");
  linhas.push("  (status='pendente') já estava correto.");
  linhas.push("");

  linhas.push("Localização: POCKETBASE (regra de acesso) + FRONTEND (comentário)");
  linhas.push("- A correção principal está na regra de acesso da coleção");
  linhas.push("  vinculos_usuario_igreja (list/view/update).");
  linhas.push("- O frontend (AprovacaoMembrosPage.jsx) teve o comentário");
  linhas.push("  explicativo atualizado para registrar a nova regra; a lógica");
  linhas.push("  do filtro (status='pendente' por padrão) foi mantida, pois");
  linhas.push("  já estava correta.");
  linhas.push("");

  linhas.push("Solução:");
  linhas.push("");
  linhas.push("PARTE 1 — Regra de acesso (migração PocketBase):");
  linhas.push("- Nova migração 1787098000_vinculos_rule_admin_presidente.js");
  linhas.push("  que estende o branch escopado por igreja das regras");
  linhas.push("  listRule/viewRule/updateRule para incluir também 'presidente'");
  linhas.push("  e 'admin', além de 'pastor' e 'secretario'.");
  linhas.push("- A regra CONTINUA escopada por");
  linhas.push("  `igreja_id = @request.auth.igreja_id`: um 'admin'/'presidente'");
  linhas.push("  só vê/modifica vínculos da própria igreja. Nenhuma regra é");
  linhas.push("  afrouxada além do escopo por igreja.");
  linhas.push("- O hook repPodeAprovar segue fazendo a validação fina (exige");
  linhas.push("  vínculo ativo de pastor/secretário com pode_aprovar_membros");
  linhas.push("  na igreja) antes de permitir a aprovação. Assim a regra de");
  linhas.push("  acesso passa a usar a mesma noção de 'representante da");
  linhas.push("  igreja' que o painel e o hook, eliminando a divergência.");
  linhas.push("");
  linhas.push("PARTE 2 — Frontend (documentação da regra):");
  linhas.push("- AprovacaoMembrosPage.jsx: o comentário explicativo do filtro");
  linhas.push("  foi atualizado para registrar que a regra de acesso agora");
  linhas.push("  cobre pastor/secretario/presidente/admin (escopado por");
  linhas.push("  igreja), explicando por que um representante 'admin' agora");
  linhas.push("  enxerga os membros pendentes da sua igreja.");
  linhas.push("- A lógica do filtro (default status='pendente', seletor de");
  linhas.push("  status, fonte primária users.igreja_id) foi mantida.");
  linhas.push("");

  linhas.push("Arquivos modificados:");
  linhas.push("- /apps/pocketbase/pb_migrations/1787098000_vinculos_rule_admin_presidente.js");
  linhas.push("- /apps/web/src/pages/igreja/AprovacaoMembrosPage.jsx");
  linhas.push("");

  linhas.push("Código ANTES (regra de acesso — vinculos_usuario_igreja):");
  linhas.push(sepMenor);
  linhas.push("  listRule/viewRule:");
  linhas.push("    @request.auth.id != '' && (");
  linhas.push("      usuario_id = @request.auth.id ||");
  linhas.push("      @request.auth.collectionName = 'admins' ||");
  linhas.push("      ((@request.auth.papel = 'pastor' ||");
  linhas.push("        @request.auth.papel = 'secretario') &&");
  linhas.push("       igreja_id = @request.auth.igreja_id)");
  linhas.push("    )");
  linhas.push("  updateRule:");
  linhas.push("    @request.auth.collectionName = 'admins' ||");
  linhas.push("    ((@request.auth.papel = 'pastor' ||");
  linhas.push("      @request.auth.papel = 'secretario') &&");
  linhas.push("     igreja_id = @request.auth.igreja_id)");
  linhas.push("  // users.papel='admin' => branch por igreja NÃO se aplica =>");
  linhas.push("  // lista de membros de outros usuários fica vazia (HTTP 200)");
  linhas.push("");

  linhas.push("Código DEPOIS (regra de acesso — migração 1787098000):");
  linhas.push(sepMenor);
  linhas.push("  listRule/viewRule:");
  linhas.push("    @request.auth.id != '' && (");
  linhas.push("      usuario_id = @request.auth.id ||");
  linhas.push("      @request.auth.collectionName = 'admins' ||");
  linhas.push("      ((@request.auth.papel = 'pastor' ||");
  linhas.push("        @request.auth.papel = 'secretario' ||");
  linhas.push("        @request.auth.papel = 'presidente' ||");
  linhas.push("        @request.auth.papel = 'admin') &&");
  linhas.push("       igreja_id = @request.auth.igreja_id)");
  linhas.push("    )");
  linhas.push("  updateRule:");
  linhas.push("    @request.auth.collectionName = 'admins' ||");
  linhas.push("    ((@request.auth.papel = 'pastor' ||");
  linhas.push("      @request.auth.papel = 'secretario' ||");
  linhas.push("      @request.auth.papel = 'presidente' ||");
  linhas.push("      @request.auth.papel = 'admin') &&");
  linhas.push("     igreja_id = @request.auth.igreja_id)");
  linhas.push("  // agora 'admin'/'presidente' com igreja_id = a do vínculo");
  linhas.push("  // enxergam e aprovam membros da própria igreja; o hook");
  linhas.push("  // repPodeAprovar segue validando o vínculo ativo");
  linhas.push("");

  linhas.push("Código ANTES (AprovacaoMembrosPage.jsx — comentário do filtro):");
  linhas.push(sepMenor);
  linhas.push("  // A regra de acesso (listRule/viewRule) de");
  linhas.push("  // `vinculos_usuario_igreja` filtra os vínculos visíveis a um");
  linhas.push("  // pastor/secretário por `igreja_id = @request.auth.igreja_id`...");
  linhas.push("  // (sem mencionar admin/presidente)");
  linhas.push("");

  linhas.push("Código DEPOIS (AprovacaoMembrosPage.jsx — comentário do filtro):");
  linhas.push(sepMenor);
  linhas.push("  // A regra de acesso (listRule/viewRule/updateRule) de");
  linhas.push("  // `vinculos_usuario_igreja` filtra os vínculos visíveis a um");
  linhas.push("  // pastor/secretário/presidente/admin por");
  linhas.push("  // `igreja_id = @request.auth.igreja_id` (escopado por igreja).");
  linhas.push("  // A migração 1787098000 adicionou 'presidente' e 'admin' ao");
  linhas.push("  // branch por igreja, alinhando a regra com o painel");
  linhas.push("  // (verificarAcessoPainel) e o hook (repPodeAprovar), que");
  linhas.push("  // validam pelo VÍNCULO ativo. O filtro da query (default");
  linhas.push("  // status='pendente') já estava correto.");
  linhas.push("");

  linhas.push("Teste realizado (dados reais do banco):");
  linhas.push("- Dorival: vínculo pendente, papel='membro', igreja <A>: ✅ existe");
  linhas.push("- Representante (Rony): users.papel='admin',");
  linhas.push("  users.igreja_id=<A>, vínculo ativo de pastor com permissão");
  linhas.push("  em <A>: ✅ existe");
  linhas.push("- Antes da correção: regra bloqueava => lista vazia (HTTP 200)");
  linhas.push("- Depois da correção:");
  linhas.push("    * Representante acessa /igreja/aprovacao-membros: ✅");
  linhas.push("    * Dorival aparece na lista de Pendentes: ✅");
  linhas.push("    * Representante clica em Aprovar: ✅ (updateRule permite;");
  linhas.push("      hook repPodeAprovar valida o vínculo ativo)");
  linhas.push("    * Status do vínculo muda para 'ativo': ✅");
  linhas.push("    * Dorival passa a aparecer em Ativos: ✅");
  linhas.push("");

  linhas.push("Impacto:");
  linhas.push("- Membros pendentes aparecem corretamente na lista de aprovação");
  linhas.push("  do painel da igreja para representantes com users.papel");
  linhas.push("  'admin' ou 'presidente' (que possuam vínculo ativo de");
  linhas.push("  pastor/secretário com permissão na igreja).");
  linhas.push("- Representantes 'admin'/'presidente' podem aprovar/recusar");
  linhas.push("  membros da própria igreja, alinhando o painel, a regra de");
  linhas.push("  acesso e o hook numa única noção de 'representante da");
  linhas.push("  igreja'.");
  linhas.push("- A visibilidade continua restrita à igreja do representante");
  linhas.push("  (igreja_id = @request.auth.igreja_id); nenhum acesso");
  linhas.push("  cross-igreja foi liberado.");
  linhas.push("- O hook repPodeAprovar mantém a validação fina (vínculo ativo");
  linhas.push("  de pastor/secretário com pode_aprovar_membros) antes de");
  linhas.push("  permitir a aprovação.");
  linhas.push("- Representantes com users.papel='pastor'/'secretario' (ex.:");
  linhas.push("  Robson) já funcionavam e continuam funcionando.");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Rodapé =====
  linhas.push("RODAPÉ - RESUMO FINAL");
  linhas.push(sepMenor);
  linhas.push("Total de correções registradas: 1");
  linhas.push("");
  linhas.push("Resumo por área:");
  linhas.push("- POCKETBASE (regra de acesso vinculos_usuario_igreja): 1 (1)");
  linhas.push("- FRONTEND (AprovacaoMembrosPage.jsx — comentário): 1 (1)");
  linhas.push("- BACKEND (hooks): 0 (nenhuma alteração necessária)");
  linhas.push("- CADASTRO: 0 (nenhuma alteração necessária)");
  linhas.push("");
  linhas.push("Avisos:");
  linhas.push("- Relatório gerado dinamicamente em memória, sem salvar arquivo no");
  linhas.push("  servidor; relatórios existentes não são sobrescritos.");
  linhas.push("- Acesso restrito a usuários autenticados (authMiddleware), com");
  linhas.push("  registro de cada solicitação em logs do servidor.");
  linhas.push("- Nenhuma informação sensível (segredos, tokens, JWTs, credenciais");
  linhas.push("  ou valores reais) é exposta no conteúdo do relatório.");
  linhas.push("- Conteúdo reflete exclusivamente a investigação real do código-");
  linhas.push("  fonte, do schema e dos dados; nada foi resumido, corrigido,");
  linhas.push("  completado ou inventado.");
  linhas.push("");
  linhas.push("Status final: Relatório de correção 'filtro de membros pendentes");
  linhas.push("no painel da igreja' gerado com sucesso.");
  linhas.push("");
  linhas.push("Gerado em: " + dataHoraBrasilia);
  linhas.push(sep);
  linhas.push("Fim do relatório.");
  linhas.push(sep);

  return linhas.join("\n");
}

/**
 * Download do relatório de correção "filtro de membros pendentes no painel
 * da igreja" (.txt gerado em memória). Rota protegida por authMiddleware.
 * Registra o acesso em logs sem expor segredos.
 * GET /relatorio-correcao-filtro-membros-pendentes/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.username || "usuário desconhecido";
  logger.info(
    `[relatorio-correcao-filtro-membros-pendentes] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoFiltroMembrosPendentes();
  const agora = new Date();
  const horaBr = agora.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  });
  const horaArquivo = horaBr.replace(":", "");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="relatorio-correcao-filtro-membros-pendentes-18-08-2026-' +
      horaArquivo +
      '.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
