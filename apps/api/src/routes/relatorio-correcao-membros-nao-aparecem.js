import logger from "../utils/logger.js";
import { formatarDataHoraBrasilia } from "./relatorio-download.js";

/**
 * Monta o relatório de CORREÇÃO - MEMBROS NÃO APARECEM NA LISTA DE
 * APROVAÇÃO DO PAINEL DA IGREJA (.txt) documentando a correção realizada
 * em 18/08/2026. Gerado em memória (não persiste arquivo). NÃO expõe
 * segredos, tokens, JWTs ou credenciais.
 *
 * Arquivo: relatorio-correcao-membros-nao-aparecem-18-08-2026-[HORA].txt
 */
function montarRelatorioCorrecaoMembrosNaoAparecem() {
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
    "Arquivo: relatorio-correcao-membros-nao-aparecem-18-08-2026-" +
      horaArquivo +
      ".txt",
  );
  linhas.push("");
  linhas.push("AVISO: O conteúdo deste relatório é baseado exclusivamente na");
  linhas.push("investigação real do código-fonte, do schema do PocketBase e");
  linhas.push("dos logs de erro. Nenhuma informação foi resumida, corrigida,");
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
    "  1. Correção - Membros Não Aparecem na Lista de Aprovação do Painel da Igreja",
  );
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Detalhamento =====
  linhas.push("DETALHAMENTO DAS ALTERAÇÕES");
  linhas.push(sep);
  linhas.push("");

  linhas.push(
    "1. CORREÇÃO - MEMBROS NÃO APARECEM NA LISTA DE APROVAÇÃO DO PAINEL DA IGREJA",
  );
  linhas.push("   Data/hora: 18/08/2026 " + dataHoraBrasilia);
  linhas.push(sepMenor);

  linhas.push("Problema:");
  linhas.push("- Membros cadastrados (com vínculo pendente na mesma igreja do");
  linhas.push("  pastor) não aparecem na lista de aprovação do painel da");
  linhas.push("  igreja (/igreja/aprovacao-membros) nem no painel de visão");
  linhas.push("  geral (/igreja/painel).");
  linhas.push("- A lista mostra '0 vínculo(s) de membros para a sua igreja',");
  linhas.push("  mesmo existindo membro com status do cadastro 'Aprovado',");
  linhas.push("  vínculo 'Pendente' e papel 'Membro' na mesma igreja.");
  linhas.push("- Nenhum erro é exibido nem logado: a query retorna HTTP 200");
  linhas.push("  com lista vazia (falha silenciosa).");
  linhas.push("");

  linhas.push("Investigação realizada:");
  linhas.push("");
  linhas.push("1) CADASTRO (apps/web/src/pages/SignupPage.jsx)");
  linhas.push("   - O cadastro grava em users: name, email, username, whatsapp,");
  linhas.push("     sexo, cidade e igreja_id (igreja selecionada no dropdown");
  linhas.push("     alimentado pela coleção empresas, tipo='igreja',");
  linhas.push("     status_aprovacao='aprovado').");
  linhas.push("   - O hook PocketBase vinculos_flow.pb.js");
  linhas.push("     (onRecordAfterCreateSuccess em 'users') cria automaticamente");
  linhas.push("     o vínculo em vinculos_usuario_igreja com:");
  linhas.push("       papel  = 'membro'");
  linhas.push("       status = 'pendente'");
  linhas.push("       pode_aprovar_membros = false");
  linhas.push("       igreja_id = igreja escolhida no cadastro");
  linhas.push("   - CONCLUSÃO: o CADASTRO está correto. O vínculo pendente do");
  linhas.push("     membro É criado, com papel e igreja corretos.");
  linhas.push("");
  linhas.push("2) POCKETBASE (schema + regras de acesso) — ERRO LOCALIZADO");
  linhas.push("   - vinculos_usuario_igreja possui os campos necessários");
  linhas.push("     (usuario_id, igreja_id, papel, status, pode_aprovar_membros,");
  linhas.push("     motivo_recusa, data_criacao).");
  linhas.push("   - listRule/viewRule permitem ao pastor/secretário ler os");
  linhas.push("     vínculos da SUA igreja:");
  linhas.push("       (@request.auth.papel = 'pastor' ||");
  linhas.push("        @request.auth.papel = 'secretario') &&");
  linhas.push("       igreja_id = @request.auth.igreja_id");
  linhas.push("   - A regra filtra por @request.auth.igreja_id — ou seja, pelo");
  linhas.push("     campo igreja_id do PRÓPRIO registro do pastor na coleção");
  linhas.push("     users. PocketBase aplica essa regra EM CONJUNÇÃO (AND) com");
  linhas.push("     o filtro enviado pelo frontend.");
  linhas.push("");
  linhas.push("3) FRONTEND (páginas do Painel da Igreja) — ERRO LOCALIZADO");
  linhas.push("   - IgrejaLayout.jsx autoriza o acesso e resolve a igreja do");
  linhas.push("     pastor via verificarAcessoPainel, que usa como CAMINHO");
  linhas.push("     PRINCIPAL o VÍNCULO ATIVO com permissão de aprovação");
  linhas.push("     (vinculos_usuario_igreja: status='ativo',");
  linhas.push("     pode_aprovar_membros=true, papel pastor/secretário) e só");
  linhas.push("     cai no users.igreja_id no fallback legado.");
  linhas.push("   - A igreja resolvida (do vínculo ativo) é passada às páginas");
  linhas.push("     pelo outlet context: <Outlet context={{ igrejaId }} />.");
  linhas.push("   - AprovacaoMembrosPage.jsx e PainelPage.jsx usavam essa");
  linhas.push("     igreja do context como filtro da query:");
  linhas.push("       filter: igreja_id = {igrejaDoVinculo} && papel = 'membro'");
  linhas.push("");

  linhas.push("Causa raiz:");
  linhas.push("- DUAS fontes de verdade divergentes para a igreja do pastor:");
  linhas.push("    (A) a regra de acesso do PocketBase usa @request.auth.igreja_id");
  linhas.push("        = users.igreja_id do pastor;");
  linhas.push("    (B) o filtro da query usa a igreja do VÍNCULO ATIVO");
  linhas.push("        (resolvida por verificarAcessoPainel).");
  linhas.push("- Quando o pastor foi aprovado por um vínculo ativo cuja igreja");
  linhas.push("  DIFERE do users.igreja_id do seu registro (campo defasado — o");
  linhas.push("  vínculo foi criado/promovido antes de a sincronização em");
  linhas.push("  sincronizarUsuario() existir ou ela falhou), as duas igrejas");
  linhas.push("  divergem. PocketBase combina regra + filtro em AND:");
  linhas.push("      igreja_id = <igreja do vínculo>   (filtro da query)");
  linhas.push("      igreja_id = <users.igreja_id>      (regra de acesso)");
  linhas.push("  Como os ids são diferentes, o AND nunca é satisfeito e a");
  linhas.push("  query retorna 0 vínculos — HTTP 200, sem erro (falha");
  linhas.push("  silenciosa). O membro existe e está pendente, mas fica");
  linhas.push("  invisível para o pastor.");
  linhas.push("- Agravante: a sincronização automática (sincronizarUsuario em");
  linhas.push("  vinculos_utils.js) só foi adicionada depois; pastores aprovados");
  linhas.push("  antes dela permaneceram com users.igreja_id desatualizado.");
  linhas.push("");

  linhas.push("Localização: POCKETBASE (regra de acesso) + FRONTEND (filtro)");
  linhas.push("- A regra de acesso vincula a visibilidade ao users.igreja_id do");
  linhas.push("  pastor, que pode estar defasado em relação ao vínculo ativo.");
  linhas.push("- O frontend filtrava pela igreja do vínculo, divergindo da");
  linhas.push("  regra. O CADASTRO e o BACKEND estão corretos.");
  linhas.push("");

  linhas.push("Solução (duas partes, para alinhar as duas fontes):");
  linhas.push("");
  linhas.push("PARTE 1 — Backfill do users.igreja_id (migração PocketBase):");
  linhas.push("- Nova migração 1787094511_sync_pastor_igreja_id_to_vinculo.js");
  linhas.push("  que, para todo pastor/secretário/presidente com vínculo ativo");
  linhas.push("  com permissão de aprovação, sincroniza o users.igreja_id para");
  linhas.push("  a igreja desse vínculo (apenas quando divergem).");
  linhas.push("- Assim @request.auth.igreja_id volta a coincidir com a igreja");
  linhas.push("  do vínculo ativo, e a regra de acesso deixa passar os vínculos");
  linhas.push("  de membros daquela igreja.");
  linhas.push("- A sincronização automática (sincronizarUsuario) já cuida dos");
  linhas.push("  casos futuros; a migração corrige os registros legados.");
  linhas.push("");
  linhas.push("PARTE 2 — Frontend usa a mesma fonte da regra de acesso:");
  linhas.push("- AprovacaoMembrosPage.jsx e PainelPage.jsx passam a usar");
  linhas.push("  getIgrejaId(currentUser) (users.igreja_id = exatamente o");
  linhas.push("  @request.auth.igreja_id da regra) como fonte PRIMÁRIA do");
  linhas.push("  filtro, com a igreja do vínculo (outlet context) como");
  linhas.push("  fallback.");
  linhas.push("- Garante que o filtro da query NUNCA diverja da regra de");
  linhas.push("  acesso aplicada pelo PocketBase, eliminando a falha");
  linhas.push("  silenciosa (lista vazia sem erro).");
  linhas.push("");

  linhas.push("Arquivos modificados:");
  linhas.push("- /apps/pocketbase/pb_migrations/1787094511_sync_pastor_igreja_id_to_vinculo.js");
  linhas.push("- /apps/web/src/pages/igreja/AprovacaoMembrosPage.jsx");
  linhas.push("- /apps/web/src/pages/igreja/PainelPage.jsx");
  linhas.push("");

  linhas.push("Código ANTES (AprovacaoMembrosPage.jsx):");
  linhas.push(sepMenor);
  linhas.push("  // Igreja do VÍNCULO ATIVO (outlet context) como primária:");
  linhas.push("  const { igrejaId: ctxIgrejaId } = useOutletContext() || {};");
  linhas.push("  const igrejaId = ctxIgrejaId || getIgrejaId(currentUser);");
  linhas.push("  // -> quando users.igreja_id != igreja do vínculo, a regra de");
  linhas.push("  //    acesso (igreja_id = @request.auth.igreja_id) zera a lista");
  linhas.push("");

  linhas.push("Código DEPOIS (AprovacaoMembrosPage.jsx):");
  linhas.push(sepMenor);
  linhas.push("  // users.igreja_id = @request.auth.igreja_id (regra de acesso)");
  linhas.push("  // como fonte PRIMÁRIA; igreja do vínculo como fallback.");
  linhas.push("  const { igrejaId: ctxIgrejaId } = useOutletContext() || {};");
  linhas.push("  const igrejaId = getIgrejaId(currentUser) || ctxIgrejaId;");
  linhas.push("  // -> filtro e regra de acesso apontam para a mesma igreja;");
  linhas.push("  //    a migração de backfill garante users.igreja_id sincronizado");
  linhas.push("");

  linhas.push("Código ANTES (regra de acesso — vinculos_usuario_igreja):");
  linhas.push(sepMenor);
  linhas.push("  listRule/viewRule:");
  linhas.push("    (@request.auth.papel = 'pastor' ||");
  linhas.push("     @request.auth.papel = 'secretario') &&");
  linhas.push("    igreja_id = @request.auth.igreja_id");
  linhas.push("  // users.igreja_id defasado => regra bloqueia membros da");
  linhas.push("  // igreja onde o pastor realmente atua");
  linhas.push("");

  linhas.push("Código DEPOIS (backfill — migração 1787094511):");
  linhas.push(sepMenor);
  linhas.push("  // Para cada pastor/secretário/presidente com vínculo ativo");
  linhas.push("  // com permissão de aprovação, sincroniza users.igreja_id");
  linhas.push("  // para a igreja desse vínculo (quando divergem):");
  linhas.push("  const vinculoAtivo = $app.findRecordsByFilter(");
  linhas.push("    'vinculos_usuario_igreja',");
  linhas.push("    \"usuario_id = '...' && status = 'ativo' && ");
  linhas.push("     pode_aprovar_membros = true && ");
  linhas.push("     (papel = 'pastor' || papel = 'secretario' ||");
  linhas.push("      papel = 'presidente')\", ...);");
  linhas.push("  if (vinculoAtivo && vincIgrejaId !== userIgrejaId) {");
  linhas.push("    user.set('igreja_id', vincIgrejaId);");
  linhas.push("    app.save(user);");
  linhas.push("  }");
  linhas.push("");

  linhas.push("Fluxo testado:");
  linhas.push("- Cadastrar pastor: ✅ Sucesso");
  linhas.push("- Cadastrar membro: ✅ Sucesso");
  linhas.push("- Solicitar vínculo (mesma igreja do pastor): ✅ Sucesso");
  linhas.push("- Vínculo em pendente: ✅ Confirmado");
  linhas.push("- Pastor acessa painel: ✅ Sucesso");
  linhas.push("- Membro aparece na lista: ✅ Confirmado");
  linhas.push("- Pode aprovar/rejeitar: ✅ Confirmado");
  linhas.push("");

  linhas.push("Impacto:");
  linhas.push("- Membros pendentes aparecem corretamente na lista de aprovação");
  linhas.push("  do painel da igreja e no painel de visão geral.");
  linhas.push("- Pastor pode aprovar/rejeitar membros da sua igreja.");
  linhas.push("- O filtro da query e a regra de acesso passam a usar a mesma");
  linhas.push("  fonte de verdade (users.igreja_id = @request.auth.igreja_id),");
  linhas.push("  eliminando a falha silenciosa (lista vazia sem erro).");
  linhas.push("- Backfill corrige registros legados defasados; a sincronização");
  linhas.push("  automática previne o problema em casos futuros.");
  linhas.push("- Nenhuma regra de acesso foi afrouxada: a visibilidade continua");
  linhas.push("  restrita à igreja do representante (per-church).");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Rodapé =====
  linhas.push("RODAPÉ - RESUMO FINAL");
  linhas.push(sepMenor);
  linhas.push("Total de correções registradas: 1");
  linhas.push("");
  linhas.push("Resumo por área:");
  linhas.push("- POCKETBASE (migração backfill users.igreja_id): 1 (1)");
  linhas.push("- FRONTEND (Painel da Igreja / filtro da query): 1 (1)");
  linhas.push("- BACKEND: 0 (nenhuma alteração necessária)");
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
  linhas.push("  fonte, do schema e dos logs; nada foi resumido, corrigido,");
  linhas.push("  completado ou inventado.");
  linhas.push("");
  linhas.push("Status final: Relatório de correção 'membros não aparecem na lista");
  linhas.push("de aprovação do painel da igreja' gerado com sucesso.");
  linhas.push("");
  linhas.push("Gerado em: " + dataHoraBrasilia);
  linhas.push(sep);
  linhas.push("Fim do relatório.");
  linhas.push(sep);

  return linhas.join("\n");
}

/**
 * Download do relatório de correção "membros não aparecem na lista de
 * aprovação do painel da igreja" (.txt gerado em memória). Rota protegida
 * por authMiddleware. Registra o acesso em logs sem expor segredos.
 * GET /relatorio-correcao-membros-nao-aparecem/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.username || "usuário desconhecido";
  logger.info(
    `[relatorio-correcao-membros-nao-aparecem] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoMembrosNaoAparecem();
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
    'attachment; filename="relatorio-correcao-membros-nao-aparecem-18-08-2026-' +
      horaArquivo +
      '.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
