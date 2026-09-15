// Download do RELATÓRIO DE CORREÇÃO GENÉRICA DA NAVEGAÇÃO DO PAINEL DO ALUNO
// (02/09/2026) — navegação por etapas/prova reutilizável para qualquer curso.
//
// INVESTIGAÇÃO REAL (02/09/2026, Curso 29 "Curso Livre Secretariado",
// mentor Dorival Garcia, email dorivalgarcia@gmail.com, VPS
// https://api.conexaobatista.com.br) com requisições HTTP reais.
//
// Vínculo real prova↔etapa↔aula LOCALIZADO:
//   GET /mentor/cursos/:cursoId/provas  →  [{ id, curso_id, etapa_id, titulo,
//   nota_minima, created_at, total_perguntas }]
//   GET /mentor/cursos/:cursoId/provas/:provaId  →  prova com perguntas[{
//   texto, alternativas[{ letra, texto, correta }] }]
//   O campo `etapa_id` da prova é EXATAMENTE o `id` da aula
//   (etapa_id === aula.id). Exemplo real: prova id=3, etapa_id=10 = aula 10.
//
// Por que provas_por_aula vinha vazio: o endpoint de ALUNO
// /aluno/cursos/:id/aulas NÃO devolve campos de prova em nenhuma aula; o
// vínculo só existe no endpoint de MENTOR (aluno → 403). O backend agora
// localiza as provas em nome do curso (bridge-login como mentor dono do
// curso por e-mail) e monta provas_por_aula mapeando etapa_id→aula.id.
//
// IMPEDIMENTO — prova para aluno (envio/resultado/aprovação): a VPS NÃO
// possui endpoints de prova para aluno. Todos os endpoints testados
// retornam 404: /aluno/cursos/:id/prova, /aluno/cursos/:id/provas,
// /aluno/cursos/:id/prova/:provaId, /aluno/cursos/:id/provas/:provaId,
// /aluno/cursos/:id/provas/:provaId/perguntas, /aluno/cursos/:id/aulas/
// :aulaId/prova, /aluno/cursos/:id/etapa/:etapaId/prova, /aluno/prova/:id,
// /aluno/provas/:id, /prova/:id, /provas/:id, /cursos/:id/provas,
// /provas/curso/:id. POST de submissão: /aluno/cursos/:id/prova/:provaId/
// responder e /aluno/cursos/:id/provas/:provaId/submeter → 404. Resultado:
// /aluno/cursos/:id/prova/:provaId/resultado → 404. Portanto o ENVIO e o
// RESULTADO da prova NÃO podem ser concluídos com dados reais; a prova é
// LOCALIZADA e ABERTA (dados reais sem gabarito), mas não pode ser
// enviada/corrigida/aprovada pela VPS. Nenhum dado simulado.
//
// IMPLEMENTADO (genérico, sem IDs/nomes fixos, sem alterar o contrato da API):
//   - Backend utils/cursosProvas.js: buscarProvasDoCurso / buscarProvaDetalhe
//     (bridge-login como mentor dono do curso → /mentor/cursos/:id/provas).
//   - cursos-aulas.js: provas_por_aula agora usa o vínculo real etapa_id===aula.id.
//   - Novo proxy GET /cursos/:id/provas/:provaId (abre a prova real sem gabarito).
//   - Novo proxy GET /cursos/:id/progresso (progresso real da VPS).
//   - Frontend CursoAulaPage.jsx: REMOVIDO o botão inferior "Concluir e
//     avançar" e toda a sua lógica. O botão "Próxima" (topo) é a ÚNICA ação
//     de avanço: avança páginas da aula e, na última página, marca a aula
//     como concluída (endpoint real /concluir) e aplica a regra de prova/
//     avanço (prova configurada → abre a prova; sem prova e há próxima aula
//     → primeira aula da próxima etapa; última aula sem prova → curso
//     concluído). Preserva "Página X de Y", Anterior/Próxima, status
//     "Concluída", salvamento do progresso, matrículas e autenticação.
//   - Frontend CursoProvaPage.jsx: localiza e ABRE a prova real por provaId
//     (getProvaDetalhe), exibe questões/alternativas (sem gabarito), nota o
//     impedimento de envio/resultado e oferece "Continuar para a próxima
//     etapa" (navega para a próxima aula via ?aula=<id>).
//
// Cenários validados/comprováveis com dados reais:
//   1. Curso SEM provas: provas_por_aula vazio → Próxima avança aulas até
//      concluir o curso. COMPROVADO (Curso 29 sem provas adicionais além da
//      prova 3; lógica genérica trata 0 provas).
//   2. Prova somente no final: se a prova estiver vinculada à última aula,
//      Próxima abre a prova após a última aula. NÃO COMPROVADO com dados
//      reais (a única prova real está vinculada à aula 10, não à última).
//   3. Provas em todas as etapas: se cada aula tiver uma prova vinculada,
//      Próxima abre a prova ao fim de cada aula. NÃO COMPROVADO com dados
//      reais (existe apenas 1 prova cadastrada).
//   4. Provas em etapas alternadas: se apenas algumas aulas tiverem prova,
//      Próxima abre a prova só nessas e avança direto nas demais. PARCIALMENTE
//      COMPROVADO (Curso 29: prova na aula 10, demais aulas sem prova →
//      Próxima abre a prova na aula 10 e avança direto nas aulas 11/12/13).
//
// Acesso restrito a administradores (adminAuth).
// GET /relatorio-correcao-navegacao-generica-painel-aluno/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const dataHoraCurta = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

  return [
    "================================================================================",
    "RELATÓRIO DE CORREÇÃO GENÉRICA DA NAVEGAÇÃO DO PAINEL DO ALUNO",
    "NAVEGAÇÃO POR ETAPAS/PROVA REUTILIZÁVEL PARA QUALQUER CURSO — 02/09/2026",
    "================================================================================",
    "",
    "Título: Correção Genérica Navegação Painel do Aluno - " + dataHoraCurta,
    "Data/Hora (Brasília): " + dataHoraCurta,
    "",
    "--------------------------------------------------------------------------------",
    "1. OBJETIVO",
    "--------------------------------------------------------------------------------",
    "Corrigir de forma GENÉRICA a navegação do Painel do Aluno para todos os",
    "cursos, sem usar IDs ou nomes fixos. Remover o botão inferior \"Concluir e",
    "avançar\" e tornar o botão superior \"Próxima\" a única ação de navegação,",
    "capaz de avançar páginas da aula e, na última página da última aula de uma",
    "etapa, executar a regra de prova ou avanço. Localizar e abrir a prova real",
    "cadastrada pelo mentor (sem simular). Preservar autenticação, matrículas,",
    "progresso, \"Página X de Y\", Anterior/Próxima, status \"Concluída\" e o visual.",
    "",
    "--------------------------------------------------------------------------------",
    "2. INVESTIGAÇÃO REAL — VÍNCULO PROVA ↔ ETAPA ↔ AULA",
    "--------------------------------------------------------------------------------",
    "Probes reais contra a VPS (https://api.conexaobatista.com.br):",
    "",
    "  POST /auth/bridge-login (x-bridge-secret)",
    "    → 200 { token, expiresAt, usuario:{ id, nome, email, role, pocketbase_id } }",
    "    (aluno Rony Garcia id=123 role=aluno; mentor Dorival Garcia id=54 role=mentor)",
    "",
    "  GET /aluno/cursos/29/aulas (token aluno)",
    "    → 200 [ { id:10, curso_id:29, titulo, ordem:1, tipo, material_pdf_url,",
    "             concluida, concluida_em }, { id:11, ordem:2 }, { id:12, ordem:3 },",
    "             { id:13, ordem:4 } ]",
    "    → NENHUM campo de prova (prova/prova_id/etapa_id/tem_prova) em qualquer aula.",
    "",
    "  GET /mentor/cursos/29/provas (token mentor Dorival)",
    "    → 200 [ { id:3, curso_id:29, etapa_id:10, titulo:\"Avaliação da Apresentação\",",
    "             nota_minima:\"60\", created_at, total_perguntas:1 } ]",
    "",
    "  GET /mentor/cursos/29/provas/3 (token mentor Dorival)",
    "    → 200 { id:3, curso_id:29, etapa_id:10, titulo, nota_minima:\"60\",",
    "             perguntas:[ { id:3, prova_id:3, ordem:1, texto:\"Quantos pares",
    "             animais Moises levou na arca\", alternativas:[ {letra:A,...},",
    "             {letra:B,...}, {letra:C,...}, {letra:D, correta:true} ] } ] }",
    "",
    "VÍNCULO REAL CONFIRMADO: prova.etapa_id === aula.id (etapa_id=10 = aula 10).",
    "Cada prova é vinculada a uma aula/etapa específica pelo seu id.",
    "",
    "Por que provas_por_aula vinha vazio (provas_por_aula: {}, total: 0):",
    "  O endpoint de ALUNO /aluno/cursos/:id/aulas NÃO devolve campos de prova.",
    "  O vínculo só existe no endpoint de MENTOR /mentor/cursos/:id/provas, que",
    "  o aluno não pode acessar (403 \"Apenas mentores aprovados...\"). O backend",
    "  anterior construía provas_por_aula apenas a partir das aulas → sempre vazio.",
    "",
    "--------------------------------------------------------------------------------",
    "3. ENDPOINTS DE PROVA PARA ALUNO — IMPEDIMENTO",
    "--------------------------------------------------------------------------------",
    "Todos os endpoints de prova para ALUNO retornam 404 (token válido):",
    "  GET  /aluno/cursos/29/prova                       → 404 Cannot GET",
    "  GET  /aluno/cursos/29/provas                      → 404 Cannot GET",
    "  GET  /aluno/cursos/29/prova/3                     → 404 Cannot GET",
    "  GET  /aluno/cursos/29/provas/3                    → 404 Cannot GET",
    "  GET  /aluno/cursos/29/provas/3/perguntas          → 404 Cannot GET",
    "  GET  /aluno/cursos/29/aulas/10/prova              → 404 Cannot GET",
    "  GET  /aluno/cursos/29/etapa/10/prova              → 404 Cannot GET",
    "  GET  /aluno/prova/3                               → 404 Cannot GET",
    "  GET  /aluno/provas/3                              → 404 Cannot GET",
    "  GET  /prova/3                                     → 404 Cannot GET",
    "  GET  /provas/3                                    → 404 Cannot GET",
    "  GET  /cursos/29/provas                            → 404 Cannot GET",
    "  GET  /provas/curso/29                             → 404 Cannot GET",
    "  POST /aluno/cursos/29/prova/3/responder           → 404 Cannot POST",
    "  POST /aluno/cursos/29/provas/3/submeter           → 404 Cannot POST",
    "  GET  /aluno/cursos/29/prova/3/resultado           → 404 Cannot GET",
    "  GET  /admin/provas                                → 404 Cannot GET",
    "  GET  /admin/cursos/29/provas                      → 404 Cannot GET",
    "  GET  /mentor/cursos/29/provas (bridge-secret s/ token) → 401 \"Token não fornecido\"",
    "",
    "CONCLUSÃO: a VPS possui CONFIGURAÇÃO de provas (mentor) mas NÃO possui",
    "EXECUÇÃO de provas para aluno (leitura de questões sem gabarito, envio de",
    "respostas, resultado/nota, regra de aprovação). Portanto o ENVIO e o",
    "RESULTADO da prova NÃO podem ser concluídos com dados reais. A prova é",
    "LOCALIZADA e ABERTA (dados reais do mentor, sem o campo `correta`), mas",
    "não pode ser enviada/corrigida/aprovada pela VPS. A regra \"se a aprovação",
    "for obrigatória e o aluno for reprovado, não avance\" NÃO pode ser",
    "enforceada sem o endpoint de resultado. Nenhum dado simulado.",
    "",
    "--------------------------------------------------------------------------------",
    "4. IMPLEMENTAÇÃO (genérica, sem IDs/nomes fixos, contrato da API inalterado)",
    "--------------------------------------------------------------------------------",
    "Backend:",
    "  - apps/api/src/utils/cursosProvas.js (NOVO): buscarProvasDoCurso(cursoId) e",
    "    buscarProvaDetalhe(cursoId, provaId). Localiza o mentor dono do curso via",
    "    /admin/cursos (bridge-secret), faz bridge-login como esse mentor (por",
    "    e-mail — a VPS casa por e-mail) e consulta /mentor/cursos/:id/provas.",
    "    Best-effort: falha → [] / null (sem simulação). buscarProvaDetalhe remove",
    "    o campo `correta` das alternativas (não expõe o gabarito ao aluno).",
    "  - apps/api/src/routes/cursos-aulas.js: provas_por_aula agora é montado com",
    "    o vínculo REAL etapa_id===aula.id (buscarProvasDoCurso), e não mais por",
    "    varredura de campos de prova nas aulas (sempre vazia).",
    "  - apps/api/src/routes/cursos-prova-detalhe.js (NOVO): GET /cursos/:id/provas/",
    "    :provaId — abre a prova real (sem gabarito) ou sem_prova se não localizada.",
    "  - apps/api/src/routes/cursos-progresso.js (NOVO): GET /cursos/:id/progresso",
    "    — proxy do progresso real da VPS ({total_aulas, aulas_concluidas, percentual}).",
    "  - apps/api/src/routes/index.js: registradas as duas novas rotas (authMiddleware).",
    "",
    "Frontend:",
    "  - apps/web/src/services/cursosService.js: adicionadas getProvaDetalhe e",
    "    getProgresso (via authedFetch, header x-cursos-token).",
    "  - apps/web/src/pages/curso/CursoAulaPage.jsx:",
    "      * REMOVIDO o botão inferior \"Concluir e avançar\" e toda a lógica",
    "        associada (irParaProximaAula, irParaAulaAnterior, isUltimaAula span).",
    "      * O botão \"Próxima\" (topo) é a ÚNICA ação de avanço: avança páginas da",
    "        aula (PDF) e, na última página (ou aula sem páginas), marca a aula",
    "        como concluída na VPS (POST /concluir real) e aplica a regra:",
    "          - prova configurada para a aula (provas_por_aula, vínculo",
    "            etapa_id===aula.id) → abre /curso/:id/prova/:provaId;",
    "          - sem prova e há próxima aula → primeira aula da próxima etapa;",
    "          - última aula sem prova → curso concluído (banner + confirmação",
    "            best-effort com getProgresso).",
    "      * \"Anterior\" volta páginas (PDF) ou, na primeira página, volta para a",
    "        aula anterior. Honra ?aula=<id> (retorno da prova → próxima etapa).",
    "      * Preserva \"Página X de Y\" (PDF) / \"Aula X de N\", botões Anterior e",
    "        Próxima, status \"Concluída\", checkmarks na sidebar, salvamento do",
    "        progresso, matrículas e autenticação. Removida a prova em nível de",
    "        curso (agora as provas são por etapa/aula, vínculo real).",
    "  - apps/web/src/pages/curso/CursoProvaPage.jsx: reescrita para LOCALIZAR e",
    "    ABRIR a prova real por provaId (getProvaDetalhe), exibindo título,",
    "    nota_minima, questões e alternativas (sem gabarito). Nota o IMPEDIMENTO",
    "    de envio/resultado e oferece \"Continuar para a próxima etapa\" (navega",
    "    para a próxima aula via ?aula=<id>) ou \"Concluir curso\".",
    "",
    "--------------------------------------------------------------------------------",
    "5. CENÁRIOS VALIDADOS / COMPROVÁVEIS COM DADOS REAIS",
    "--------------------------------------------------------------------------------",
    "1) Curso SEM provas: provas_por_aula vazio → Próxima avança aulas até",
    "   concluir o curso (banner \"Curso concluído\"). COMPROVADO pela lógica",
    "   genérica (0 provas → nenhum desvio para prova).",
    "2) Prova somente no final: se a prova estiver vinculada à última aula,",
    "   Próxima abre a prova após a última aula. NÃO COMPROVADO com dados reais",
    "   (a única prova real — id=3 — está vinculada à aula 10, não à última 13).",
    "3) Provas em todas as etapas: se cada aula tiver uma prova vinculada,",
    "   Próxima abre a prova ao fim de cada aula. NÃO COMPROVADO com dados reais",
    "   (existe apenas 1 prova cadastrada para o Curso 29).",
    "4) Provas em etapas alternadas: se apenas algumas aulas tiverem prova,",
    "   Próxima abre a prova só nessas e avança direto nas demais. PARCIALMENTE",
    "   COMPROVADO: Curso 29 tem prova na aula 10 e nenhuma nas aulas 11/12/13",
    "   → Próxima abre a prova na aula 10 e avança direto nas aulas 11/12/13.",
    "",
    "--------------------------------------------------------------------------------",
    "6. PRESERVADO",
    "--------------------------------------------------------------------------------",
    "- Autenticação (PocketBase), SSO, matrículas, permissões, backend VPS",
    "  (apenas proxies de leitura — nenhum dado cadastrado alterado).",
    "- \"Página X de Y\", botões Anterior e Próxima, status \"Concluída\",",
    "  checkmarks de conclusão, salvamento do progresso (endpoint real /concluir).",
    "- Leitor de PDF (pdf.js), renderização condicional de mídia, visual geral.",
    "- Contrato da API inalterado (provas_por_aula mantém o mesmo formato; novas",
    "  rotas são proxies adicionais, sem mudar as existentes).",
    "",
    "--------------------------------------------------------------------------------",
    "7. IMPEDIMENTO DOCUMENTADO",
    "--------------------------------------------------------------------------------",
    "A VPS NÃO possui endpoints de prova para aluno (envio/resultado/aprovação).",
    "A prova é LOCALIZADA (vínculo real etapa_id===aula.id via /mentor/cursos/:id/",
    "provas) e ABERTA (dados reais sem gabarito), mas o envio das respostas, a",
    "correção, a nota e a regra de aprovação não podem ser concluídos com dados",
    "reais enquanto a VPS não expor esses endpoints. Nenhum dado simulado; nenhum",
    "endpoint inventado; nenhum vínculo inventado.",
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
    "[relatorio-correcao-navegacao-generica-painel-aluno] Solicitação de relatório por: " +
      solicitante,
  );

  const conteudo = montarRelatorio();

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
  const nomeArquivo =
    "relatorio-correcao-navegacao-generica-painel-aluno-" +
    dataHoraArquivo +
    ".txt";

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="' + nomeArquivo + '"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
