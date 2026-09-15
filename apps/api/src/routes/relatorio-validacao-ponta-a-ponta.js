// Download do relatório de VALIDAÇÃO PONTA A PONTA com dados reais
// (.txt gerado em memória).
//
// Validação completa do fluxo Matrícula → SSO → Meus Cursos → PDF usando
// dados reais: Aluno Rony Garcia (PocketBase id z5frz1bg23zq4j6), Curso 29
// (Curso Livre Secretariado) e a matrícula local correspondente
// (PocketBase id qjdz95atdk8i6e3). Cada teste é registrado como
// APROVADO / FALHOU / NÃO EXECUTADO com evidência observada.
//
// Evidências coletadas por:
//   - Leitura direta do banco PocketBase (apps/pocketbase/pb_data/data.db)
//   - Probes reais contra a VPS (https://api.conexaobatista.com.br)
//   - Auditoria de código do frontend (cursosService, cursosAuthService,
//     CursoMeusCursosPage, CursoAulaPage, aluno-sso)
//
// Rota protegida por adminAuth (coleção `admins`).
// GET /relatorio-validacao-ponta-a-ponta/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const agora = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "long",
  });

  return `================================================================================
RELATÓRIO DE VALIDAÇÃO PONTA A PONTA — INTEGRAÇÃO Frontend/VPS - 31/08/2026 18:58
================================================================================

Período: 31/08/2026
Data/hora de geração: ${agora} (horário de Brasília)

------------------------------------------------------------------------------
DADOS REAIS UTILIZADOS
------------------------------------------------------------------------------
  Aluno: Rony Garcia
    - PocketBase id: z5frz1bg23zq4j6
    - E-mail: ronydgarcia@gmail.com
    - Papel: admin | status_aprovacao: aprovado | status_cadastro: aprovado

  Curso: Curso Livre Secretariado (ID 29)
    - titulo: "Curso Livre Secretariado"
    - categoria: "Liderança e Administração Eclesiástica"
    - carga_horaria: 50 | preco: 0.00 | status: publicado
    - pdf_url: AUSENTE (campo undefined na resposta da VPS)
    - video_url: null
    - matriz_curricular: presente | objetivos: presente

  Matrícula (fonte local PocketBase — coleção "matriculas"):
    - PocketBase id: qjdz95atdk8i6e3
    - usuario_id: z5frz1bg23zq4j6 (Rony Garcia)
    - curso_api_id: "29"
    - curso_titulo: "Curso Livre Secretariado"
    - status: ativa
    - created: 2026-08-27 01:27:05.257Z

  OBSERVAÇÃO SOBRE "MATRÍCULA ID 133":
    O ID 133 refere-se à matrícula na VPS (banco cursos_db da VPS). Esse
    registro NÃO é consultável a partir do sandbox sem credenciais de aluno
    na VPS (GET /aluno/cursos retorna 401 sem token). A matrícula LOCAL no
    PocketBase (id qjdz95atdk8i6e3) é a cópia persistida pelo fluxo de
    matrícula do site (POST /cursos/:id/matricula) e é a fonte lida por
    "Meus Cursos" (getMeusCursos em cursosService.js). A existência e
    consistência dessa matrícula local foi confirmada por leitura direta
    do banco PocketBase.

  PDF DE 3 PÁGINAS:
    O curso 29 NÃO possui o campo pdf_url na resposta da VPS (probe real
    GET /cursos/29 → 200, campo pdf_url ausente). Portanto NÃO há um PDF
    de 3 páginas associado ao curso 29 para validar o leitor. O leitor de
    PDF (CursoAulaPage) trata corretamente a ausência exibindo o estado
    "Sem material em PDF". Os testes de navegação/download do PDF não
    puderam ser executados com arquivo real.

================================================================================
TABELA DE TESTES
================================================================================

Legenda:
  APROVADO      = validado com evidência real (banco/probe/código)
  FALHOU        = evidência real demonstrou falha
  NÃO EXECUTADO = exige sessão de navegador interativa (login/click/F5),
                  não executável a partir do sandbox de código

| #    | Teste                                      | Resultado      | Evidência                                                                                                  | Pendência                                                                                  |
|------|--------------------------------------------|----------------|------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| 1.1  | Matrícula 133 encontrada na fonte           | APROVADO       | Leitura direta PB: matrícula qjdz95atdk8i6e3, usuario Rony (z5frz1bg23zq4j6), curso 29, status ativa.      | ID 133 é VPS (não consultável sem auth VPS); matrícula local correspondente confirmada.    |
| 1.2  | Mesma fonte consultada pelo painel         | APROVADO       | cursosService.getMeusCursos() lê pb.collection('matriculas') — mesma coleção consultada. Matrícula Rony/29 presente. | Nenhuma.                                                                                   |
| 2.1  | Token SSO gerado                           | NÃO EXECUTADO  | Código: rota /aluno-sso gera JWT HS256 (MENTOR_JWT_SECRET, destino aluno, TTL 600s); token não persistido em localStorage. | Geração live exige sessão de navegador (login + click "Acessar curso").                   |
| 2.2  | SSO redireciona para /painel-aluno         | NÃO EXECUTADO  | Probe VPS: /sso → 400 sem token (endpoint existe), /painel-aluno → 200. Redirecionamento real exige token válido + browser. | Executar em navegador com SSO real.                                                        |
| 3.1  | Painel /meus-cursos carrega                | NÃO EXECUTADO  | Código: CursoMeusCursosPage renderiza lista de matriculas PB; estado vazio/login/erro tratados.            | Carregamento live exige sessão autenticada.                                                |
| 3.2  | Dados do curso corretos                    | APROVADO       | Probe VPS GET /cursos/29 → 200: titulo "Curso Livre Secretariado", categoria "Liderança e Administração Eclesiástica", carga 50, status publicado, preco 0.00. | Nenhuma.                                                                                   |
| 4.1  | Permanência após refresh (F5)              | NÃO EXECUTADO  | Exige navegador (F5). Sessão PocketBase persiste em authStore (SDK).                                       | Executar em navegador.                                                                     |
| 4.2  | Dados persistem após refresh               | NÃO EXECUTADO  | Exige navegador. Matrícula local persiste em PB SQLite (registro qjdz95atdk8i6e3 presente após reloads do sandbox). | Executar em navegador.                                                                     |
| 5.1  | Logout bem-sucedido                        | NÃO EXECUTADO  | Exige navegador. Código: logout limpa authStore PocketBase.                                               | Executar em navegador.                                                                     |
| 5.2  | Login novamente                            | NÃO EXECUTADO  | Exige navegador.                                                                                            | Executar em navegador.                                                                     |
| 5.3  | Matrícula persiste após logout/login       | NÃO EXECUTADO  | Exige navegador. Matrícula local em PB SQLite é independente da sessão (persiste).                         | Executar em navegador.                                                                     |
| 6.1  | Leitor de PDF carrega (/curso/29/aula)     | NÃO EXECUTADO  | Código: CursoAulaPage carrega via /cursos-publicados/:id; pdf.js configurado (worker min.mjs).             | Carregamento live exige navegador.                                                          |
| 6.2  | PDF real carregado (Cloudinary, HTTP 200)  | FALHOU         | Probe VPS GET /cursos/29: campo pdf_url AUSENTE (undefined). Não há PDF associado ao curso 29.             | Associar um PDF (pdf_url Cloudinary) ao curso 29 na VPS para validar o leitor com arquivo real. |
| 6.3  | Uma página por vez                         | NÃO EXECUTADO  | Sem PDF real. Código: renderiza 1 página em <canvas> por vez.                                              | Requer curso com pdf_url.                                                                  |
| 6.4  | Contador "Página 1 de 3"                   | NÃO EXECUTADO  | Sem PDF real. Código: indicador "Página {atual} de {total}".                                              | Requer curso com pdf_url.                                                                  |
| 6.5  | Navegação para página 2                    | NÃO EXECUTADO  | Sem PDF real. Código: botão "Próxima" incrementa página.                                                  | Requer curso com pdf_url.                                                                  |
| 6.6  | Navegação para página 3                    | NÃO EXECUTADO  | Sem PDF real.                                                                                              | Requer curso com pdf_url.                                                                  |
| 6.7  | Bloqueio no fim do documento               | NÃO EXECUTADO  | Sem PDF real. Código: botão "Próxima" disabled quando paginaAtual >= totalPaginas.                        | Requer curso com pdf_url.                                                                  |
| 6.8  | Navegação para trás                        | NÃO EXECUTADO  | Sem PDF real. Código: botão "Anterior" decrementa.                                                        | Requer curso com pdf_url.                                                                  |
| 6.9  | Navegação para página 1                    | NÃO EXECUTADO  | Sem PDF real.                                                                                              | Requer curso com pdf_url.                                                                  |
| 6.10 | Bloqueio no início do documento            | NÃO EXECUTADO  | Sem PDF real. Código: botão "Anterior" disabled quando paginaAtual <= 1.                                  | Requer curso com pdf_url.                                                                  |
| 6.11 | Responsividade desktop (1920x1080)         | NÃO EXECUTADO  | Exige navegador. Código: escala por container.clientWidth + devicePixelRatio.                             | Executar em navegador.                                                                     |
| 6.12 | Responsividade tablet (768x1024)           | NÃO EXECUTADO  | Exige navegador. Código: re-renderiza on resize (debounce 200ms).                                         | Executar em navegador.                                                                     |
| 6.13 | Responsividade mobile (375x667)            | NÃO EXECUTADO  | Exige navegador. Código: controles empilham em mobile (flex-col sm:flex-row).                             | Executar em navegador.                                                                     |
| 6.14 | Botão "Baixar PDF" presente                | APROVADO       | Código: CursoAulaPage renderiza botão "Baixar PDF" (ícone Download) quando curso.pdfUrl presente.          | Botão só aparece quando pdf_url existe (curso 29 não tem).                                 |
| 6.15 | Download do PDF funciona                   | NÃO EXECUTADO  | Sem PDF real. Código: baixarPdf() cria <a download> com curso.pdfUrl.                                      | Requer curso com pdf_url.                                                                  |
| 7.1  | localStorage sem tokens da VPS             | FALHOU         | Auditoria: cursosAuthService.js armazena "cursos_api_token" e "cursos_api_token_expires" em localStorage (bridge token da VPS). | Pendência crítica: migrar token bridge de localStorage para memória (state/authStore). Decisão requerida. |
| 7.2  | Console sem credenciais                    | APROVADO       | Auditoria: cursosService.js loga apenas status de matrícula (sucesso/ja_matriculado/ids), nunca tokens ou senhas. | Nenhuma.                                                                                   |
| 7.3  | Network sem exposição (apenas proxies)     | APROVADO       | Auditoria: todo tráfego de cursos usa apiServerClient (/hcgi/api proxies); nenhuma chamada direta a api.conexaobatista.com.br no código de cursos. | Nenhuma.                                                                                   |

================================================================================
RESUMO
================================================================================

  Total de Testes: 28
  Aprovados: 6
  Falhados: 2
  Não Executados: 20

  Status Final: PENDÊNCIA

  Pendências bloqueadoras (impedem "APROVADO" final):
    1. Teste 6.2 — Curso 29 sem pdf_url: não há PDF de 3 páginas associado
       ao curso para validar o leitor. Ação: associar um PDF (Cloudinary) ao
       curso 29 na VPS (ou usar um curso que já tenha pdf_url).
    2. Teste 7.1 — Token bridge da VPS persistido em localStorage
       (cursos_api_token). Ação: migrar o token para memória (React state /
       pb.authStore) em vez de localStorage. Esta alteração toca a camada de
       autenticação de cursos — requer decisão antes da execução.

  Testes não executados (20): exigem sessão de navegador interativa
  (login real, cliques, F5, logout/login, redimensionamento). Não são
  executáveis a partir do sandbox de código. A auditoria de código dos
  componentes correspondentes (CursoMeusCursosPage, CursoAulaPage,
  aluno-sso, logout) não encontrou defeitos — a lógica está implementada
  conforme especificado, mas a validação comportamental live fica pendente.

================================================================================
INTEGRAÇÕES PRESERVADAS
================================================================================

  ✅ Autenticação PocketBase (coleção users) — única fonte de login do site.
  ✅ Matrícula existente (Rony Garcia → curso 29, status ativa) — confirmada
     por leitura direta do banco PocketBase.
  ✅ SSO do aluno (rota /aluno-sso, JWT HS256, destino aluno, TTL 600s).
  ✅ Painel do aluno (proxy /cursos-publicados/:id + SSO VPS /painel-aluno).
  ✅ Permissões de acesso (regras PB: matriculas owner/admin; cursos admin).
  ✅ Backend VPS sem alterações — nenhum endpoint, segredo ou dado da VPS
     foi modificado. Apenas probes de leitura (GET) foram executados.

================================================================================
PRÓXIMAS ETAPAS
================================================================================

  1. Associar um PDF real (pdf_url Cloudinary, 3 páginas) ao curso 29 na
     VPS — OU criar/selecionar um curso publicado que já possua pdf_url —
     para executar os testes 6.2 a 6.15 com arquivo real.
  2. Decidir e executar a migração do token bridge da VPS de localStorage
     para memória (Teste 7.1), preservando o fluxo de renovação automática.
  3. Executar os 20 testes "NÃO EXECUTADOS" em uma sessão de navegador
     real com o aluno Rony Garcia autenticado (login, /meus-cursos,
     "Acessar curso", F5, logout/login, leitor de PDF, responsividade,
     DevTools Application/Console/Network).
  4. Após resolver 6.2 e 7.1 e converter os 20 testes live em APROVADO,
     o Status Final passa a APROVADO e a substituição na VPS pode seguir.

================================================================================
ARQUIVOS DO FRONTEND NECESSÁRIOS PARA SUBSTITUIÇÃO NA VPS
================================================================================

  Os arquivos do frontend que consomem a integração VPS (já presentes no
  repositório, sem alterações nesta validação):
    - apps/web/src/services/cursosService.js
    - apps/web/src/services/cursosAuthService.js
    - apps/web/src/pages/curso/CursoMeusCursosPage.jsx
    - apps/web/src/pages/curso/CursoAulaPage.jsx
    - apps/web/src/pages/curso/CursoAcessarPage.jsx
    - apps/web/src/pages/curso/CursoDetalhePage.jsx
    - apps/web/src/lib/apiServerClient.js
    - apps/web/src/lib/pocketbaseClient.js
    - apps/web/src/config/api.js (referencial de endpoints)

  Backend (proxies Express, sem alterações nesta validação):
    - apps/api/src/routes/cursos-sso.js (bridgeLogin, meusCursos, acessarCurso)
    - apps/api/src/routes/cursos-matricula.js
    - apps/api/src/routes/cursos-aulas.js
    - apps/api/src/routes/cursos-publicados.js
    - apps/api/src/routes/curso-publico-detalhe.js
    - apps/api/src/routes/aluno-sso.js
    - apps/api/src/routes/categorias.js

================================================================================
INSTRUÇÕES DE IMPLANTAÇÃO
================================================================================

  1. Backup: faça backup do estado atual da VPS (cursos_db + arquivos
     estáticos) antes de qualquer substituição.
  2. PDF: associe um PDF real (pdf_url Cloudinary) ao curso 29 (ou outro
     curso publicado) para permitir a validação live do leitor.
  3. Token bridge: decida a migração de localStorage → memória (Teste 7.1)
     ANTES de substituir, pois altera a camada de autenticação de cursos.
  4. Build do frontend: gere o build de produção (apps/web) e publique.
  5. Validação live: execute os 20 testes "NÃO EXECUTADOS" em navegador
     real com Rony Garcia autenticado.
  6. Promover: somente após Status Final = APROVADO.

================================================================================
EVIDÊNCIAS OBSERVADAS (probes reais — 31/08/2026)
================================================================================

  PocketBase (leitura direta data.db):
    - users: Rony Garcia (z5frz1bg23zq4j6) — admin, aprovado.
    - matriculas: qjdz95atdk8i6e3 → usuario Rony, curso 29, status ativa.
    - matriculas: índice único (usuario_id, curso_api_id) — sem duplicidade.

  VPS (curl https://api.conexaobatista.com.br):
    - GET /cursos            → 200 (lista pública, curso 29 presente)
    - GET /cursos/29         → 200 (campos completos; pdf_url AUSENTE)
    - GET /aluno/cursos      → 401 (exige token)
    - GET /cursos/29/token   → 401 (exige token)
    - GET /sso               → 400 (exige token; endpoint existe)
    - GET /painel-aluno      → 200 (página estática)

  Auditoria de código (frontend):
    - getMeusCursos() → pb.collection('matriculas').getFullList (mesma fonte).
    - /aluno-sso → JWT HS256, destino aluno, TTL 600s, sem persistência localStorage.
    - CursoAulaPage → pdf.js (worker min.mjs), 1 página/canvas, controles Anterior/Próxima disabled nos limites, botão "Baixar PDF" condicional a pdfUrl.
    - cursosAuthService.js → armazena cursos_api_token em localStorage (Teste 7.1 FALHOU).
    - Nenhuma chamada direta a api.conexaobatista.com.br no código de cursos (apenas proxies /hcgi/api).

================================================================================
FIM DO RELATÓRIO
================================================================================`;
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-validacao-ponta-a-ponta] Solicitação de relatório de validação ponta a ponta por: ${solicitante}`,
  );

  const conteudo = montarRelatorio();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-validacao-ponta-a-ponta-31-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
