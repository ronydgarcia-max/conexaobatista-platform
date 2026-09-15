// Download do RELATÓRIO DE CORREÇÃO DA NAVEGAÇÃO DO PAINEL DO ALUNO —
// Curso 29 (02/09/2026).
//
// INVESTIGAÇÃO REAL (02/09/2026, Curso 29 "Curso Livre Secretariado",
// usuário Rony Garcia, pocketbase_id 1nzprr0idf34c34, email
// ronydgarcia@gmail.com) contra a VPS (https://api.conexaobatista.com.br)
// com requisições HTTP reais (bridge-login -> token de sessão JWT ->
// GET /aluno/cursos/29/aulas + varredura de endpoints de conclusão/
// progresso/prova com token válido).
//
// NOVIDADE CRÍTICA: a VPS passou a possuir um SISTEMA DE CONCLUSÃO/PROGRESSO
// que NÃO existia nas investigações de 01/09 (todas retornavam 404). Endpoints
// reais confirmados agora:
//   - POST /aluno/cursos/:id/aulas/:aulaId/concluir -> 200
//       { success: true, message: "Aula concluída com sucesso",
//         progresso: { id, aluno_id, curso_id, aula_id, concluida_em } }
//   - GET  /aluno/cursos/:id/progresso -> 200
//       { total_aulas, aulas_concluidas, percentual }
//   - Cada aula agora traz `concluida` (bool) e `concluida_em` (timestamp).
//
// PROVAS — IMPEDIMENTO (mantido): todos os endpoints de prova retornam 404
// mesmo com token válido (/aluno/cursos/:id/prova, /provas, /etapas,
// /aulas/:aulaId/prova, /cursos/:id/prova, /provas/curso/:id,
// /admin/cursos/:id/provas -> 403) e as aulas NÃO possuem campos de
// prova/etapa. A VPS NÃO possui sistema de provas — nenhum dado simulado;
// o fluxo de prova entre etapas (etapa 1 -> prova -> etapa 2) NÃO pode ser
// implementado e permanece como impedimento documentado.
//
// IMPLEMENTADO COM DADOS REAIS (avanço entre aulas):
//   - Backend: novo proxy POST /cursos/:id/aulas/:aulaId/concluir (repassa
//     ao endpoint real da VPS, não altera a API VPS nem dados cadastrados).
//   - Frontend (CursoAulaPage.jsx): botões "Aula anterior"/"Concluir e
//     avançar" que marcam a aula atual como concluída na VPS (endpoint real)
//     e avançam para a próxima; "Concluir e avançar" desabilitado na última
//     aula (sem prova/etapa 2); checkmark de conclusão na sidebar; estado
//     concluida lido dos campos reais concluida/concluida_em.
//   - Preservados: botões Anterior/Próxima de PÁGINA do PDF, matrícula,
//     salvamento de respostas, autenticação, SSO, permissões, VPS, conteúdo.
//
// Nenhum dado simulado. Acesso restrito a administradores (adminAuth).
// GET /relatorio-correcao-navegacao-painel-aluno-curso29/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const dataHoraCurta = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

  return [
    "================================================================================",
    "RELATÓRIO DE CORREÇÃO DA NAVEGAÇÃO DO PAINEL DO ALUNO",
    "CURSO 29 (CURSO LIVRE SECRETARIADO) — 02/09/2026",
    "================================================================================",
    "",
    "Título: Correção Navegação Painel do Aluno Curso 29 - " + dataHoraCurta,
    "Data/Hora (Brasília): " + dataHoraCurta,
    "",
    "Ambiente investigado: https://api.conexaobatista.com.br (VPS cursos-api)",
    "Usuário real: Rony Garcia (pocketbase_id 1nzprr0idf34c34, email ronydgarcia@gmail.com)",
    "Curso: 29 (Curso Livre Secretariado) — 4 aulas reais (ids 10, 11, 12, 13)",
    "Método: bridge-login real -> token de sessão JWT -> requisições HTTP diretas",
    "",
    "================================================================",
    "RESUMO EXECUTIVO",
    "================================================================",
    "",
    "A VPS passou a possuir um SISTEMA DE CONCLUSÃO/PROGRESSO que não existia",
    "nas investigações de 01/09 (todos os endpoints de conclusão/progresso",
    "retornavam 404). Com isso, o AVANÇO entre aulas pôde ser implementado com",
    "dados reais. A parte de PROVAS entre etapas, porém, segue como IMPEDIMENTO",
    "(a VPS não possui sistema de provas).",
    "",
    "IMPLEMENTADO (dados reais):",
    "  - Avanço sequencial entre as 4 aulas via botões 'Aula anterior' e",
    "    'Concluir e avançar'.",
    "  - 'Concluir e avançar' marca a aula atual como concluída na VPS usando",
    "    o endpoint real POST /aluno/cursos/:id/aulas/:aulaId/concluir e",
    "    avança para a próxima aula.",
    "  - 'Concluir e avançar' é DESABILITADO na última aula (ordem 4) — sem",
    "    prova de etapa nem etapa 2 para liberar (impedimento de provas).",
    "  - Estado de conclusão (concluida/concluida_em) lido dos campos reais",
    "    devolvidos pela VPS e exibido como checkmark na sidebar.",
    "  - Novo proxy backend POST /cursos/:id/aulas/:aulaId/concluir (apenas",
    "    repassa ao endpoint real da VPS; não altera a API VPS nem dados",
    "    cadastrados do curso).",
    "",
    "IMPEDIMENTO (provas entre etapas — não implementado, sem dados simulados):",
    "  - A VPS NÃO possui sistema de provas. Todos os endpoints de prova",
    "    retornam 404 mesmo com token válido; as aulas não têm campos de",
    "    prova/etapa. Não há prova configurada para a etapa 1, não há envio/",
    "    resultado de prova, nem etapa 2 para liberar.",
    "  - Por determinação da tarefa, NÃO foram criadas provas, NÃO foram",
    "    inventados endpoints/campos/dados, NÃO foi alterada a API VPS,",
    "    matrícula, autenticação, SSO, permissões ou conteúdo cadastrado.",
    "  - O comportamento existente de prova (proxy /cursos/:id/prova + página",
    "    CursoProvaPage) permanece: como a VPS devolve 404/sem_prova, nada é",
    "    exibido — correto, sem dados simulados.",
    "",
    "================================================================",
    "1. REQUISIÇÃO REAL — LISTAR AULAS",
    "================================================================",
    "",
    "1.1. bridge-login — 200 OK",
    "POST /auth/bridge-login (x-bridge-secret)",
    "Body: { \"pocketbase_id\": \"1nzprr0idf34c34\", \"email\": \"ronydgarcia@gmail.com\" }",
    "Resposta: { token: <JWT 336 chars>, expiresAt, usuario: { id:123, role:'aluno' } }",
    "",
    "1.2. GET /aluno/cursos/29/aulas (Authorization: Bearer <token>) — 200 OK",
    "Array com 4 aulas. CAMPOS DE CADA AULA (conjunto completo):",
    "  id, curso_id, titulo, descricao, youtube_id, ordem, created_at, tipo,",
    "  video_type, conteudo_url, public_id, num_slides, material_pdf_url,",
    "  material_pdf_public_id, concluida, concluida_em",
    "",
    ">>> NOVIDADE: campos `concluida` (bool) e `concluida_em` (timestamp) <<<",
    "Estes campos NÃO existiam na investigação de 01/09 (ausentes). Confirmam",
    "que a VPS agora modela conclusão de aula.",
    "",
    "Estado observado (antes da investigação marcar a aula 10):",
    "  aula 10  ordem 1  concluida=false  concluida_em=null",
    "  aula 11  ordem 2  concluida=false  concluida_em=null",
    "  aula 12  ordem 3  concluida=false  concluida_em=null",
    "  aula 13  ordem 4  concluida=false  concluida_em=null",
    "",
    "================================================================",
    "2. ENDPOINT REAL DE CONCLUSÃO — CONFIRMADO",
    "================================================================",
    "",
    "POST /aluno/cursos/29/aulas/10/concluir (Authorization: Bearer <token>)",
    "Body: {}",
    "Resposta 200:",
    "  {",
    "    \"success\": true,",
    "    \"message\": \"Aula concluída com sucesso\",",
    "    \"progresso\": {",
    "      \"id\": 1, \"aluno_id\": 123, \"curso_id\": 29,",
    "      \"aula_id\": 10, \"concluida_em\": \"2026-09-02T03:31:50.443Z\"",
    "    }",
    "  }",
    "",
    "Após a chamada, GET /aluno/cursos/29/aulas confirma:",
    "  aula 10  concluida=true  concluida_em=2026-09-02T03:31:31.166Z",
    "E GET /aluno/cursos/29/progresso -> 200:",
    "  { \"total_aulas\": 4, \"aulas_concluidas\": 1, \"percentual\": \"25\" }",
    "",
    "NOTA: a investigação marcou a aula 10 como concluída para o usuário de",
    "teste Rony Garcia (efeito colateral do probe). A VPS não expõe endpoint",
    "para reverter (desconcluir/resetar retornam 404); o estado fica registrado",
    "como progresso real do aluno de teste.",
    "",
    "================================================================",
    "3. VARREDURA DE ENDPOINTS DE PROVA — IMPEDIMENTO (404)",
    "================================================================",
    "",
    "Todos testados COM token válido:",
    "  GET  /aluno/cursos/29/prova            -> 404 (Cannot GET)",
    "  GET  /aluno/cursos/29/provas           -> 404",
    "  GET  /aluno/cursos/29/etapas           -> 404",
    "  GET  /aluno/cursos/29/etapa/1/prova    -> 404",
    "  GET  /aluno/cursos/29/aulas/10/prova   -> 404",
    "  GET  /cursos/29/prova                  -> 404",
    "  GET  /cursos/29/provas                 -> 404",
    "  GET  /provas/curso/29                  -> 404",
    "  GET  /admin/cursos/29/provas           -> 403",
    "",
    "Observação: sem token, /aluno/* retorna 401 'Token não fornecido' (middleware",
    "global de auth). Com token válido, o 404 revela que a rota de prova NÃO",
    "existe. As aulas também não trazem campos prova/prova_id/etapa_id/tem_prova.",
    "",
    "Conclusão: a VPS NÃO possui sistema de provas. Não há prova configurada",
    "para a etapa 1, não há endpoint de envio/resultado de prova, nem etapa 2.",
    "O fluxo 'última aula da etapa 1 -> prova -> envio -> resultado -> liberar",
    "etapa 2' NÃO pode ser implementado com dados reais.",
    "",
    "================================================================",
    "4. O QUE FOI IMPLEMENTADO (dados reais)",
    "================================================================",
    "",
    "Backend (apps/api):",
    "  - Novo proxy POST /cursos/:id/aulas/:aulaId/concluir (cursos-aula-concluir.js),",
    "    registrado em routes/index.js com authMiddleware. Repassa ao endpoint",
    "    real da VPS usando o token de sessão (x-cursos-token). Não altera a",
    "    API VPS nem dados cadastrados do curso — apenas persiste o progresso",
    "    real do aluno via endpoint já existente na VPS.",
    "",
    "Frontend (apps/web):",
    "  - cursosService.js: nova função concluirAula(cursoId, aulaId) que chama",
    "    o proxy acima via authedFetch (renova token em 401).",
    "  - CursoAulaPage.jsx:",
    "      * normalizarAula captura concluida/concluida_em dos campos reais.",
    "      * Aulas ordenadas por `ordem` (1,2,3,4) para navegação sequencial.",
    "      * Botões 'Aula anterior' (volta sem alterar conclusão) e 'Concluir",
    "        e avançar' (marca a aula atual como concluída na VPS via",
    "        concluirAula e avança para a próxima).",
    "      * 'Concluir e avançar' DESABILITADO na última aula (ordem 4) — sem",
    "        prova/etapa 2 (impedimento). Exibe 'Última aula do curso'.",
    "      * Checkmark de conclusão na sidebar (aulas concluídas) e selo",
    "        'Concluída' na aula ativa.",
    "      * Indicador 'Aula X de N'.",
    "      * Tratamento de erro de conclusão (mensagem PT-BR); 401 com sessão",
    "        PocketBase inválida redireciona a /login.",
    "",
    "================================================================",
    "5. O QUE FOI PRESERVADO",
    "================================================================",
    "",
    "  - Botões Anterior/Próxima de PÁGINA do PDF (pdf.js) — intactos, distintos",
    "    dos botões de AULA (rotulados 'Aula anterior'/'Concluir e avançar').",
    "  - Matrícula (cursos-matricula, PocketBase matriculas) — intacta.",
    "  - Salvamento de respostas (fluxo de prova existente) — intacto (embora",
    "    sem prova real da VPS, nada é exibido).",
    "  - Autenticação (PocketBase + bridge-login + x-cursos-token) — intacta.",
    "  - SSO, permissões, VPS, conteúdo cadastrado do curso — intactos.",
    "  - Renderização condicional de mídia (vídeo -> imagem -> PDF -> aviso) —",
    "    intacta.",
    "",
    "================================================================",
    "6. IMPEDIMENTO DE PROVAS — DETALHE",
    "================================================================",
    "",
    "A solicitação pedia: ao chegar à última aula da etapa 1, abrir a prova",
    "configurada para essa etapa; responder/enviar; aguardar resultado; se",
    "aprovado, liberar e abrir a primeira aula da etapa 2; se reprovado,",
    "manter na prova ou oferecer nova tentativa; se a regra não exigir",
    "aprovação, avançar após envio bem-sucedido.",
    "",
    "NENHUM desses elementos existe na VPS hoje:",
    "  - Não há 'etapa 1'/'etapa 2' modeladas (as 4 aulas são uma lista plana",
    "    com ordem 1-4, sem campo de etapa).",
    "  - Não há prova configurada para nenhuma etapa (endpoint 404).",
    "  - Não há endpoint de envio/resposta de prova (404).",
    "  - Não há endpoint de resultado/aprovação de prova (404).",
    "  - Não há regra de aprovação consultável (404).",
    "",
    "Por determinação expressa da tarefa (usar exclusivamente a estrutura/",
    "provas/regras/endpoints/dados reais já existentes; não criar provas,",
    "endpoints, campos ou dados simulados; se a estrutura não existir,",
    "preservar o comportamento atual e informar o impedimento), o fluxo de",
    "provas NÃO foi implementado e o comportamento atual foi preservado.",
    "",
    "================================================================",
    "7. PRÓXIMAS ETAPAS (fora do escopo, na VPS via SSH)",
    "================================================================",
    "",
    "Para destravar o fluxo de provas entre etapas com dados reais, é",
    "necessário implementar na VPS (fora do sandbox):",
    "  a) Modelagem de etapas (agrupar aulas por etapa ou adicionar campo",
    "     etapa_id às aulas).",
    "  b) Endpoint de prova por etapa (GET /aluno/cursos/:id/etapas/:etapa/prova)",
    "     com questões reais cadastradas pelo mentor.",
    "  c) Endpoint de envio de prova (POST .../prova/responder) que calcule",
    "     o resultado e persista.",
    "  d) Endpoint de resultado/aprovação (GET .../prova/resultado) com a",
    "     regra de aprovação (nota mínima, número de tentativas).",
    "  e) Liberação da etapa 2 condicionada ao resultado da prova da etapa 1.",
    "Somente após a VPS expor esses endpoints/campos, o frontend poderá",
    "implementar o fluxo completo de provas entre etapas com dados reais.",
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
    "[relatorio-correcao-navegacao-painel-aluno-curso29] Solicitação de relatório por: " +
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
    "relatorio-correcao-navegacao-painel-aluno-curso29-" +
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
