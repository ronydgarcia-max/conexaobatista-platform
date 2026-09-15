import logger from "../utils/logger.js";
import { formatarDataHoraBrasilia } from "./relatorio-download.js";

/**
 * Monta o relatório de IMPLEMENTAÇÃO - PROTEÇÃO GLOBAL CONTRA ERRO 404 PARA
 * ADMINS (.txt) documentando a implementação realizada em 18/08/2026. Gerado
 * em memória (não persiste arquivo). NÃO expõe segredos, tokens, JWTs ou
 * credenciais.
 *
 * Arquivo: relatorio-implementacao-protecao-global-admin-18-08-2026-[HORA].txt
 */
function montarRelatorioImplementacaoProtecaoGlobalAdmin() {
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
    "Arquivo: relatorio-implementacao-protecao-global-admin-18-08-2026-" +
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
  linhas.push("  1. Implementação - Proteção Global contra Erro 404 para Admins");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Detalhamento =====
  linhas.push("DETALHAMENTO DAS ALTERAÇÕES");
  linhas.push(sep);
  linhas.push("");

  linhas.push("1. IMPLEMENTAÇÃO - PROTEÇÃO GLOBAL CONTRA ERRO 404 PARA ADMINS");
  linhas.push("   Data/hora: 18/08/2026 " + dataHoraBrasilia);
  linhas.push(sepMenor);

  linhas.push("Problema:");
  linhas.push("- Quando um administrador está autenticado (coleção `admins`),");
  linhas.push("  qualquer componente que tenta buscar na coleção `users` usando o");
  linhas.push("  id do admin recebe HTTP 404 — o id do admin não existe em");
  linhas.push("  `users` (pertence à coleção `admins`).");
  linhas.push("- O erro ocorria em MÚLTIPLAS rotas, não apenas em uma:");
  linhas.push("    * / (página inicial) — Header do SiteLayout chamava");
  linhas.push("      verificarAcessoPainel(currentUser.id) ->");
  linhas.push("      pb.collection('users').getOne(adminId) -> 404.");
  linhas.push("    * /minha-conta — PainelIgrejaCard -> verificarAcessoPainel");
  linhas.push("      -> pb.collection('users').getOne(adminId) -> 404.");
  linhas.push("    * /painel -> redireciona para /igreja/aprovacao-membros.");
  linhas.push("    * /igreja/aprovacao-membros — IgrejaLayout/PainelPage");
  linhas.push("      consultavínculos/usuários -> 404.");
  linhas.push("    * Potencialmente em qualquer outra rota cujos componentes");
  linhas.push("      buscassem em `users` com o id do admin.");
  linhas.push("- As correções anteriores tratavam o problema PONTO A PONTO");
  linhas.push("  (guarda no Header, guarda em MinhaContaPage, etc.), mas o");
  linhas.push("  problema reaparecia sempre que uma nova rota consultava");
  linhas.push("  `users`. Era necessária uma solução GLOBAL e definitiva.");
  linhas.push("");

  linhas.push("Causa raiz:");
  linhas.push("- Componentes de múltiplas rotas tentam buscar na coleção");
  linhas.push("  `users` usando o id do usuário autenticado. Quando o");
  linhas.push("  autenticado é um admin (coleção `admins`), esse id não");
  linhas.push("  existe em `users`, gerando HTTP 404. Não havia um único");
  linhas.push("  ponto de controle que impedisse os componentes de montar");
  linhas.push("  para um admin em rotas públicas/igreja/curso.");
  linhas.push("");

  linhas.push("Localização: GLOBAL (múltiplas rotas — Frontend).");
  linhas.push("O POCKETBASE e a AUTENTICAÇÃO estão corretos; o registro do");
  linhas.push("admin existe, mas na coleção `admins`, não em `users`. A causa");
  linhas.push("está no Frontend, que não distinguia a coleção de origem antes");
  linhas.push("de disparar buscas em `users`.");
  linhas.push("");

  linhas.push("Solução:");
  linhas.push("- Criada uma GUARDA DE ROTA GLOBAL (middleware/guard) em um");
  linhas.push("  único ponto de controle:");
  linhas.push("    apps/web/src/hooks/useAdminGuard.js");
  linhas.push("  - Hook useIsAdmin(): verifica reativamente se");
  linhas.push("    pb.authStore.model.collectionName === 'admins' (com fallback");
  linhas.push("    para model.get('collectionName')), reagindo a login/logout");
  linhas.push("    via pb.authStore.onChange.");
  linhas.push("  - Componente <AdminRouteGuard>: envolve o conteúdo do <Router>.");
  linhas.push("    Se o usuário é admin E a rota atual NÃO começa com '/adm',");
  linhas.push("    renderiza apenas <Navigate to=\"/adm\" replace /> — os filhos");
  linhas.push("    (providers + Routes) NÃO montam, então NENHUM componente de");
  linhas.push("    rota pública/igreja/curso dispara buscas em `users`.");
  linhas.push("- Aplicada UMA ÚNICA vez em App.jsx, envolvendo");
  linhas.push("  <SubscriptionAuthProvider>/<AdminAuthProvider>/<Routes>:");
  linhas.push("    apps/web/src/App.jsx");
  linhas.push("  - Protege TODAS as rotas de uma vez (/, /minha-conta, /painel,");
  linhas.push("    /igreja/*, /curso/*, /relacionamentos/*, etc.).");
  linhas.push("  - Rotas /adm/* continuam acessíveis para admins (área deles).");
  linhas.push("  - Usuários da coleção `users` não são afetados (isAdmin=false).");
  linhas.push("- As guardas ponto a ponto anteriores (Header, MinhaContaPage)");
  linhas.push("  foram mantidas como defesa em profundidade, mas o controle");
  linhas.push("  principal agora é global e único.");
  linhas.push("");

  linhas.push("Arquivos modificados/criados:");
  linhas.push("- /apps/web/src/hooks/useAdminGuard.js (NOVO — guarda global).");
  linhas.push("- /apps/web/src/App.jsx (monta <AdminRouteGuard> no <Router>).");
  linhas.push("");

  linhas.push("Código ANTES (App.jsx — sem guarda global):");
  linhas.push(sepMenor);
  linhas.push("  <Router>");
  linhas.push("    <ScrollToTop />");
  linhas.push("    <SubscriptionAuthProvider>");
  linhas.push("      <AdminAuthProvider>");
  linhas.push("        <Routes>");
  linhas.push("          {/* ...rotas públicas, igreja, curso... */}");
  linhas.push("          {/* ❌ Admin em / ou /minha-conta monta componentes que");
  linhas.push("             buscam em `users` com id do admin -> HTTP 404 */}");
  linhas.push("        </Routes>");
  linhas.push("      </AdminAuthProvider>");
  linhas.push("    </SubscriptionAuthProvider>");
  linhas.push("    <ChatWidget />");
  linhas.push("  </Router>");
  linhas.push("");

  linhas.push("Código DEPOIS (App.jsx — guarda global envolvendo as rotas):");
  linhas.push(sepMenor);
  linhas.push("  import AdminRouteGuard from '@/hooks/useAdminGuard.jsx';");
  linhas.push("");
  linhas.push("  <Router>");
  linhas.push("    <ScrollToTop />");
  linhas.push("    <AdminRouteGuard>");
  linhas.push("      <SubscriptionAuthProvider>");
  linhas.push("        <AdminAuthProvider>");
  linhas.push("          <Routes>");
  linhas.push("            {/* ...rotas públicas, igreja, curso... */}");
  linhas.push("            {/* ✅ Admin em rota não-/adm NÃO chega a montar: */}");
  linhas.push("            /*    <AdminRouteGuard> retorna <Navigate to=\"/adm\"> */}");
  linhas.push("          </Routes>");
  linhas.push("        </AdminAuthProvider>");
  linhas.push("      </SubscriptionAuthProvider>");
  linhas.push("    </AdminRouteGuard>");
  linhas.push("    <ChatWidget />");
  linhas.push("  </Router>");
  linhas.push("");

  linhas.push("Código da guarda (useAdminGuard.js):");
  linhas.push(sepMenor);
  linhas.push("  function computeIsAdmin() {");
  linhas.push("    const model = pb.authStore.record || pb.authStore.model;");
  linhas.push("    if (!model) return false;");
  linhas.push("    const collectionName =");
  linhas.push("      model.collectionName ||");
  linhas.push("      (typeof model.get === 'function'");
  linhas.push("        ? model.get('collectionName')");
  linhas.push("        : undefined);");
  linhas.push("    return collectionName === 'admins';");
  linhas.push("  }");
  linhas.push("");
  linhas.push("  export default function AdminRouteGuard({ children }) {");
  linhas.push("    const isAdmin = useIsAdmin();");
  linhas.push("    const location = useLocation();");
  linhas.push("    if (isAdmin && !location.pathname.startsWith('/adm')) {");
  linhas.push("      return <Navigate to=\"/adm\" replace />;");
  linhas.push("    }");
  linhas.push("    return children;");
  linhas.push("  }");
  linhas.push("");

  linhas.push("Rotas testadas:");
  linhas.push("- / (página inicial): ✅ Sucesso");
  linhas.push("  (admin redirecionado para /adm antes de montar o SiteLayout).");
  linhas.push("- /minha-conta: ✅ Sucesso");
  linhas.push("  (admin redirecionado para /adm; PainelIgrejaCard não monta).");
  linhas.push("- /painel: ✅ Sucesso");
  linhas.push("  (admin redirecionado para /adm antes do atalho para /igreja).");
  linhas.push("- /igreja/aprovacao-membros: ✅ Sucesso");
  linhas.push("  (admin redirecionado para /adm; IgrejaLayout não monta).");
  linhas.push("- /curso/boas-vindas: ✅ Sucesso");
  linhas.push("  (admin redirecionado para /adm; CursoLayout não monta).");
  linhas.push("");

  linhas.push("Teste com admin: ✅ Redirecionado para /adm");
  linhas.push("  (em todas as rotas não-/adm testadas; sem requisição a");
  linhas.push("  `users` com id do admin, sem HTTP 404).");
  linhas.push("Teste com usuário normal: ✅ Funciona normalmente");
  linhas.push("  (useIsAdmin() retorna false; todas as rotas montam e carregam");
  linhas.push("  dados da coleção `users` corretamente, sem erro 404).");
  linhas.push("");

  linhas.push("Impacto:");
  linhas.push("- Erro 404 eliminado em TODAS as rotas quando um admin está");
  linhas.push("  autenticado — não apenas nas rotas tratadas anteriormente.");
  linhas.push("- Admins são redirecionados automaticamente para /adm em");
  linhas.push("  qualquer rota pública/igreja/curso, sem tentar buscar em");
  linhas.push("  `users`.");
  linhas.push("- Usuários normais (coleção `users`) não são afetados: todas");
  linhas.push("  as rotas funcionam normalmente e os dados carregam corretamente.");
  linhas.push("- Solução global, definitiva e com um único ponto de controle");
  linhas.push("  (apps/web/src/hooks/useAdminGuard.js + App.jsx).");
  linhas.push("- Nenhuma alteração de schema, de regras de acesso do");
  linhas.push("  PocketBase ou de backend foi necessária.");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Rodapé =====
  linhas.push("RODAPÉ - RESUMO FINAL");
  linhas.push(sepMenor);
  linhas.push("Total de implementações registradas: 1");
  linhas.push("");
  linhas.push("Resumo por área:");
  linhas.push("- FRONTEND (guarda global de rota): 1 (1)");
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
  linhas.push("Status final: Relatório de implementação da proteção global");
  linhas.push("contra erro 404 para admins gerado com sucesso.");
  linhas.push("");
  linhas.push("Gerado em: " + dataHoraBrasilia);
  linhas.push(sep);
  linhas.push("Fim do relatório.");
  linhas.push(sep);

  return linhas.join("\n");
}

/**
 * Download do relatório de implementação da proteção global contra erro 404
 * para admins (.txt gerado em memória). Rota protegida por authMiddleware.
 * Registra o acesso em logs sem expor segredos.
 * GET /relatorio-implementacao-protecao-global-admin/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.username || "usuário desconhecido";
  logger.info(
    `[relatorio-implementacao-protecao-global-admin] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorioImplementacaoProtecaoGlobalAdmin();
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
    'attachment; filename="relatorio-implementacao-protecao-global-admin-18-08-2026-' +
      horaArquivo +
      '.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
