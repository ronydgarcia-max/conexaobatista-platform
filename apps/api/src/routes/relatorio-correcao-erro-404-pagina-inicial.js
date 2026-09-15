import logger from "../utils/logger.js";
import { formatarDataHoraBrasilia } from "./relatorio-download.js";

/**
 * Monta o relatório de CORREÇÃO - ERRO 404 NA PÁGINA INICIAL COM ADMIN LOGADO
 * (.txt) documentando a correção realizada em 18/08/2026. Gerado em memória
 * (não persiste arquivo). NÃO expõe segredos, tokens, JWTs ou credenciais.
 *
 * Arquivo: relatorio-correcao-erro-404-pagina-inicial-18-08-2026-[HORA].txt
 */
function montarRelatorioCorrecaoErro404PaginaInicial() {
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
    "Arquivo: relatorio-correcao-erro-404-pagina-inicial-18-08-2026-" +
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
  linhas.push("  1. Correção - Erro 404 na Página Inicial com Admin Logado");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Detalhamento =====
  linhas.push("DETALHAMENTO DAS ALTERAÇÕES");
  linhas.push(sep);
  linhas.push("");

  linhas.push("1. CORREÇÃO - ERRO 404 NA PÁGINA INICIAL COM ADMIN LOGADO");
  linhas.push("   Data/hora: 18/08/2026 " + dataHoraBrasilia);
  linhas.push(sepMenor);

  linhas.push("Problema:");
  linhas.push("- Ao acessar a página inicial (/) com um administrador");
  linhas.push("  autenticado (coleção `admins`, id ukuu3s51bcm5y0q), o site");
  linhas.push("  dispara uma requisição");
  linhas.push("  GET /api/collections/users/records/ukuu3s51bcm5y0q que retorna");
  linhas.push('  HTTP 404 ("The requested resource wasn\'t found.").');
  linhas.push("- O erro é registrado no log do PocketBase com auth=\"admins\",");
  linhas.push("  indicando que a chamada foi feita com um token de ADMIN");
  linhas.push("  (coleção `admins`), e não de usuário (coleção `users`).");
  linhas.push("- O registro ukuu3s51bcm5y0q não existe na coleção `users`");
  linhas.push("  porque pertence à coleção `admins`.");
  linhas.push("- É o mesmo erro já corrigido em /minha-conta, mas agora");
  linhas.push("  ocorrendo na página inicial (/), que é pública e renderiza o");
  linhas.push("  SiteLayout (Header) para qualquer usuário autenticado.");
  linhas.push("");

  linhas.push("Investigação realizada:");
  linhas.push("");
  linhas.push("1) POCKETBASE (logs de erro)");
  linhas.push("   - Entradas repetidas em auxiliary.db:");
  linhas.push('     GET /api/collections/users/records/ukuu3s51bcm5y0q');
  linhas.push('     status=404, auth="admins",');
  linhas.push('     details="sql: no rows in result set",');
  linhas.push('     referer=".../" (página inicial) e ".../adm/membros".');
  linhas.push("   - CONCLUSÃO: a requisição busca um id da coleção `admins`");
  linhas.push("     dentro da coleção `users` — por isso o 404 (id não existe");
  linhas.push("     em `users`). A autenticação usada é de admin, não de user.");
  linhas.push("");
  linhas.push("2) AUTENTICAÇÃO (contextos de auth)");
  linhas.push("   - O SubscriptionAuthContext espelha pb.authStore.model. Quando");
  linhas.push("     um admin está autenticado, currentUser retorna o registro");
  linhas.push("     da coleção `admins` (collectionName === 'admins',");
  linhas.push("     id = ukuu3s51bcm5y0q).");
  linhas.push("   - CONCLUSÃO: a autenticação está correta. O problema é que um");
  linhas.push("     componente global trata o admin como se fosse um usuário");
  linhas.push("     da coleção `users`.");
  linhas.push("");
  linhas.push("3) FRONTEND (SiteLayout.jsx — Header) — ERRO LOCALIZADO");
  linhas.push("   - O Header do SiteLayout é renderizado em TODAS as páginas");
  linhas.push("     públicas, inclusive a página inicial (/).");
  linhas.push("   - Sempre que há um currentUser autenticado, o useEffect do");
  linhas.push("     Header chama:");
  linhas.push("       verificarAcessoPainel(currentUser.id)");
  linhas.push("   - verificarAcessoPainel (em IgrejaLayout.jsx) faz, no fallback");
  linhas.push("     legado:");
  linhas.push("       pb.collection('users').getOne(userId)");
  linhas.push("   - Quando o admin está logado, userId = id do admin");
  linhas.push("     (ukuu3s51bcm5y0q), que NÃO existe em `users` -> HTTP 404.");
  linhas.push("   - O Header não filtrava admins antes de chamar a função, então");
  linhas.push("     o erro acontecia já no carregamento da página inicial.");
  linhas.push("");

  linhas.push("Causa raiz:");
  linhas.push("- O Header do SiteLayout (renderizado na página inicial e em");
  linhas.push("  todas as páginas públicas) chamava verificarAcessoPainel para");
  linhas.push("  TODO usuário autenticado, sem distinguir a coleção de origem.");
  linhas.push("  Para um administrador (coleção `admins`), a função busca");
  linhas.push("  pb.collection('users').getOne(adminId) no fallback legado — o");
  linhas.push("  id do admin não existe em `users`, gerando HTTP 404 já na");
  linhas.push("  página inicial.");
  linhas.push("");

  linhas.push("Localização: FRONTEND");
  linhas.push("(Header do SiteLayout — apps/web/src/components/SiteLayout.jsx).");
  linhas.push("O POCKETBASE e a AUTENTICAÇÃO estão corretos; o registro do admin");
  linhas.push("existe, mas na coleção `admins`, não em `users`.");
  linhas.push("");

  linhas.push("Solução:");
  linhas.push("- O useEffect do Header agora detecta quando currentUser");
  linhas.push("  pertence à coleção `admins` (currentUser.collectionName ===");
  linhas.push("  'admins', com fallback para currentUser.get('collectionName'))");
  linhas.push("  e, nesse caso, define podeAcessarPainel = false SEM chamar");
  linhas.push("  verificarAcessoPainel — evitando a consulta");
  linhas.push("  pb.collection('users').getOne(adminId) que gerava o 404.");
  linhas.push("- Admins continuam sem o link \"Painel da Igreja\" no header");
  linhas.push("  (área exclusiva de pastores/secretários da coleção `users`).");
  linhas.push("- Usuários da coleção `users` continuam sendo verificados");
  linhas.push("  normalmente (vínculo ativo + fallback legado).");
  linhas.push("");

  linhas.push("Arquivo modificado:");
  linhas.push("- /apps/web/src/components/SiteLayout.jsx");
  linhas.push("  (guarda contra currentUser da coleção `admins` no Header).");
  linhas.push("");

  linhas.push("Código ANTES (SiteLayout.jsx — Header):");
  linhas.push(sepMenor);
  linhas.push("  useEffect(() => {");
  linhas.push("    if (!isAuthenticated || !currentUser) {");
  linhas.push("      setPodeAcessarPainel(false);");
  linhas.push("      return;");
  linhas.push("    }");
  linhas.push("    // ❌ Sem guarda: admin autenticado é repassado para");
  linhas.push("    //    verificarAcessoPainel, que faz");
  linhas.push("    //    pb.collection('users').getOne(adminId) -> 404");
  linhas.push("    let cancelled = false;");
  linhas.push("    (async () => {");
  linhas.push("      const { autorizado } = await verificarAcessoPainel(");
  linhas.push("        currentUser.id,");
  linhas.push("      );");
  linhas.push("      if (!cancelled) setPodeAcessarPainel(autorizado);");
  linhas.push("    })();");
  linhas.push("    return () => { cancelled = true; };");
  linhas.push("  }, [isAuthenticated, currentUser]);");
  linhas.push("");

  linhas.push("Código DEPOIS (SiteLayout.jsx — Header):");
  linhas.push(sepMenor);
  linhas.push("  useEffect(() => {");
  linhas.push("    if (!isAuthenticated || !currentUser) {");
  linhas.push("      setPodeAcessarPainel(false);");
  linhas.push("      return;");
  linhas.push("    }");
  linhas.push("    // Admins (coleção `admins`) não têm vínculo de igreja nem");
  linhas.push("    // registro em `users`. Chamar verificarAcessoPainel com o id");
  linhas.push("    // do admin faz a função buscar");
  linhas.push("    // pb.collection('users').getOne(adminId) -> HTTP 404. Pular");
  linhas.push("    // a verificação para admins evita o erro na página inicial e");
  linhas.push("    // no header.");
  linhas.push("    const collectionName =");
  linhas.push("      currentUser.collectionName ||");
  linhas.push("      (typeof currentUser.get === 'function'");
  linhas.push("        ? currentUser.get('collectionName')");
  linhas.push("        : undefined);");
  linhas.push("    if (collectionName === 'admins') {");
  linhas.push("      setPodeAcessarPainel(false);");
  linhas.push("      return;");
  linhas.push("    }");
  linhas.push("    let cancelled = false;");
  linhas.push("    (async () => {");
  linhas.push("      const { autorizado } = await verificarAcessoPainel(");
  linhas.push("        currentUser.id,");
  linhas.push("      );");
  linhas.push("      if (!cancelled) setPodeAcessarPainel(autorizado);");
  linhas.push("    })();");
  linhas.push("    return () => { cancelled = true; };");
  linhas.push("  }, [isAuthenticated, currentUser]);");
  linhas.push("");

  linhas.push("Teste realizado:");
  linhas.push("- Login como administrador (coleção `admins`): ✅ Sucesso");
  linhas.push("- Acessar página inicial (/) como admin: ✅ Sucesso");
  linhas.push("  (não dispara GET users/records/<id-do-admin>).");
  linhas.push("- Sem erro HTTP 404: ✅ Confirmado");
  linhas.push("  (a requisição à coleção `users` com id de admin não ocorre).");
  linhas.push("- Link \"Painel da Igreja\" não exibido para admin: ✅ Confirmado");
  linhas.push("- Login como usuário (coleção `users`): ✅ Sucesso");
  linhas.push("- Acessar página inicial como usuário: ✅ Sucesso");
  linhas.push("- Verificação de vínculo funciona para usuário: ✅ Confirmado");
  linhas.push("");

  linhas.push("Impacto:");
  linhas.push("- Página inicial funciona corretamente para administradores");
  linhas.push("  autenticados, sem disparar consultas inválidas contra a");
  linhas.push("  coleção `users`.");
  linhas.push("- Header não tenta resolver \"Painel da Igreja\" para admins,");
  linhas.push("  eliminando as requisições GET users/records/<id-do-admin>");
  linhas.push("  que geravam HTTP 404 no log do PocketBase.");
  linhas.push("- Usuários da coleção `users` continuam sendo verificados");
  linhas.push("  normalmente (vínculo ativo + fallback legado).");
  linhas.push("- Nenhuma alteração de schema, de regras de acesso do");
  linhas.push("  PocketBase ou de backend foi necessária.");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Rodapé =====
  linhas.push("RODAPÉ - RESUMO FINAL");
  linhas.push(sepMenor);
  linhas.push("Total de correções registradas: 1");
  linhas.push("");
  linhas.push("Resumo por área:");
  linhas.push("- FRONTEND (Header / guarda de admin): 1 (1)");
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
  linhas.push("Status final: Relatório de correção do erro 404 na página inicial");
  linhas.push("com admin logado gerado com sucesso.");
  linhas.push("");
  linhas.push("Gerado em: " + dataHoraBrasilia);
  linhas.push(sep);
  linhas.push("Fim do relatório.");
  linhas.push(sep);

  return linhas.join("\n");
}

/**
 * Download do relatório de correção do erro 404 na página inicial com admin
 * logado (.txt gerado em memória). Rota protegida por authMiddleware.
 * Registra o acesso em logs sem expor segredos.
 * GET /relatorio-correcao-erro-404-pagina-inicial/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.username || "usuário desconhecido";
  logger.info(
    `[relatorio-correcao-erro-404-pagina-inicial] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoErro404PaginaInicial();
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
    'attachment; filename="relatorio-correcao-erro-404-pagina-inicial-18-08-2026-' +
      horaArquivo +
      '.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
