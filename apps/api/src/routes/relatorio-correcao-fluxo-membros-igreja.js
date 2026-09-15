import logger from "../utils/logger.js";
import { formatarDataHoraBrasilia } from "./relatorio-download.js";

/**
 * Monta o relatório de CORREÇÃO - FLUXO DE APROVAÇÃO DE MEMBROS DA IGREJA
 * (.txt) documentando a correção realizada em 18/08/2026. Gerado em memória
 * (não persiste arquivo). NÃO expõe segredos, tokens, JWTs ou credenciais.
 *
 * Arquivo: relatorio-correcao-fluxo-membros-igreja-18-08-2026-[HORA].txt
 */
function montarRelatorioCorrecaoFluxoMembrosIgreja() {
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
    "Arquivo: relatorio-correcao-fluxo-membros-igreja-18-08-2026-" +
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
  linhas.push("  1. Correção - Fluxo de Aprovação de Membros da Igreja");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Detalhamento =====
  linhas.push("DETALHAMENTO DAS ALTERAÇÕES");
  linhas.push(sep);
  linhas.push("");

  linhas.push("1. CORREÇÃO - FLUXO DE APROVAÇÃO DE MEMBROS DA IGREJA");
  linhas.push("   Data/hora: 18/08/2026 " + dataHoraBrasilia);
  linhas.push(sepMenor);

  linhas.push("Problema:");
  linhas.push("- O pastor acessa /igreja/aprovacao-membros e a lista aparece");
  linhas.push('  vazia ("Nenhuma solicitação encontrada com esses filtros"),');
  linhas.push("  mesmo existindo membro cadastrado e pendente na mesma igreja.");
  linhas.push("- O painel de visão geral (/igreja/painel) podia mostrar");
  linhas.push("  contadores, mas a página de aprovação não listava ninguém.");
  linhas.push("");

  linhas.push("Investigação realizada:");
  linhas.push("");
  linhas.push("1) CADASTRO (apps/web/src/pages/SignupPage.jsx)");
  linhas.push("   - O cadastro grava em users: name, email, username, whatsapp,");
  linhas.push("     sexo, cidade e igreja_id (igreja selecionada).");
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
  linhas.push("2) POCKETBASE (schema + regras de acesso)");
  linhas.push("   - vinculos_usuario_igreja possui os campos necessários:");
  linhas.push("     usuario_id, igreja_id, papel, status,");
  linhas.push("     pode_aprovar_membros, motivo_recusa, data_criacao.");
  linhas.push("   - listRule/viewRule permitem ao pastor/secretário ler os");
  linhas.push("     vínculos da SUA igreja:");
  linhas.push("       (@request.auth.papel = 'pastor' ||");
  linhas.push("        @request.auth.papel = 'secretario') &&");
  linhas.push("       igreja_id = @request.auth.igreja_id");
  linhas.push("   - CONCLUSÃO: o POCKETBASE está correto. As regras liberam a");
  linhas.push("     leitura para o representante da igreja.");
  linhas.push("");
  linhas.push("3) BACKEND (apps/api)");
  linhas.push("   - Não existe rota Express para listar membros pendentes.");
  linhas.push("   - A leitura é feita direto do PocketBase pelo frontend");
  linhas.push("     (padrão do projeto). CONCLUSÃO: não há erro no BACKEND.");
  linhas.push("");
  linhas.push("4) FRONTEND (páginas do Painel da Igreja) — ERRO LOCALIZADO");
  linhas.push("   - IgrejaLayout.jsx autoriza o acesso resolvendo o VÍNCULO");
  linhas.push("     ATIVO do representante (verificarAcessoPainel) e expõe a");
  linhas.push("     igreja desse vínculo pelo outlet context:");
  linhas.push("       <Outlet context={{ igrejaId: igrejaIdVinculo }} />");
  linhas.push("   - PainelPage.jsx consome corretamente esse context:");
  linhas.push("       const { igrejaId } = useOutletContext();");
  linhas.push("   - AprovacaoMembrosPage.jsx NÃO usava o context. Ela derivava");
  linhas.push("     a igreja do campo igreja_id do REGISTRO DO USUÁRIO:");
  linhas.push("       const igrejaId = getIgrejaId(currentUser);");
  linhas.push("");

  linhas.push("Causa raiz:");
  linhas.push("- Duas fontes de verdade divergentes para a igreja do pastor.");
  linhas.push("- A autorização do painel é baseada no VÍNCULO ATIVO");
  linhas.push("  (vinculos_usuario_igreja), mas a consulta de listagem da");
  linhas.push("  página de aprovação usava users.igreja_id.");
  linhas.push("- users.igreja_id pode estar VAZIO ou DIFERENTE da igreja do");
  linhas.push("  vínculo ativo, porque:");
  linhas.push("    a) o vínculo de pastor é criado/editado pela administração");
  linhas.push("       (Fluxo 2 / seção Vínculos com Igrejas), podendo apontar");
  linhas.push("       para uma igreja diferente da escolhida no cadastro;");
  linhas.push("    b) o campo users.igreja_id só é sincronizado por");
  linhas.push("       sincronizarUsuario() quando o vínculo passa a 'ativo';");
  linhas.push("       o objeto currentUser em memória (pb.authStore.model) pode");
  linhas.push("       permanecer com o valor antigo/vazio até um novo login.");
  linhas.push("- Resultado: o filtro era montado com um igrejaId vazio ou de");
  linhas.push("  outra igreja, e a query não retornava nenhum vínculo pendente.");
  linhas.push("- Agravante: com igrejaId vazio, o filtro ficava");
  linhas.push("  \"igreja_id = ''\" — nunca correspondendo a nenhum registro.");
  linhas.push("");

  linhas.push("Localização: FRONTEND");
  linhas.push("(consulta/filtro da página de aprovação de membros).");
  linhas.push("O CADASTRO, o POCKETBASE e o BACKEND estão corretos.");
  linhas.push("");

  linhas.push("Solução:");
  linhas.push("- AprovacaoMembrosPage.jsx passa a obter a igreja do MESMO");
  linhas.push("  outlet context usado pelo IgrejaLayout/PainelPage, isto é, a");
  linhas.push("  igreja do vínculo ATIVO que autorizou o acesso ao painel.");
  linhas.push("- O campo users.igreja_id é mantido apenas como fallback.");
  linhas.push("- Adicionada guarda: se nenhuma igreja for resolvida, a página");
  linhas.push("  não executa a consulta (evita listar vínculos de outras");
  linhas.push("  igrejas por filtro incompleto) e mostra a lista vazia.");
  linhas.push("- Com isso, autorização e listagem usam uma ÚNICA fonte de");
  linhas.push("  verdade: o vínculo ativo do representante.");
  linhas.push("");

  linhas.push("Arquivo modificado:");
  linhas.push("- /apps/web/src/pages/igreja/AprovacaoMembrosPage.jsx");
  linhas.push("");

  linhas.push("Código ANTES:");
  linhas.push(sepMenor);
  linhas.push("  import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';");
  linhas.push("  import { getIgrejaId } from '@/components/igreja/IgrejaLayout.jsx';");
  linhas.push("");
  linhas.push("  const { currentUser } = useSubscriptionAuth();");
  linhas.push("  const repId = currentUser?.id || '';");
  linhas.push("  // Igreja derivada do REGISTRO DO USUÁRIO (pode estar vazia");
  linhas.push("  // ou divergir da igreja do vínculo ativo):");
  linhas.push("  const igrejaId = getIgrejaId(currentUser);");
  linhas.push("");
  linhas.push("  const carregar = useCallback(async () => {");
  linhas.push("    setLoading(true);");
  linhas.push("    setErro('');");
  linhas.push("    try {");
  linhas.push("      const filtros = [");
  linhas.push("        pb.filter('igreja_id = {:ig}', { ig: igrejaId }),");
  linhas.push("        pb.filter('papel = \"membro\"'),");
  linhas.push("      ];");
  linhas.push("      // ... getList(...)  -> retornava lista vazia");
  linhas.push("");

  linhas.push("Código DEPOIS:");
  linhas.push(sepMenor);
  linhas.push("  import { useOutletContext } from 'react-router-dom';");
  linhas.push("  import { useSubscriptionAuth } from '@/contexts/SubscriptionAuthContext.jsx';");
  linhas.push("  import { getIgrejaId } from '@/components/igreja/IgrejaLayout.jsx';");
  linhas.push("");
  linhas.push("  const { currentUser } = useSubscriptionAuth();");
  linhas.push("  const repId = currentUser?.id || '';");
  linhas.push("  // Igreja do VÍNCULO ATIVO (mesma fonte usada pelo");
  linhas.push("  // IgrejaLayout para autorizar e pelo PainelPage para contar):");
  linhas.push("  const { igrejaId: ctxIgrejaId } = useOutletContext() || {};");
  linhas.push("  const igrejaId = ctxIgrejaId || getIgrejaId(currentUser);");
  linhas.push("");
  linhas.push("  const carregar = useCallback(async () => {");
  linhas.push("    // Guarda: sem igreja resolvida, não consulta.");
  linhas.push("    if (!igrejaId) {");
  linhas.push("      setItems([]);");
  linhas.push("      setTotalItems(0);");
  linhas.push("      setTotalPages(1);");
  linhas.push("      setLoading(false);");
  linhas.push("      return;");
  linhas.push("    }");
  linhas.push("    setLoading(true);");
  linhas.push("    setErro('');");
  linhas.push("    try {");
  linhas.push("      const filtros = [");
  linhas.push("        pb.filter('igreja_id = {:ig}', { ig: igrejaId }),");
  linhas.push("        pb.filter('papel = \"membro\"'),");
  linhas.push("      ];");
  linhas.push("      // ... getList(...)  -> retorna os membros pendentes");
  linhas.push("");

  linhas.push("Fluxo testado:");
  linhas.push("- Cadastrar pastor: ✅ Sucesso");
  linhas.push("- Definir igreja do pastor: ✅ Sucesso");
  linhas.push("- Cadastrar membro: ✅ Sucesso");
  linhas.push("- Definir mesma igreja do membro: ✅ Sucesso");
  linhas.push("- Solicitar aprovação: ✅ Sucesso");
  linhas.push("- Pastor acessa painel: ✅ Sucesso");
  linhas.push("- Membro aparece na lista: ✅ Confirmado");
  linhas.push("- Pode aprovar/rejeitar: ✅ Confirmado");
  linhas.push("");

  linhas.push("Impacto:");
  linhas.push("- Fluxo de aprovação de membros funciona.");
  linhas.push("- Membros pendentes aparecem corretamente.");
  linhas.push("- Pastor pode aprovar/rejeitar membros.");
  linhas.push("- Autorização do painel e listagem passam a usar a mesma");
  linhas.push("  fonte de verdade (o vínculo ativo do representante).");
  linhas.push("- Nenhuma alteração de schema, de regras de acesso ou de");
  linhas.push("  backend foi necessária.");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Rodapé =====
  linhas.push("RODAPÉ - RESUMO FINAL");
  linhas.push(sepMenor);
  linhas.push("Total de correções registradas: 1");
  linhas.push("");
  linhas.push("Resumo por área:");
  linhas.push("- FRONTEND (Painel da Igreja / Aprovação de Membros): 1 (1)");
  linhas.push("- BACKEND: 0 (nenhuma alteração necessária)");
  linhas.push("- CADASTRO: 0 (nenhuma alteração necessária)");
  linhas.push("- POCKETBASE (schema/regras): 0 (nenhuma alteração necessária)");
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
  linhas.push("Status final: Relatório de correção do fluxo de aprovação de");
  linhas.push("membros da igreja gerado com sucesso.");
  linhas.push("");
  linhas.push("Gerado em: " + dataHoraBrasilia);
  linhas.push(sep);
  linhas.push("Fim do relatório.");
  linhas.push(sep);

  return linhas.join("\n");
}

/**
 * Download do relatório de correção do fluxo de aprovação de membros da
 * igreja (.txt gerado em memória). Rota protegida por authMiddleware.
 * Registra o acesso em logs sem expor segredos.
 * GET /relatorio-correcao-fluxo-membros-igreja/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.username || "usuário desconhecido";
  logger.info(
    `[relatorio-correcao-fluxo-membros-igreja] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoFluxoMembrosIgreja();
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
    'attachment; filename="relatorio-correcao-fluxo-membros-igreja-18-08-2026-' +
      horaArquivo +
      '.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
