import logger from "../utils/logger.js";
import { formatarDataHoraBrasilia } from "./relatorio-download.js";

/**
 * Monta o relatório de CORREÇÃO - ERRO 404 AO BUSCAR DADOS DO USUÁRIO
 * (.txt) documentando a correção realizada em 18/08/2026. Gerado em memória
 * (não persiste arquivo). NÃO expõe segredos, tokens, JWTs ou credenciais.
 *
 * Arquivo: relatorio-correcao-erro-404-usuario-18-08-2026-[HORA].txt
 */
function montarRelatorioCorrecaoErro404Usuario() {
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
    "Arquivo: relatorio-correcao-erro-404-usuario-18-08-2026-" +
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
  linhas.push("  1. Correção - Erro 404 ao Buscar Dados do Usuário");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Detalhamento =====
  linhas.push("DETALHAMENTO DAS ALTERAÇÕES");
  linhas.push(sep);
  linhas.push("");

  linhas.push("1. CORREÇÃO - ERRO 404 AO BUSCAR DADOS DO USUÁRIO");
  linhas.push("   Data/hora: 18/08/2026 " + dataHoraBrasilia);
  linhas.push(sepMenor);

  linhas.push("Problema:");
  linhas.push("- Ao acessar /minha-conta, a página dispara uma requisição");
  linhas.push("  GET /api/collections/users/records/ukuu3s51bcm5y0q que retorna");
  linhas.push('  HTTP 404 ("The requested resource wasn\'t found.").');
  linhas.push("- O erro é registrado no log do PocketBase com auth=\"admins\",");
  linhas.push("  indicando que a chamada foi feita com um token de ADMIN");
  linhas.push("  (coleção `admins`), e não de usuário (coleção `users`).");
  linhas.push("- O registro ukuu3s51bcm5y0q não existe na coleção `users`");
  linhas.push("  porque pertence à coleção `admins`.");
  linhas.push("");

  linhas.push("Investigação realizada:");
  linhas.push("");
  linhas.push("1) POCKETBASE (logs de erro)");
  linhas.push("   - Entradas repetidas em auxiliary.db:");
  linhas.push('     GET /api/collections/users/records/ukuu3s51bcm5y0q');
  linhas.push('     status=404, auth="admins",');
  linhas.push('     details="sql: no rows in result set",');
  linhas.push('     referer=".../minha-conta".');
  linhas.push("   - CONCLUSÃO: a requisição busca um id da coleção `admins`");
  linhas.push("     dentro da coleção `users` — por isso o 404 (id não existe");
  linhas.push("     em `users`). A autenticação usada é de admin, não de user.");
  linhas.push("");
  linhas.push("2) AUTENTICAÇÃO (contextos de auth)");
  linhas.push("   - O app usa dois contextos que compartilham o MESMO cliente");
  linhas.push("     PocketBase (apps/web/src/lib/pocketbaseClient.js):");
  linhas.push("     * SubscriptionAuthContext — expõe currentUser =");
  linhas.push("       pb.authStore.model (qualquer coleção autenticada).");
  linhas.push("     * AdminAuthContext — login via");
  linhas.push("       pb.collection('admins').authWithPassword(...).");
  linhas.push("   - Quando um ADMIN se autentica, pb.authStore passa a conter");
  linhas.push("     o registro da coleção `admins`. Assim,");
  linhas.push("     useSubscriptionAuth().currentUser retorna o ADMIN, com");
  linhas.push("     collectionName === 'admins' e id = ukuu3s51bcm5y0q.");
  linhas.push("   - CONCLUSÃO: a autenticação está correta. O problema é que");
  linhas.push("     a página de \"Minha conta\" trata o admin como se fosse um");
  linhas.push("     usuário da coleção `users`.");
  linhas.push("");
  linhas.push("3) FRONTEND (MinhaContaPage.jsx) — ERRO LOCALIZADO");
  linhas.push("   - A página não filtra currentUser por coleção. Ela repassa");
  linhas.push("     currentUser.id (o id do admin) para componentes que");
  linhas.push("     consultam a coleção `users`:");
  linhas.push("     * <PainelIgrejaCard userId={currentUser.id} />");
  linhas.push("       -> verificarAcessoPainel(userId)");
  linhas.push("       -> pb.collection('users').getOne(userId)");
  linhas.push("       -> GET users/records/ukuu3s51bcm5y0q -> 404");
  linhas.push("     * <MeusVinculosSection userId={currentUser.id} />");
  linhas.push("       -> filtra vinculos_usuario_igreja por usuario_id do admin");
  linhas.push("   - O SubscriptionAuthContext já protege a busca de");
  linhas.push("     assinaturas (isUser = collectionName === 'users'), mas o");
  linhas.push("     currentUser em si é exposto sem filtro, levando a página");
  linhas.push("     a tratar o admin como usuário comum.");
  linhas.push("");

  linhas.push("Causa raiz:");
  linhas.push("- Desincronização de identidade: quando um administrador está");
  linhas.push("  autenticado, o SubscriptionAuthContext retorna o registro do");
  linhas.push("  admin (coleção `admins`) como currentUser. A página");
  linhas.push("  /minha-conta, projetada exclusivamente para usuários da");
  linhas.push("  coleção `users`, repassa o id do admin para componentes que");
  linhas.push("  consultam `users` — o id do admin não existe em `users`,");
  linhas.push("  gerando o HTTP 404.");
  linhas.push("");

  linhas.push("Localização: FRONTEND");
  linhas.push("(página \"Minha conta\" — MinhaContaPage.jsx). O POCKETBASE e a");
  linhas.push("AUTENTICAÇÃO estão corretos; o registro do admin existe, mas na");
  linhas.push("coleção `admins`, não em `users`.");
  linhas.push("");

  linhas.push("Solução:");
  linhas.push("- MinhaContaPage agora detecta quando currentUser pertence à");
  linhas.push("  coleção `admins` (currentUser.collectionName === 'admins') e:");
  linhas.push("    1) redireciona o admin para /adm (área administrativa);");
  linhas.push("    2) não renderiza PainelIgrejaCard nem MeusVinculosSection,");
  linhas.push("       evitando repassar o id do admin para consultas da");
  linhas.push("       coleção `users`.");
  linhas.push("- Com isso, a requisição GET users/records/<id-do-admin> não é");
  linhas.push("  mais disparada, eliminando o HTTP 404.");
  linhas.push("");

  linhas.push("Arquivo modificado:");
  linhas.push("- /apps/web/src/pages/MinhaContaPage.jsx");
  linhas.push("  (guarda contra currentUser da coleção `admins`).");
  linhas.push("");

  linhas.push("Código ANTES (MinhaContaPage.jsx):");
  linhas.push(sepMenor);
  linhas.push("  export default function MinhaContaPage() {");
  linhas.push("    const { currentUser, isAuthenticated } = useSubscriptionAuth();");
  linhas.push("    const navigate = useNavigate();");
  linhas.push("    // ❌ Sem guarda: admin autenticado é tratado como usuário");
  linhas.push("    //    da coleção `users`.");
  linhas.push("    ...");
  linhas.push("    useEffect(() => {");
  linhas.push("      if (!isAuthenticated) {");
  linhas.push("        navigate('/login?redirect=/minha-conta', { replace: true });");
  linhas.push("        return;");
  linhas.push("      }");
  linhas.push("      if (!currentUser) return;");
  linhas.push("      setNome(currentUser.name || '');");
  linhas.push("      ...");
  linhas.push("    }, [isAuthenticated, currentUser, navigate]);");
  linhas.push("");
  linhas.push("    if (!isAuthenticated || !currentUser) {");
  linhas.push("      return null;");
  linhas.push("    }");
  linhas.push("    // ❌ Repassa currentUser.id do admin para:");
  linhas.push("    //    <PainelIgrejaCard userId={currentUser.id} />");
  linhas.push("    //    <MeusVinculosSection userId={currentUser.id} />");
  linhas.push("    //    -> pb.collection('users').getOne(adminId) -> 404");
  linhas.push("");

  linhas.push("Código DEPOIS (MinhaContaPage.jsx):");
  linhas.push(sepMenor);
  linhas.push("  export default function MinhaContaPage() {");
  linhas.push("    const { currentUser, isAuthenticated } = useSubscriptionAuth();");
  linhas.push("    const navigate = useNavigate();");
  linhas.push("");
  linhas.push("    // Guarda contra sessão de ADMINISTRADOR: o");
  linhas.push("    // SubscriptionAuthContext espelha pb.authStore.model, que");
  linhas.push("    // quando um admin está autenticado (coleção `admins`) retorna");
  linhas.push("    // o registro do admin — e não um usuário da coleção `users`.");
  linhas.push("    // Repassar currentUser.id do admin para componentes que");
  linhas.push("    // consultam `users` gera HTTP 404. A página \"Minha conta\"");
  linhas.push("    // é exclusiva de usuários; admin é redirecionado para /adm.");
  linhas.push("    const isAdminUser = Boolean(");
  linhas.push("      currentUser && currentUser.collectionName === 'admins',");
  linhas.push("    );");
  linhas.push("    ...");
  linhas.push("    useEffect(() => {");
  linhas.push("      if (!isAuthenticated) {");
  linhas.push("        navigate('/login?redirect=/minha-conta', { replace: true });");
  linhas.push("        return;");
  linhas.push("      }");
  linhas.push("      if (isAdminUser) {");
  linhas.push("        navigate('/adm', { replace: true });");
  linhas.push("        return;");
  linhas.push("      }");
  linhas.push("      if (!currentUser) return;");
  linhas.push("      setNome(currentUser.name || '');");
  linhas.push("      ...");
  linhas.push("    }, [isAuthenticated, currentUser, navigate, isAdminUser]);");
  linhas.push("");
  linhas.push("    if (!isAuthenticated || !currentUser || isAdminUser) {");
  linhas.push("      return null;");
  linhas.push("    }");
  linhas.push("    // ✅ Admin não chega aqui: não dispara getOne em `users`.");
  linhas.push("");

  linhas.push("Teste realizado:");
  linhas.push("- Login como administrador (coleção `admins`): ✅ Sucesso");
  linhas.push("- Acessar /minha-conta como admin: ✅ Redirecionado para /adm");
  linhas.push("  (não dispara GET users/records/<id-do-admin>).");
  linhas.push("- Sem erro HTTP 404: ✅ Confirmado");
  linhas.push("  (a requisição à coleção `users` com id de admin não ocorre).");
  linhas.push("- Login como usuário (coleção `users`): ✅ Sucesso");
  linhas.push("- Acessar /minha-conta como usuário: ✅ Sucesso");
  linhas.push("- Dados do usuário carregam: ✅ Confirmado");
  linhas.push("  (PainelIgrejaCard e MeusVinculosSection usam o id correto).");
  linhas.push("");

  linhas.push("Impacto:");
  linhas.push("- Página \"Minha conta\" funciona corretamente para usuários");
  linhas.push("  da coleção `users` (dados carregam sem erro 404).");
  linhas.push("- Administradores autenticados são redirecionados para a área");
  linhas.push("  administrativa (/adm) em vez de disparar consultas inválidas");
  linhas.push("  contra a coleção `users`.");
  linhas.push("- Eliminadas as requisições GET users/records/<id-do-admin>");
  linhas.push("  que geravam HTTP 404 no log do PocketBase.");
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
  linhas.push("- FRONTEND (Minha conta / guarda de admin): 1 (1)");
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
  linhas.push("Status final: Relatório de correção do erro 404 ao buscar dados");
  linhas.push("do usuário gerado com sucesso.");
  linhas.push("");
  linhas.push("Gerado em: " + dataHoraBrasilia);
  linhas.push(sep);
  linhas.push("Fim do relatório.");
  linhas.push(sep);

  return linhas.join("\n");
}

/**
 * Download do relatório de correção do erro 404 ao buscar dados do usuário
 * (.txt gerado em memória). Rota protegida por authMiddleware.
 * Registra o acesso em logs sem expor segredos.
 * GET /relatorio-correcao-erro-404-usuario/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.username || "usuário desconhecido";
  logger.info(
    `[relatorio-correcao-erro-404-usuario] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoErro404Usuario();
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
    'attachment; filename="relatorio-correcao-erro-404-usuario-18-08-2026-' +
      horaArquivo +
      '.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
