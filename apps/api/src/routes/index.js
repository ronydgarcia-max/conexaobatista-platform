import { Router } from 'express';
import healthCheck from './health-check.js';
import cnpj from './cnpj.js';
import cursosToken from './cursos-token.js';
import cursosCadastro from './cursos-cadastro.js';
import cursosUsuarioEnsure from './cursos-usuario-ensure.js';
import { bridgeLogin, meusCursos, acessarCurso } from './cursos-sso.js';
import cursosMentor from './cursos-mentor.js';
import batistaRouter from './batista.js';
import relatorioDownload from './relatorio-download.js';
import relatorioAlteracoesRouter, { adminAuth } from './relatorio-alteracoes.js';
import relatorioVerificacao from './relatorio-verificacao.js';
import relatorioCorrecoes from './relatorio-correcoes.js';
import relatorioConfiguracao from './relatorio-configuracao.js';
import relatorioDiagnostico from './relatorio-diagnostico.js';
import relatorioCorrecaoJwt from './relatorio-correcao-jwt.js';
import relatorioDiagnosticoLogin from './relatorio-diagnostico-login.js';
import relatorioPaginaMentor from './relatorio-pagina-mentor.js';
import relatorioCorrecaoFluxoMentor from './relatorio-correcao-fluxo-mentor.js';
import relatorioCorrecaoLoopMentor from './relatorio-correcao-loop-mentor.js';
import relatorioDocumentacaoSso from './relatorio-documentacao-sso.js';
import relatorioAtualizacaoJwt from './relatorio-atualizacao-jwt.js';
import relatorioAjusteSsoMentor from './relatorio-ajuste-sso-mentor.js';
import relatorioCorrecaoAutorizacaoSso from './relatorio-correcao-autorizacao-sso.js';
import relatorioImplementacaoBotaoMentor from './relatorio-implementacao-botao-mentor.js';
import relatorioCorrecaoPainelMentor from './relatorio-correcao-painel-mentor.js';
import relatorioCorrecaoAutenticacaoPainel from './relatorio-correcao-autenticacao-painel.js';
import relatorioAlteracoesBoasVindas from './relatorio-alteracoes-boas-vindas.js';
import relatorioCorrecaoAprovarTutores from './relatorio-correcao-aprovar-tutores.js';
import relatorioCorrecaoErroUsuarios from './relatorio-correcao-erro-usuarios.js';
import relatorioCorrecaoFluxoMembrosIgreja from './relatorio-correcao-fluxo-membros-igreja.js';
import relatorioCorrecaoAcessoPainelIgreja from './relatorio-correcao-acesso-painel-igreja.js';
import relatorioCorrecaoErro404Usuario from './relatorio-correcao-erro-404-usuario.js';
import relatorioCorrecaoErro404PaginaInicial from './relatorio-correcao-erro-404-pagina-inicial.js';
import relatorioImplementacaoProtecaoGlobalAdmin from './relatorio-implementacao-protecao-global-admin.js';
import relatorioCorrecaoMembrosNaoAparecem from './relatorio-correcao-membros-nao-aparecem.js';
import relatorioCorrecaoFiltroMembrosPendentes from './relatorio-correcao-filtro-membros-pendentes.js';
import relatorioInvestigacaoCorrecaoMembrosPendentes from './relatorio-investigacao-correcao-membros-pendentes.js';
import relatorioCorrecaoHeaderPainelMentor from './relatorio-correcao-header-painel-mentor.js';
import painelMentorDownload from './painel-mentor-download.js';
import relatorioSchemaSql from './relatorio-schema-sql.js';
import relatorioSchemaSqlRelatorio from './relatorio-schema-sql-relatorio.js';
import mentorSsoToken from './mentor-sso-token.js';
import alunoSso from './aluno-sso.js';
import cursosModeracaoRouter from './cursos-moderacao.js';
import cursosMentorStatusRouter from './cursos-mentor-status.js';
import relatorioImplementacaoSistemaAprovacaoCursos from './relatorio-implementacao-sistema-aprovacao-cursos.js';
import relatorioCorrecaoErroUnauthorizedRelatorio from './relatorio-correcao-erro-unauthorized-relatorio.js';
import coracoesSsoToken from './coracoes-sso-token.js';
import relatorioImplementacaoIntegracaoCoracoesConectados from './relatorio-implementacao-integracao-coracoes-conectados.js';
import relatorioCorrecaoErroUnauthorizedCoracoes from './relatorio-correcao-erro-unauthorized-coracoes.js';
import relatorioAjusteBotaoCoracoesRelacionamentos from './relatorio-ajuste-botao-coracoes-relacionamentos.js';
import relatorioImplementacaoCursosConexaoBatista from './relatorio-implementacao-cursos-conexao-batista.js';
import relatorioLimpezaCampoCidadeAntigo from './relatorio-limpeza-campo-cidade-antigo.js';
import relatorioListaCanonicaCategorias from './relatorio-lista-canonica-categorias.js';
import relatorioCorrecaoPaginaCursos from './relatorio-correcao-pagina-cursos.js';
import relatorioCorrecaoCursosDestaque from './relatorio-correcao-cursos-destaque.js';
import relatorioRedesignPaginasCursos from './relatorio-redesign-paginas-cursos.js';
import relatorioAtualizacaoBloco02ValideMembresia from './relatorio-atualizacao-bloco-02-valide-membresia.js';
import relatorioCorrecoesPortalPublico from './relatorio-correcoes-portal-publico.js';
import relatorioCorrecoesPendentesPortal from './relatorio-correcoes-pendentes-portal.js';
import relatorioCorrecaoCriticaApi from './relatorio-correcao-critica-api.js';
import relatorioCorrecaoLinkPainelMentor from './relatorio-correcao-link-painel-mentor.js';
import relatorioCorrecaoFluxoInscricaoAluno from './relatorio-correcao-fluxo-inscricao-aluno.js';
import relatorioSincronizacaoUsuarioMatricula from './relatorio-sincronizacao-usuario-matricula.js';
import relatorioVerificacaoPersistenciaMatricula from './relatorio-verificacao-persistencia-matricula.js';
import relatorioTratamentoErrosMatriculaSso from './relatorio-tratamento-erros-matricula-sso.js';
import relatorioImplementacaoPaginaCursosPdf from './relatorio-implementacao-pagina-cursos-pdf.js';
import relatorioValidacaoIntegracaoVps from './relatorio-validacao-integracao-vps.js';
import relatorioValidacaoPontaAPonta from './relatorio-validacao-ponta-a-ponta.js';
import relatorioInvestigacaoAusenciaPdf from './relatorio-investigacao-ausencia-pdf.js';
import relatorioInvestigacaoFinalVps from './relatorio-investigacao-final-vps.js';
import relatorioCorrecaoFrontendMaterialPdf from './relatorio-correcao-frontend-material-pdf.js';
import relatorioAjustePainelAlunoMidia from './relatorio-ajuste-painel-aluno-midia.js';
import relatorioIntegracaoNovoPainelAluno from './relatorio-integracao-novo-painel-aluno.js';
import relatorioCorrecaoSessaoSso from './relatorio-correcao-sessao-sso.js';
import relatorioOtimizacaoLayoutAula from './relatorio-otimizacao-layout-aula.js';
import relatorioCorrecaoFalhasTelaAula from './relatorio-correcao-falhas-tela-aula.js';
import relatorioMelhoriaExperienciaTelaAulas from './relatorio-melhoria-experiencia-tela-aulas.js';
import relatorioReducaoAlturaCabecalhoAula from './relatorio-reducao-altura-cabecalho-aula.js';
import relatorioInvestigacaoProvasEtapa from './relatorio-investigacao-provas-etapa.js';
import relatorioAplicacaoDuasAlteracoesFrontend from './relatorio-aplicacao-duas-alteracoes-frontend.js';
import relatorioCorrecaoDoisProblemasFrontend from './relatorio-correcao-dois-problemas-frontend.js';
import relatorioCorrecaoLeitorPdfLargura from './relatorio-correcao-leitor-pdf-largura.js';
import relatorioInvestigacaoEstruturaApiConclusaoEtapa from './relatorio-investigacao-estrutura-api-conclusao-etapa.js';
import relatorioCorrecaoAutenticacaoPainelAluno from './relatorio-correcao-autenticacao-painel-aluno.js';
import relatorioCorrecaoAvancoTelaAprendizagemSecretariado from './relatorio-correcao-avanco-tela-aprendizagem-secretariado.js';
import relatorioInvestigacaoFluxoPainelMentor from './relatorio-investigacao-fluxo-painel-mentor.js';
import relatorioCorrecaoNavegacaoPainelAlunoCurso29 from './relatorio-correcao-navegacao-painel-aluno-curso29.js';
import relatorioCorrecaoNavegacaoGenericaPainelAluno from './relatorio-correcao-navegacao-generica-painel-aluno.js';
import relatorioAlteracaoFluxoLoginBridge from './relatorio-alteracao-fluxo-login-bridge.js';
import relatorioReversaoFluxoLoginBridge from './relatorio-reversao-fluxo-login-bridge.js';
import relatorioCorrecaoVariavelApiVps from './relatorio-correcao-variavel-api-vps.js';
import relatorioAuditoriaFluxosLogin from './relatorio-auditoria-fluxos-login.js';
import relatorioDiagnosticoBridgeSecret from './relatorio-diagnostico-bridge-secret.js';
import relatorioCorrecaoRenderizacaoYoutube from './relatorio-correcao-renderizacao-youtube.js';
import relatorioCorrecaoFrontendTiposMidia from './relatorio-correcao-frontend-tipos-midia.js';
import relatorioCorrecao01UrlsSlides from './relatorio-correcao-01-urls-slides.js';
import relatorioCorrecao02UrlsSlides from './relatorio-correcao-02-urls-slides.js';
import relatorioCorrecao03MensagemFalsaSlides from './relatorio-correcao-03-mensagem-falsa-slides.js';
import categorias from './categorias.js';
import cursosPublicados from './cursos-publicados.js';
import cursoPublicoDetalhe from './curso-publico-detalhe.js';
import cursosMatricula from './cursos-matricula.js';
import cursosAulas from './cursos-aulas.js';
import cursosAulaPdf from './cursos-aula-pdf.js';
import cursosAulaConcluir from './cursos-aula-concluir.js';
import cursosProgresso from './cursos-progresso.js';
import cursosProva from './cursos-prova.js';
import cursosProvaDetalhe from './cursos-prova-detalhe.js';
import cursosProvaLista from './cursos-prova-lista.js';
import cursosProvaRespostas from './cursos-prova-respostas.js';
import cursosProvaResultado from './cursos-prova-resultado.js';
import vpsAlunoProvasDownload from './vps-aluno-provas-download.js';
import relatorioImplementacaoProvasAluno from './relatorio-implementacao-provas-aluno.js';
import relatorioAjusteEndpointsProvasAluno from './relatorio-ajuste-endpoints-provas-aluno.js';
import relatorioCorrecaoExibicaoProvaAluno from './relatorio-correcao-exibicao-prova-aluno.js';
import relatorioCorrecaoAborterrorPocketbase from './relatorio-correcao-aborterror-pocketbase.js';
import relatorioSincronizacaoEstadoMatricula from './relatorio-sincronizacao-estado-matricula.js';
import relatorioInicializacaoNovaMatricula from './relatorio-inicializacao-nova-matricula.js';
import relatorioInvestigacaoCancelamentoMatricula from './relatorio-investigacao-cancelamento-matricula.js';
import relatorioCorrecaoMenuMentorAluno from './relatorio-correcao-menu-mentor-aluno.js';
import relatorioRevalidacaoCursosPortal from './relatorio-revalidacao-cursos-portal.js';
import relatorioEntradaAreaAluno from './relatorio-entrada-area-aluno.js';
import relatorioSincronizacaoExclusaoMatriculaVps from './relatorio-sincronizacao-exclusao-matricula-vps.js';
import relatorioAtualizacaoImagemCurso from './relatorio-atualizacao-imagem-curso.js';
import relatorioAtualizacaoResultadoProva from './relatorio-atualizacao-resultado-prova.js';
import relatorioPrompt4FinalizarRetornarAluno from './relatorio-prompt4-finalizar-retornar-aluno.js';
import relatorioInvestigacaoFluxoProvaFrontend from './relatorio-investigacao-fluxo-prova-frontend.js';
import relatorioInvestigacaoEnvioRespostasProvaFrontend from './relatorio-investigacao-envio-respostas-prova-frontend.js';
import relatorioLogoInstitucional from './relatorio-logo-institucional.js';
import relatorioLogoTransparencia from './relatorio-logo-transparencia.js';
import subscriptionsRouter from './ecommerce/subscriptions.js';
import authMiddleware from '../middleware/auth.js';
import { mentorRateLimit } from '../middleware/mentor-rate-limit.js';

const router = Router();

export default () => {
    console.log(`[${new Date().toISOString()}] Rotas da API foram inicializadas`);
    router.get('/health', healthCheck);
    router.get('/cnpj/:cnpj', cnpj);
    router.get('/cursos/token', authMiddleware, cursosToken);
    // Cadastro público de alunos na API de cursos (proxy para a VPS).
    router.post('/cursos/usuarios', cursosCadastro);

    // Sincroniza o usuário autenticado do PocketBase com a API externa de
    // cursos (POST /usuarios/ensure na VPS). Deve ser chamado ANTES da
    // matrícula para evitar "Usuário não encontrado. Chame /usuarios/ensure
    // primeiro.". Protegido por authMiddleware (sessão PocketBase válida).
    router.post('/cursos/usuarios-ensure', authMiddleware, cursosUsuarioEnsure);

    // SSO com a API de cursos (bridge-login, meus cursos, acesso a curso).
    router.post('/cursos/bridge-login', authMiddleware, bridgeLogin);
    router.get('/cursos/meus', authMiddleware, meusCursos);
    router.get('/cursos/:id/token', authMiddleware, acessarCurso);

    // Matrícula local + sincronização VPS (a API VPS não tem endpoint de
    // matrícula). Registra a matrícula no PocketBase e autentica o usuário na
    // VPS. Protegido por authMiddleware (sessão PocketBase válida).
    router.post('/cursos/:id/matricula', authMiddleware, cursosMatricula);

    // Lista as aulas de um curso (proxy ponta a ponta: obtém o token de
    // acesso ao curso na VPS e chama /aluno/cursos/:id/aulas em seguida).
    // Protegido por authMiddleware (sessão PocketBase válida).
    router.get('/cursos/:id/aulas', authMiddleware, cursosAulas);

    // Proxy autenticado do PDF de uma aula (blob application/pdf). O backend
    // valida a sessão PocketBase (authMiddleware), valida a matrícula na VPS
    // (só matriculados recebem a aula com material_pdf_url) e devolve os bytes
    // do PDF server-side — sem expor a URL nem depender de CORS no navegador.
    router.get('/cursos/:id/aulas/:aulaId/pdf', authMiddleware, cursosAulaPdf);

    // Proxy ponta a ponta para MARCAR UMA AULA COMO CONCLUÍDA na VPS
    // (POST /aluno/cursos/:id/aulas/:aulaId/concluir — endpoint real confirmado
    // em 02/09/2026). Usa o token de sessão do aluno (x-cursos-token). Não
    // altera a API VPS nem dados cadastrados do curso — apenas repassa a
    // chamada real. Protegido por authMiddleware (sessão PocketBase válida).
    router.post('/cursos/:id/aulas/:aulaId/concluir', authMiddleware, cursosAulaConcluir);

    // Proxy ponta a ponta para o PROGRESSO real do aluno na VPS
    // (GET /aluno/cursos/:id/progresso — endpoint real confirmado em
    // 02/09/2026). Devolve { total_aulas, aulas_concluidas, percentual }.
    // Usado pelo frontend para detectar a conclusão do curso (100%). Proxy
    // apenas repassa a chamada real; não simula dados. Protegido por
    // authMiddleware (sessão PocketBase válida).
    router.get('/cursos/:id/progresso', authMiddleware, cursosProgresso);

    // Proxy ponta a ponta para a PROVA de um curso (etapa final). Consulta a
    // VPS em /aluno/cursos/:id/prova com o token de sessão (bridge-login) e
    // devolve { existe, prova, status }. Sem prova cadastrada → existe=false
    // (o frontend mantém o botão "Próxima" normal). Nenhum dado simulado.
    // Protegido por authMiddleware (sessão PocketBase válida).
    router.get('/cursos/:id/prova', authMiddleware, cursosProva);

    // Proxy ponta a ponta para ABRIR a prova do aluno (detalhes: perguntas +
    // alternativas, SEM gabarito). Repassa GET /aluno/cursos/:cursoId/provas/:provaId na VPS
    // usando o token de sessão do aluno (x-cursos-token) e remove
    // defensivamente o campo `correta` das alternativas antes de devolver ao
    // frontend — o gabarito nunca chega ao navegador. Nenhum dado simulado;
    // contrato da API inalterado. Protegido por authMiddleware (sessão PB).
    router.get('/cursos/:id/provas/:provaId', authMiddleware, cursosProvaDetalhe);

    // Proxy ponta a ponta para LISTAR as provas do curso (camada do aluno).
    // Repassa GET /aluno/cursos/:cursoId/provas na VPS usando o token de
    // sessão do aluno (x-cursos-token). Devolve { provas, curso_id } (sem
    // gabarito — apenas metadados). Nenhum dado simulado. Protegido por
    // authMiddleware (sessão PocketBase válida).
    router.get('/cursos/:id/provas', authMiddleware, cursosProvaLista);

    // Proxy ponta a ponta para o ENVIO das respostas da prova do aluno na
    // VPS (POST /aluno/provas/:provaId/respostas — endpoint real da camada
    // do aluno, definido em src/routes/alunoProvas.js). O backend autentica a sessão PocketBase (authMiddleware),
    // lê o token de sessão da VPS (header x-cursos-token) e repassa a
    // chamada com body { respostas: [{ pergunta_id, alternativa_id }] }. A
    // VPS valida a matrícula, persiste as respostas, calcula a nota
    // ((acertos/total)*100), grava o resultado e devolve
    // { nota, aprovado, total_perguntas, total_acertos, nota_minima } — SEM
    // expor o gabarito. Regra de tentativa única: 409 quando a prova já foi
    // respondida. Nenhum dado simulado. Protegido por authMiddleware.
    router.post('/cursos/:id/provas/:provaId/respostas', authMiddleware, cursosProvaRespostas);

    // Proxy ponta a ponta para o RESULTADO da prova do aluno na VPS
    // (GET /aluno/provas/:provaId/resultado — endpoint real da camada do
    // aluno). O backend autentica a sessão PocketBase (authMiddleware), lê o
    // token de sessão da VPS (header x-cursos-token) e repassa a chamada. A
    // VPS devolve { nota, aprovado, total_perguntas, total_acertos,
    // nota_minima, respondido_em } a partir de provas_resultados — SEM expor
    // o gabarito. 404 quando o aluno ainda não respondeu. Nenhum dado
    // simulado. Protegido por authMiddleware (sessão PocketBase válida).
    router.get('/cursos/:id/provas/:provaId/resultado', authMiddleware, cursosProvaResultado);

    // Download do arquivo-fonte `src/routes/alunoProvas.js` para deploy manual
    // na VPS cursos-api (container cursos-api). Contém os três endpoints de
    // prova do aluno (abrir sem gabarito, enviar respostas, ver resultado)
    // reutilizando as tabelas já existentes — sem alterar o schema nem as
    // rotas do mentor. Acesso restrito a administradores (adminAuth).
    router.get('/adm/vps-aluno-provas-download', adminAuth, vpsAlunoProvasDownload);

    // Relatório de IMPLEMENTAÇÃO — ENDPOINTS DE PROVA DO ALUNO: documenta os
    // endpoints criados (VPS + proxy), regras de negócio, arquivos alterados,
    // deploy necessário e testes/documentação. Gerado em memória (.txt).
    // Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-implementacao-provas-aluno/download', adminAuth, relatorioImplementacaoProvasAluno);

    // Relatório de AJUSTE — ENDPOINTS DE PROVA DO ALUNO (VPS) (08/09/2026):
    // ajuste da integração frontend↔proxy↔VPS para os endpoints oficiais de
    // prova do aluno (correção automática, já testados na VPS). Proxy
    // repassa agora: GET /aluno/cursos/:cursoId/provas (listar),
    // GET /aluno/provas/:provaId (detalhes sem gabarito),
    // POST /aluno/provas/:provaId/respostas (enviar respostas) e
    // GET /aluno/provas/:provaId/resultado (ver resultado). Gabarito
    // (correta) ocultado para o aluno. Rotas do mentor e schema intactos.
    // Gerado em memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-ajuste-endpoints-provas-aluno/download', adminAuth, relatorioAjusteEndpointsProvasAluno);

    // Relatório de CORREÇÃO — exibição da prova do aluno (fallback de detalhe).
    // Documenta a restauração da exibição da prova (perguntas + alternativas)
    // após o ajuste de 08/09 que reescreveu o detalhe para /aluno/provas/:provaId
    // (ainda não deployado na VPS). Estratégia de camadas: aluno preferencial +
    // mentor fallback (buscarProvaDetalhe). Gabarito oculto em ambas as camadas.
    // Gerado em memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-correcao-exibicao-prova-aluno/download', adminAuth, relatorioCorrecaoExibicaoProvaAluno);

    // Relatório de CORREÇÃO — AbortError "signal is aborted without reason"
    // no console após login com PocketBase (IgrejaLayout / MeusVinculosSection /
    // PainelIgrejaCard). Documenta a causa raiz (auto-cancelamento do SDK
    // 0.27.x cancelando requisições simultâneas sobre a mesma coleção), a
    // compatibilidade do SDK com AbortController/signal, os efeitos
    // analisados, as alterações (AbortController próprio por efeito +
    // requestKey: null + tratamento silencioso de cancelamentos) e as
    // validações. Gerado em memória (.txt). Acesso restrito a
    // administradores (adminAuth — coleção admins).
    router.get('/relatorio-correcao-aborterror-pocketbase/download', adminAuth, relatorioCorrecaoAborterrorPocketbase);

    // Relatório de CORREÇÃO — Sincronização do estado de matrícula no frontend
    // (09/09/2026): limpeza imediata da interface ao excluir uma matrícula
    // (curso selecionado, lista de cursos matriculados e indicador de "já
    // matriculado"), reconsulta do estado real na API ao voltar à tela de
    // inscrição ou abrir um curso (sem reutilizar estado local/cache) e
    // distinção entre "não matriculado" (mostra inscrição) e "sessão expirada".
    // Documenta também o que NÃO foi feito nas duas alterações anteriores
    // (auditorias de leitura). Gerado em memória (.txt). Acesso restrito a
    // administradores (adminAuth — coleção admins).
    router.get('/relatorio-sincronizacao-estado-matricula/download', adminAuth, relatorioSincronizacaoEstadoMatricula);

    // Relatório de CORREÇÃO — Inicialização de uma nova matrícula no frontend
    // (09/09/2026): após cancelar e re-inscrever, o frontend refaz as
    // consultas reais de matrícula e progresso na API e limpa estados locais
    // antigos (curso concluído, aulas concluídas, progresso) quando o
    // progresso for 0% ou não houver registros para a nova matrícula; impede
    // o cancelamento de matrícula com progresso > 0; investiga e informa
    // onde o estado antigo foi encontrado (inclusive registros antigos de
    // progresso_aulas devolvidos pela VPS), sem excluir dados da VPS e sem
    // alterar backend, autenticação, SSO, provas, layout ou publicação.
    // Gerado em memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-inicializacao-nova-matricula/download', adminAuth, relatorioInicializacaoNovaMatricula);

    // Relatório de INVESTIGAÇÃO (somente leitura) — Cancelamento de matrícula
    // × lista "Meus Cursos" × mensagem "Sua sessão na plataforma de cursos
    // expirou" ao abrir o curso (09/09/2026). Rastreia cancelarMatricula
    // (remove APENAS o PocketBase; nenhuma chamada à VPS), a fonte usada por
    // getMeusCursos (PocketBase `matriculas`), a fonte usada para validar o
    // acesso ao abrir a aula (VPS GET /aluno/cursos/:id/aulas com token
    // bridge-login) e a resposta real da VPS (401 mesmo após renovação).
    // Determina que o cancelamento NÃO propaga para a VPS (divergência entre
    // as duas fontes de verdade) e documenta a origem da mensagem de sessão
    // expirada e qual lado precisa ser corrigido. Sem alterar código, banco,
    // backend, autenticação, SSO, progresso, layout ou publicação. Gerado em
    // memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-investigacao-cancelamento-matricula/download', adminAuth, relatorioInvestigacaoCancelamentoMatricula);

    // Relatório de CORREÇÃO — MENU DO FRONTEND (09/09/2026): usuários
    // autenticados com função de aluno (users.mentor_status !== 'aprovado')
    // não veem e não podem abrir os links 'Meus Cursos (Mentor)'
    // (/curso/mentor-cursos) e 'Área do mentor' (/curso/boas-vindas, que
    // leva ao Painel do Mentor hospedado na VPS via SSO). CursoLayout.jsx
    // filtra os itens mentorOnly do cabeçalho (desktop + mobile) e do
    // rodapé para não mentores aprovados, de forma reativa
    // (pb.authStore.onChange). Permanece somente a navegação do Painel do
    // Aluno. Não recria o Painel do Mentor, não altera URL da VPS, backend,
    // API, cursos, matrículas, progresso, autenticação, SSO ou publicação.
    // Gerado em memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-correcao-menu-mentor-aluno/download', adminAuth, relatorioCorrecaoMenuMentorAluno);

    // Relatório de CORREÇÃO — REVALIDAÇÃO DE CURSOS DO PORTAL + REMOÇÃO DO
    // ITEM "MEUS CURSOS (MENTOR)" (09/09/2026): (1) removido completamente do
    // menu (cabeçalho desktop + mobile e rodapé) e da rota /curso/mentor-cursos
    // no React (App.jsx) o item "Meus Cursos (Mentor)" — para alunos E mentores.
    // O Painel do Mentor já funciona separadamente na VPS (acessível pelo link
    // "Área do mentor" via SSO); o painel NÃO foi recriado e a URL da VPS NÃO
    // foi alterada. (2) getMeusCursos() agora revalida cada matrícula contra
    // GET /cursos-publicados/:id; cursos que retornarem 404 ("Curso não
    // encontrado ou não publicado" — excluídos/inexistentes/não publicados)
    // são removidos do estado local/cache (lista exibida + registro de
    // matrícula local stale). Cursos válidos, matrículas e progresso são
    // preservados. Falhas transitórias (rede/5xx) NÃO removem o curso.
    // Preserva autenticação, SSO, backend, API da VPS, layout, schema e
    // publicação. Gerado em memória (.txt). Acesso restrito a
    // administradores (adminAuth — coleção admins).
    router.get('/relatorio-revalidacao-cursos-portal/download', adminAuth, relatorioRevalidacaoCursosPortal);

    // Relatório de CORREÇÃO — entrada direta da Área do Aluno (09/09/2026).
    // Documenta a remoção do bloqueio "Antes de continuar" da entrada
    // /curso/aluno e o encaminhamento direto de usuários autenticados para
    // /curso/meus-cursos. Nenhum aceite novo, campo, política, consentimento,
    // autenticação, SSO, matrícula, progresso, prova, curso, API ou painel do
    // Mentor foi alterado. Gerado em memória (.txt). Acesso restrito a
    // administradores (adminAuth).
    router.get('/relatorio-entrada-area-aluno/download', adminAuth, relatorioEntradaAreaAluno);

    // Relatório de CORREÇÃO — SINCRONIZAÇÃO APÓS EXCLUSÃO DE MATRÍCULA NA VPS
    // (09/09/2026): ao abrir "Meus Cursos" ou "Acessar curso", o frontend
    // consulta a matrícula REAL na API da VPS (GET /cursos/meus →
    // /cursos/usuario/meus, fonte oficial). Se a VPS confirmar que o aluno
    // não está matriculado (matrícula excluída no painel administrativo da
    // VPS), remove imediatamente o curso da lista, do curso selecionado e do
    // estado/cache local (registro PocketBase stale deletado), mostra "Você
    // ainda não está matriculado" e NÃO tenta renovar o bridge-login nem
    // exibe "Sua sessão na plataforma expirou". Matrículas válidas,
    // progresso, cursos, provas, autenticação, SSO, imagem, layout, backend
    // e publicação preservados. Gerado em memória (.txt). Acesso restrito a
    // administradores (adminAuth — coleção admins).
    router.get('/relatorio-sincronizacao-exclusao-matricula-vps/download', adminAuth, relatorioSincronizacaoExclusaoMatriculaVps);

    // Relatório de CORREÇÃO — PROMPT 2, ATUALIZAR A IMAGEM DO CURSO
    // (09/09/2026): corrige exclusivamente no frontend a origem da imagem
    // dos cards de Cursos e Meus Cursos. Após uma nova inscrição, a imagem
    // passou a ser obtida dos dados ATUAIS do curso retornados pela API
    // (GET /cursos-publicados/:id, campo curso.imagem_url), sem reutilizar a
    // imagem antiga congelada no registro da matrícula (matriculas.
    // curso_imagem). Sem imagem definida → string vazia → placeholder padrão
    // já existente. Não altera título, descrição, preço, progresso, matrícula,
    // autenticação, SSO, layout, API da VPS nem publicação. Gerado em
    // memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-atualizacao-imagem-curso/download', adminAuth, relatorioAtualizacaoImagemCurso);

    // Relatório Prompt 3 — atualizar o resultado da prova: retorno visual
    // após o envio das respostas. A tela só atualiza com a confirmação real
    // da API; bloqueia reenvio de questão já registrada; exibe correção por
    // questão quando a API a traz, ou informa claramente que a correção
    // detalhada depende do backend. Não altera provas, banco, autenticação,
    // progresso, cursos ou publicação. Gerado em memória (.txt). Acesso
    // restrito a administradores (adminAuth).
    router.get('/relatorio-atualizacao-resultado-prova/download', adminAuth, relatorioAtualizacaoResultadoProva);

    // Relatório Prompt 4 — finalizar e retornar ao aluno: fluxo após a
    // confirmação da conclusão final do curso. Quando a API confirma
    // (getProgresso → percentual >= 100) que todas as aulas foram
    // concluídas, preserva o registro de conclusão, exibe a mensagem de
    // sucesso já existente e navega automaticamente para a página principal
    // do Painel do Aluno (/curso/meus-cursos). Não altera matrícula,
    // progresso, provas, autenticação, SSO, cursos, painel do mentor, API da
    // VPS ou publicação. Gerado em memória (.txt). Acesso restrito a
    // administradores (adminAuth).
    router.get('/relatorio-prompt4-finalizar-retornar-aluno/download', adminAuth, relatorioPrompt4FinalizarRetornarAluno);

    // Relatório de INVESTIGAÇÃO (somente leitura) — FLUXO DE ENVIO E EXIBIÇÃO
    // DO RESULTADO DA PROVA NO FRONTEND (10/09/2026): rastreio completo do
    // carregamento da prova, seleção de respostas, envio (POST
    // /cursos/:id/provas/:provaId/respostas → VPS POST /aluno/provas/
    // :provaId/respostas) e atualização da tela, sem alterar código, layout,
    // banco, autenticação, SSO, API da VPS ou publicação. Conclusão: o
    // frontend JÁ exibe a correção por questão (correta/incorreta) quando a
    // API a devolve (função extrairCorrecao); o ponto provável do problema
    // está no BACKEND/VPS, que devolve apenas a nota geral sem o array de
    // correção por questão. Próximo lado a corrigir: VPS (incluir array de
    // correção com pergunta_id, correta, alternativa_correta_id na resposta
    // de envio/resultado). Nenhum resultado é inventado no frontend. Gerado
    // em memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-investigacao-fluxo-prova-frontend/download', adminAuth, relatorioInvestigacaoFluxoProvaFrontend);

    // Relatório de INVESTIGAÇÃO (somente leitura) — envio das respostas da
    // prova no frontend (10/09/2026): compara o payload observado com
    // { respostas: [{ pergunta_id, alternativa_id }] }, identifica que o
    // frontend usa nome/tipo/lista corretos e documenta a mensagem genérica
    // "Respostas inválidas" diante da resposta real "Você já respondeu esta
    // prova". Verifica também o nível superior das listas de correção e
    // registra que listas aninhadas em `resultado` não são procuradas. Nenhuma
    // alteração funcional foi feita em prova, backend, autenticação, SSO,
    // layout ou publicação. Acesso restrito a administradores.
    router.get('/relatorio-investigacao-envio-respostas-prova-frontend/download', adminAuth, relatorioInvestigacaoEnvioRespostasProvaFrontend);

    // Relatório de IMPLEMENTAÇÃO — LOGO INSTITUCIONAL (10/09/2026): adição
    // exclusiva ao painel administrativo de uma área de gerenciamento do
    // logo institucional. Administradores enviam/substituem/removem uma
    // imagem de logo armazenada no armazenamento integrado do projeto
    // (PocketBase file storage — coleção config_logo), sem filesystem local.
    // O cabeçalho exibe o logo personalizado em todas as áreas públicas com
    // tamanho responsivo (desktop/celular), proporção preservada, sem
    // distorção e boa legibilidade; mantém o logo padrão quando nenhum
    // personalizado existe. Acesso restrito a administradores. Não altera
    // páginas, rotas, autenticação, cursos, Área do Aluno, Painel do Mentor,
    // integrações, API da VPS nem publicação. Gerado em memória (.txt).
    router.get('/relatorio-logo-institucional/download', adminAuth, relatorioLogoInstitucional);

    // Relatório de IMPLEMENTAÇÃO — LOGO INSTITUCIONAL: PNG TRANSPARENTE E
    // MARCA ÚNICA (10/09/2026): aceitar/usar PNG com fundo transparente
    // (preservando a transparência sobre o fundo azul), remover o texto
    // duplicado ao lado do logo no cabeçalho (logo como único elemento de
    // marca), altura responsiva equivalente à escrita anterior (sem
    // distorção, desktop/celular), fallback do logo padrão atual quando não
    // há PNG personalizado e aplicação do logo nas áreas públicas que já
    // exibem a identidade institucional. Não altera páginas, rotas,
    // autenticação, cursos, Área do Aluno, Painel do Mentor, integrações,
    // API da VPS nem publicação. Gerado em memória (.txt). adminAuth.
    router.get('/relatorio-logo-transparencia/download', adminAuth, relatorioLogoTransparencia);

    // SSO para a área do Mentor (credencial assinada + URL do ambiente real).
    // Rate limit por usuário autenticado (10/min) aplicado após authMiddleware.
    router.get('/cursos/mentor-acesso', authMiddleware, mentorRateLimit, cursosMentor);

    // Assistente de IA Batista (chat com streaming SSE). Autenticação opcional.
    router.use('/batista', batistaRouter);

    // Download do relatório de alterações (.txt gerado em memória).
    // Acesso restrito a usuários autenticados.
    router.get('/relatorio-download', authMiddleware, relatorioDownload);

    // Relatório de alterações na área administrativa (auth via coleção admins).
    router.use('/relatorio-alteracoes', relatorioAlteracoesRouter);

    // Relatório de verificação de segurança (blocos P0, P1 e P2).
    // Acesso restrito a administradores (valida token da coleção `admins`).
    router.get('/relatorio-verificacao/download', adminAuth, relatorioVerificacao);

    // Relatório de correções de segurança (5 correções pontuais de 16/08/2026).
    // Acesso restrito a administradores (valida token contra a coleção admins).
    router.get('/relatorio-correcoes/download', adminAuth, relatorioCorrecoes);

    // Relatório de configuração Mentor (variáveis MENTOR_ENV e MENTOR_REAL_URL).
    // Acesso restrito a administradores (valida token contra a coleção admins).
    router.get('/relatorio-configuracao/download', adminAuth, relatorioConfiguracao);

    // Relatório de diagnóstico de erro (variável de ambiente ausente no fluxo Mentor).
    // Acesso restrito a administradores (valida token contra a coleção admins).
    router.get('/relatorio-diagnostico/download', adminAuth, relatorioDiagnostico);

    // Relatório de correção de erro MENTOR_JWT_SECRET (segredo dedicado
    // configurado, fluxo Mentor testado com sucesso em produção).
    // Acesso restrito a administradores (valida token contra a coleção admins).
    router.get('/relatorio-correcao-jwt/download', adminAuth, relatorioCorrecaoJwt);

    // Relatório de diagnóstico de erro de login de usuário mentor
    // (noellilgarcia@gmail.com — "Usuário ou senha inválidos").
    // Acesso restrito a administradores (valida token contra a coleção admins).
    router.get('/relatorio-diagnostico-login/download', adminAuth, relatorioDiagnosticoLogin);

    // Relatório da página de boas-vindas do mentor (criação da página +
    // gerenciamento de imagem pela área administrativa).
    // Acesso restrito a administradores (valida token contra a coleção admins).
    router.get('/relatorio-pagina-mentor/download', adminAuth, relatorioPaginaMentor);

    // Relatório de correção de fluxo de navegação para a página de boas-vindas
    // do mentor (menu e CTA agora apontam para /curso/boas-vindas).
    // Acesso restrito a administradores (valida token contra a coleção admins).
    router.get('/relatorio-correcao-fluxo-mentor/download', adminAuth, relatorioCorrecaoFluxoMentor);

    // Relatório de correção do loop infinito na página de boas-vindas do mentor.
    router.get('/relatorio-correcao-loop-mentor/download', adminAuth, relatorioCorrecaoLoopMentor);

    // Relatório de documentação do fluxo SSO do mentor (o que o botão
    // "Vamos lá!" envia para a VPS: URL, método, campos, JWT claims, formato).
    // Acesso restrito a administradores (valida token contra a coleção admins).
    router.get('/relatorio-documentacao-sso/download', adminAuth, relatorioDocumentacaoSso);

    // Relatório de atualização de segredos JWT (MENTOR_JWT_SECRET e JWT_SECRET
    // atualizados em apps/api/.env; rebuild/deploy confirmado; impacto da
    // rotação de segredos documentado).
    // Acesso restrito a administradores (adminAuth — coleção admins), pois o
    // download é disparado pela área administrativa (/adm/relatorio-alteracoes).
    router.get('/relatorio-atualizacao-jwt/download', adminAuth, relatorioAtualizacaoJwt);

    // Relatório de ajuste SSO do mentor (investigação do payload do JWT e
    // confirmação de que o identificador único "email" já está presente no
    // token, além de "id" e "pocketbase_id").
    // Acesso restrito a administradores (adminAuth — coleção admins), pois o
    // download é disparado pela área administrativa (/adm/relatorio-alteracoes).
    router.get('/relatorio-ajuste-sso-mentor/download', adminAuth, relatorioAjusteSsoMentor);

    // Relatório de correção de erro de autorização na rota de relatório SSO
    // (a rota /relatorio-ajuste-sso-mentor/download usava authMiddleware
    // — validação contra a coleção users — mas é acessada por administradores
    // autenticados pela coleção admins; corrigido para adminAuth).
    // Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-correcao-autorizacao-sso/download', adminAuth, relatorioCorrecaoAutorizacaoSso);

    // Relatório de implementação do botão "Acessar painel do mentor" com SSO
    // (endpoint /mentor-sso-token + redirecionamento GET ?token=).
    // Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-implementacao-botao-mentor/download', adminAuth, relatorioImplementacaoBotaoMentor);

    // Relatório de correção do botão "Painel do Mentor" com token SSO
    // (painel-mentor.html agora captura o token da query string ?token= e o
    // persiste no localStorage, fazendo as chamadas /mentor/dashboard
    // autenticarem corretamente — HTTP 200 em vez de 401).
    // Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-correcao-painel-mentor/download', adminAuth, relatorioCorrecaoPainelMentor);

    // Relatório de correção da AUTENTICAÇÃO do painel do mentor (18/08/2026):
    // investigação do fluxo "Acessar painel do mentor" (SITE + VPS). O SITE
    // já gera o JWT e redireciona para /sso?token=; a causa raiz está na VPS
    // (rota /sso redireciona para /painel sem repassar o token) e no
    // painel-mentor.html (API_BASE apontava para /hcgi/api, inexistente na
    // VPS). Corrigido o API_BASE (adaptativo); ação requerida na VPS
    // documentada no relatório.
    // Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-correcao-autenticacao-painel/download', adminAuth, relatorioCorrecaoAutenticacaoPainel);

    // Relatório de alterações de boas-vindas (18/08/2026): correção de
    // data/hora em horário de Brasília, lógica de gênero em todo o texto e
    // remoção do botão "Vamos lá!".
    // Acesso restrito a usuários autenticados (authMiddleware), com log.
    router.get('/relatorio-alteracoes-boas-vindas/download', adminAuth, relatorioAlteracoesBoasVindas);

    // Relatório de correção do erro ao aprovar tutores (18/08/2026): o hook
    // PocketBase admin_validacoes.pb.js declarava localmente isAuthAdmin/
    // firstId, mas o bundler não as tornava disponíveis no callback
    // (ReferenceError: isAuthAdmin is not defined), fazendo toda
    // aprovação/rejeição de tutor falhar com erro 500. Corrigido importando
    // as funções de vinculos_utils.js.
    // Acesso restrito a usuários autenticados (authMiddleware), com log.
    router.get('/relatorio-correcao-aprovar-tutores/download', adminAuth, relatorioCorrecaoAprovarTutores);

    // Relatório de correção do erro ao buscar/atualizar dados de usuários
    // (18/08/2026): o hook PocketBase admin_validacoes.pb.js declarava as
    // constantes de validação (MENTOR_STATUS_FINAIS, PAPEIS_PERMITIDOS,
    // VINCULO_STATUS_FINAIS) no topo do arquivo, mas os callbacks de hooks
    // rodam em escopos JSVM isolados onde bindings de nível de arquivo ficam
    // undefined. Ao aprovar/rejeitar um tutor, o callback abortava com
    // "ReferenceError: MENTOR_STATUS_FINAIS is not defined" → HTTP 400.
    // Corrigido movendo as constantes para DENTRO de cada callback.
    // Acesso restrito a usuários autenticados (authMiddleware), com log.
    router.get('/relatorio-correcao-erro-usuarios/download', adminAuth, relatorioCorrecaoErroUsuarios);

    // Relatório de correção do fluxo de aprovação de membros da igreja
    // (18/08/2026): a página /igreja/aprovacao-membros derivava a igreja do
    // campo users.igreja_id (que pode estar vazio ou divergir da igreja do
    // vínculo ativo do pastor), enquanto a autorização do painel usa o
    // vínculo ativo. Resultado: filtro com igreja errada/vazia e lista de
    // membros pendentes vazia. Corrigido para usar o outlet context do
    // IgrejaLayout (igreja do vínculo ativo), com guarda contra igreja vazia.
    // Acesso restrito a usuários autenticados (authMiddleware), com log.
    router.get('/relatorio-correcao-fluxo-membros-igreja/download', adminAuth, relatorioCorrecaoFluxoMembrosIgreja);

    // Relatório de correção do acesso restrito ao painel da igreja
    // (18/08/2026): pastores/secretários aprovados pelo caminho legado
    // (sem vínculo qualificado em vinculos_usuario_igreja) eram bloqueados
    // no painel com "Acesso restrito", embora conseguissem aprovar membros
    // pela API. A validação verificarAcessoPainel era mais restrictiva que
    // a permissão real (hook users_cadastro.pb.js tem fallback legado).
    // Corrigido adicionando o mesmo fallback em verificarAcessoPainel e
    // reusando-a no PainelIgrejaCard.
    // Acesso restrito a usuários autenticados (authMiddleware), com log.
    router.get('/relatorio-correcao-acesso-painel-igreja/download', adminAuth, relatorioCorrecaoAcessoPainelIgreja);

    // Relatório de correção do erro 404 ao buscar dados do usuário
    // (18/08/2026): quando um administrador (coleção `admins`) acessava
    // /minha-conta, o SubscriptionAuthContext retornava o registro do admin
    // como currentUser, e a página repassava admin.id para componentes que
    // consultam a coleção `users` (PainelIgrejaCard -> verificarAcessoPainel
    // -> pb.collection('users').getOne), gerando HTTP 404 (id do admin não
    // existe em `users`). Corrigido com guarda que detecta
    // currentUser.collectionName === 'admins' e redireciona para /adm.
    // Acesso restrito a usuários autenticados (authMiddleware), com log.
    router.get('/relatorio-correcao-erro-404-usuario/download', adminAuth, relatorioCorrecaoErro404Usuario);

    // Relatório de correção do erro 404 na página inicial com admin logado
    // (18/08/2026): o Header do SiteLayout (renderizado em todas as páginas
    // públicas, inclusive /) chamava verificarAcessoPainel(currentUser.id)
    // para todo usuário autenticado. Quando um admin (coleção `admins`) estava
    // logado, a função fazia pb.collection('users').getOne(adminId) no
    // fallback legado -> HTTP 404 (id do admin não existe em `users`).
    // Corrigido com guarda que detecta currentUser.collectionName === 'admins'
    // e pula a verificação, não disparando a consulta inválida.
    // Acesso restrito a usuários autenticados (authMiddleware), com log.
    router.get('/relatorio-correcao-erro-404-pagina-inicial/download', adminAuth, relatorioCorrecaoErro404PaginaInicial);

    // Relatório de implementação da proteção global contra erro 404 para
    // admins (18/08/2026): guarda de rota global (useAdminGuard) que
    // redireciona admins para /adm em qualquer rota que não seja /adm/*,
    // impedindo que componentes de rotas públicas/igreja/curso montem e
    // disparem buscas inválidas em `users` (HTTP 404). Solução global e
    // definitiva, com um único ponto de controle.
    // Acesso restrito a usuários autenticados (authMiddleware), com log.
    router.get('/relatorio-implementacao-protecao-global-admin/download', adminAuth, relatorioImplementacaoProtecaoGlobalAdmin);

    // Relatório de correção "membros não aparecem na lista de aprovação do
    // painel da igreja" (18/08/2026): a regra de acesso de
    // vinculos_usuario_igreja filtra por @request.auth.igreja_id
    // (users.igreja_id do pastor), mas o painel resolvia a igreja pelo
    // vínculo ativo; quando users.igreja_id estava defasado, regra + filtro
    // divergiam e a query retornava 0 vínculos (HTTP 200, sem erro).
    // Corrigido com backfill (migração 1787094511) que sincroniza
    // users.igreja_id ao vínculo ativo, e o frontend passou a usar
    // users.igreja_id (= @request.auth.igreja_id) como fonte primária do
    // filtro. Acesso restrito a usuários autenticados (authMiddleware), com log.
    router.get('/relatorio-correcao-membros-nao-aparecem/download', adminAuth, relatorioCorrecaoMembrosNaoAparecem);

    // Relatório de correção "filtro de membros pendentes no painel da
    // igreja" (18/08/2026): a regra de acesso de vinculos_usuario_igreja
    // só liberava o escopo por igreja para users.papel='pastor'|
    // 'secretario'; representantes com users.papel='admin'/'presidente'
    // (mesmo com vínculo ativo de pastor com permissão) eram bloqueados
    // pela regra e viam a lista de aprovação vazia (HTTP 200, sem erro).
    // O filtro frontend (default status='pendente') já estava correto.
    // Corrigido estendendo list/view/updateRule para incluir 'presidente'
    // e 'admin' no branch escopado por igreja (migração 1787098000),
    // alinhando a regra com verificarAcessoPainel e o hook repPodeAprovar.
    // Acesso restrito a usuários autenticados (authMiddleware), com log.
    router.get('/relatorio-correcao-filtro-membros-pendentes/download', adminAuth, relatorioCorrecaoFiltroMembrosPendentes);

    // Relatório de INVESTIGAÇÃO REAL E CORREÇÃO DEFINITIVA "membros pendentes
    // não aparecem na lista de aprovação do painel da igreja" (18/08/2026):
    // investigação com leitura direta do banco PocketBase (data.db) que
    // localizou a causa raiz como divergência de duas fontes de verdade para
    // a igreja do pastor (cache do authStore vs banco fresco da regra de
    // acesso). Correção definitiva: removido o filtro `igreja_id` da query
    // das páginas do Painel da Igreja; o escopo por igreja passa a ser feito
    // EXCLUSIVAMENTE pela regra de acesso server-side (valor fresco do
    // banco), eliminando a divergência. Adicionalmente, /adm/aprovacao-
    // vinculos ganhou filtro "Tipo de vínculo" para admins verem membros.
    // Acesso restrito a usuários autenticados (authMiddleware), com log.
    router.get('/relatorio-investigacao-correcao-membros-pendentes/download', adminAuth, relatorioInvestigacaoCorrecaoMembrosPendentes);

    // Relatório de correção do header do painel mentor (19/08/2026): o
    // header do painel-mentor.html permanecia estático ("Olá, Mentor" /
    // avatar "M") após o login SSO porque não existiam decodificarJWT() e
    // atualizarHeader(), nem menu dropdown ou botão "Sair". Corrigido
    // adicionando a decodificação do payload do JWT ({ pocketbase_id,
    // email, nome, role, destino }) e a atualização do header com o
    // primeiro nome + inicial do avatar, além do dropdown e do botão Sair.
    // Acesso restrito a usuários autenticados (authMiddleware), com log.
    router.get('/relatorio-correcao-header-painel-mentor/download', adminAuth, relatorioCorrecaoHeaderPainelMentor);

    // Download do arquivo único "painel-mentor.html" — painel completo do
    // mentor (HTML + CSS + JS puro, sem frameworks) para ConexãoCursos.
    // Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/adm/painel-mentor-download', adminAuth, painelMentorDownload);

    // Script SQL completo do banco cursos_db (tabelas, índices, constraints,
    // triggers e dados de exemplo) + relatório de alterações correspondente.
    // Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-schema-sql/download', adminAuth, relatorioSchemaSql);
    router.get('/relatorio-schema-sql/relatorio', adminAuth, relatorioSchemaSqlRelatorio);

    // Geração de credencial SSO (JWT HS256, TTL 600s) para o botão
    // "Acessar painel do mentor". Retorna o token + a URL de redirecionamento.
    // Rota protegida por authMiddleware (coleção users).
    router.get('/mentor-sso-token', authMiddleware, mentorSsoToken);

    // SSO da Área do Aluno (espelha o SSO do mentor, mudando apenas o destino
    // para "aluno"). Gera JWT assinado com MENTOR_JWT_SECRET e devolve a URL
    // de redirecionamento para o endpoint /sso da VPS, que por sua vez emite
    // um token interno e redireciona para /painel-aluno?token=...
    // Rota protegida por authMiddleware (coleção users).
    router.get('/aluno-sso', authMiddleware, alunoSso);

    // Moderação de cursos (painel administrativo). Proxy para a API externa
    // de cursos (rotas /admin/cursos) injetando o header x-bridge-secret no
    // backend. Acesso restrito a administradores (adminAuth — coleção admins).
    // Rotas:
    //   GET  /cursos-moderacao/em-analise
    //   POST /cursos-moderacao/:id/aprovar
    //   POST /cursos-moderacao/:id/reprovar
    router.use('/cursos-moderacao', adminAuth, cursosModeracaoRouter);

    // Status dos cursos criados pelo mentor (área do mentor). Proxy para a
    // API externa de cursos filtrando pelo e-mail do mentor autenticado, de
    // forma que o mentor só enxerga os próprios cursos. O segredo
    // x-bridge-secret permanece no backend. Acesso restrito a usuários
    // autenticados (authMiddleware — coleção users).
    // Rotas:
    //   GET    /cursos-mentor-status
    //   DELETE /cursos-mentor-status/:id
    router.use('/cursos-mentor-status', authMiddleware, cursosMentorStatusRouter);

    // Relatório de implementação do Sistema de Aprovação de Cursos (19/08/2026):
    // sistema completo de moderação de cursos no painel administrativo +
    // status de moderação no painel do mentor. Gerado em memória (.txt).
    // Acesso restrito a administradores (adminAuth — coleção admins), pois o
    // download é disparado pela área administrativa (/adm/relatorio-alteracoes).
    // CORREÇÃO (20/08/2026): antes usava authMiddleware (coleção users), o que
    // rejeitava admins autenticados pela coleção admins com 401 Unauthorized.
    router.get('/relatorio-implementacao-sistema-aprovacao-cursos/download', adminAuth, relatorioImplementacaoSistemaAprovacaoCursos);

    // Relatório de CORREÇÃO - ERRO UNAUTHORIZED NA ROTA DE DOWNLOAD DO
    // RELATÓRIO (20/08/2026): a rota /relatorio-implementacao-sistema-
    // aprovacao-cursos/download usava authMiddleware (valida a coleção
    // users), mas é acessada por administradores autenticados pela coleção
    // admins → 401 Unauthorized. Corrigido para adminAuth. Gerado em
    // memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-correcao-erro-unauthorized-relatorio/download', adminAuth, relatorioCorrecaoErroUnauthorizedRelatorio);

    // Geração de credencial SSO (JWT HS256, TTL 600s) para o app
    // "Corações Conectados" (aplicativo de relacionamento). Retorna
    // { token }; o frontend redireciona para
    // https://coracoes.conexaobatista.com.br?token=JWT.
    // Rota protegida por authMiddleware (coleção users).
    router.post('/coracoes-sso-token', authMiddleware, coracoesSsoToken);

    // Relatório de IMPLEMENTAÇÃO - INTEGRAÇÃO COM CORAÇÕES CONECTADOS
    // (20/08/2026): adição dos campos dataNascimento e estadoCivil à coleção
    // users + rota SSO POST /coracoes-sso-token com JWT. Gerado em memória
    // (.txt). Acesso restrito a administradores (adminAuth — coleção admins),
    // pois o download é disparado pela área administrativa
    // (/adm/relatorio-alteracoes).
    // CORREÇÃO (20/08/2026): antes usava authMiddleware (coleção users), o que
    // rejeitava admins autenticados pela coleção admins com 401 Unauthorized.
    router.get('/relatorio-implementacao-integracao-coracoes-conectados/download', adminAuth, relatorioImplementacaoIntegracaoCoracoesConectados);

    // Relatório de CORREÇÃO - ERRO UNAUTHORIZED NA ROTA DE DOWNLOAD DO
    // RELATÓRIO DE INTEGRAÇÃO CORAÇÕES CONECTADOS (20/08/2026): a rota
    // /relatorio-implementacao-integracao-coracoes-conectados/download usava
    // authMiddleware (valida a coleção users), mas é acessada por
    // administradores autenticados pela coleção admins → 401 Unauthorized.
    // Corrigido para adminAuth. Gerado em memória (.txt). Acesso restrito a
    // administradores (adminAuth — coleção admins).
    router.get('/relatorio-correcao-erro-unauthorized-coracoes/download', adminAuth, relatorioCorrecaoErroUnauthorizedCoracoes);

    // Relatório de AJUSTE - BOTÃO CORAÇÕES CONECTADOS MOVIDO PARA A PÁGINA
    // RELACIONAMENTOS (20/08/2026): remoção do botão "Acessar Corações
    // Conectados" da página "Área do Mentor" (MentorBoasVindasPage.jsx) e
    // adição à página "Relacionamentos" (EntryPage.jsx — rota
    // /relacionamentos), mantendo a mesma funcionalidade (POST
    // /coracoes-sso-token + redirecionamento para
    // https://coracoes.conexaobatista.com.br?token=JWT). Gerado em memória
    // (.txt). Acesso restrito a administradores (adminAuth — coleção admins),
    // pois o download é disparado pela área administrativa
    // (/adm/relatorio-alteracoes).
    router.get('/relatorio-ajuste-botao-coracoes-relacionamentos/download', adminAuth, relatorioAjusteBotaoCoracoesRelacionamentos);

    // Relatório de IMPLEMENTAÇÃO - CURSOS CONEXÃO BATISTA (20/08/2026):
    // exibição da avaliação da IA no painel de moderação de cursos + ajustes
    // no cadastro (campo Sexo, filtro de igreja encadeado UF -> Cidade ->
    // Igreja, campo CPF com validação módulo 11 local). Gerado em memória
    // (.txt). Acesso restrito a administradores (adminAuth — coleção
    // admins), pois o download é disparado pela área administrativa
    // (/adm/relatorio-alteracoes).
    router.get('/relatorio-implementacao-cursos-conexao-batista/download', adminAuth, relatorioImplementacaoCursosConexaoBatista);

    // Relatório de LIMPEZA - REMOÇÃO DO CAMPO ANTIGO DE CIDADE (24/08/2026):
    // removido o campo antigo "Cidade" (input de texto para digitar) do
    // formulário de cadastro (SignupPage.jsx) e da página "Minha conta"
    // (MinhaContaPage.jsx), mantendo apenas o novo filtro encadeado
    // (UF -> Cidade -> Igreja) do componente IgrejaFilterFields.jsx. A
    // coluna `cidade` da coleção `users` (PocketBase) NÃO é removida —
    // dados antigos permanecem salvos, apenas deixam de ser editáveis via
    // formulário. Gerado em memória (.txt). Acesso restrito a
    // administradores (adminAuth — coleção admins), pois o download é
    // disparado pela área administrativa (/adm/relatorio-alteracoes).
    router.get('/relatorio-limpeza-campo-cidade-antigo/download', adminAuth, relatorioLimpezaCampoCidadeAntigo);

    // Relatório de IMPLEMENTAÇÃO - LISTA CANÔNICA DE CATEGORIAS (24/08/2026):
    // lista canônica de 34 categorias + endpoint público GET /categorias,
    // migração dos 3 cursos existentes (Bíblia/Discipulado/Liderança →
    // categorias canônicas), remoção do filtro "Nível" do site e substituição
    // das categorias fixas pelas canônicas carregadas dinamicamente. Gerado
    // em memória (.txt). Acesso restrito a administradores (adminAuth —
    // coleção admins), pois o download é disparado pela área administrativa
    // (/adm/relatorio-alteracoes).
    router.get('/relatorio-lista-canonica-categorias/download', adminAuth, relatorioListaCanonicaCategorias);

    // Relatório de CORREÇÃO - PÁGINA DE CURSOS (/curso/cursos) com categorias
    // dinâmicas e remoção do filtro Nível (24/08/2026). Gerado em memória
    // (.txt). Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-correcao-pagina-cursos/download', adminAuth, relatorioCorrecaoPaginaCursos);

    // Relatório de CORREÇÃO - SEÇÃO CURSOS EM DESTAQUE COM DADOS REAIS
    // (24/08/2026): substituição do conteúdo fictício/mock da seção
    // "Cursos em destaque - Comece a aprender hoje" da home da plataforma de
    // cursos (CursoHomePage.jsx) por cursos reais do banco via
    // GET /cursos-publicados, mantendo título, layout e estilos. Gerado em
    // memória (.txt). Acesso restrito a administradores (adminAuth — coleção
    // admins), pois o download é disparado pela área administrativa
    // (/adm/relatorio-alteracoes).
    router.get('/relatorio-correcao-cursos-destaque/download', adminAuth, relatorioCorrecaoCursosDestaque);

    // Relatório de REDESIGN - PÁGINAS DE DETALHES DE CURSOS (25/08/2026):
    // adaptação visual das páginas de cursos com estrutura profissional e
    // educacional (banner, breadcrumb, título destacado, resumo rápido em
    // sidebar, abas "Sobre o curso" / "Matriz curricular" e chamada visual
    // para inscrição), preservando a identidade visual do Conexão Batista e
    // SEM alterar backend, APIs, autenticação, SSO, regras de matrícula,
    // integração com Mentor nem fluxos existentes. Gerado em memória (.txt).
    // Acesso restrito a administradores (adminAuth — coleção admins), pois o
    // download é disparado pela área administrativa (/adm/relatorio-alteracoes).
    router.get('/relatorio-redesign-paginas-cursos/download', adminAuth, relatorioRedesignPaginasCursos);

    // Relatório de ATUALIZAÇÃO - CONTEÚDO DO BLOCO 02 VALIDE SUA MEMBRESIA
    // (25/08/2026): substituição do texto explicativo do bloco "02 — Valide
    // sua membresia" da página "Como participar" (JoinPage.jsx) por duas
    // opções de validação (Validação pela igreja / Apadrinhamento),
    // mantendo o título, o layout, o padrão visual, a tipografia e a
    // hierarquia. Gerado em memória (.txt). Acesso restrito a
    // administradores (adminAuth — coleção admins), pois o download é
    // disparado pela área administrativa (/adm/relatorio-alteracoes).
    router.get('/relatorio-atualizacao-bloco-02-valide-membresia/download', adminAuth, relatorioAtualizacaoBloco02ValideMembresia);

    // Relatório de CORREÇÕES - PORTAL PÚBLICO DOS CURSOS (25/08/2026): cinco
    // correções da camada de apresentação do portal público "Cursos Conexão
    // Batista" para consumir os dados da API corretamente — miniatura
    // clicável, página de detalhes com dados reais (descrição, matriz
    // curricular, mentor, preço) via novo proxy GET /cursos-publicados/:id,
    // fluxo de inscrição condicional (gratuito/pago), área do aluno com
    // autenticação real (PocketBase) e consistência de preço em todos os
    // pontos. Gerado em memória (.txt). Acesso restrito a administradores
    // (adminAuth — coleção admins), pois o download é disparado pela área
    // administrativa (/adm/relatorio-alteracoes).
    router.get('/relatorio-correcoes-portal-publico/download', adminAuth, relatorioCorrecoesPortalPublico);

    // Relatório de CORREÇÕES PENDENTES - PORTAL PÚBLICO (26/08/2026): duas
    // correções pendentes — mapeamento robusto de campos opcionais
    // (objetivos/público-alvo/pré-requisitos) e botão "Inscrever-se" com a
    // causa raiz resolvida (CURSOS_API_URL apontando para domínio funcional)
    // mais tratamento de erro específico. Gerado em memória (.txt). Acesso
    // restrito a administradores (adminAuth — coleção admins), pois o
    // download é disparado pela área administrativa
    // (/adm/relatorio-alteracoes).
    router.get('/relatorio-correcoes-pendentes-portal/download', adminAuth, relatorioCorrecoesPendentesPortal);

    // Relatório de CORREÇÃO CRÍTICA - CURSOS CONEXÃO BATISTA (26/08/2026):
    // cinco correções críticas — URL da API (fallbacks do IP morto
    // atualizados para o domínio funcional), paths sem prefixo /api
    // (confirmado já corretos), dados reais (campos ausentes na API
    // externa confirmados; placeholders corretos), fluxo de inscrição
    // (URL de redirecionamento corrigida) e limpeza total (remoção de
    // todas as referências ao IP morto do código funcional). Gerado em
    // memória (.txt). Acesso restrito a administradores (adminAuth —
    // coleção admins), pois o download é disparado pela área administrativa
    // (/adm/relatorio-alteracoes).
    router.get('/relatorio-correcao-critica-api/download', adminAuth, relatorioCorrecaoCriticaApi);

    // Relatório de CORREÇÃO - LINK DO PAINEL DO MENTOR (26/08/2026): o link
    // "Acessar painel do mentor" deixou de gerar o token JWT e redirecionava
    // para URL direta (https://cursos.conexaobatista.com.br/). Corrigido para
    // restaurar a geração do JWT (HS256, TTL 600s) e o redirecionamento via
    // GET com o token na query string
    // (https://api.conexaobatista.com.br/painel?token=<JWT>). Gerado em
    // memória (.txt). Acesso restrito a administradores (adminAuth — coleção
    // admins), pois o download é disparado pela área administrativa
    // (/adm/relatorio-alteracoes).
    router.get('/relatorio-correcao-link-painel-mentor/download', adminAuth, relatorioCorrecaoLinkPainelMentor);

    // Relatório de CORREÇÃO - FLUXO DE INSCRIÇÃO DO ALUNO (30/08/2026): o
    // curso matriculado não aparecia em "Meus Cursos" do painel-aluno da VPS.
    // Investigação com probes diretos localizou a causa raiz — a VPS cria a
    // matrícula como efeito colateral de GET /cursos/:id/token, e o backend
    // nunca chamava esse endpoint. Corrigido cursos-matricula.js para criar a
    // matrícula na VPS (passo 4) antes do registro local; bridge-login
    // tornou-se obrigatório; frontend passou a verificar persistência.
    // Gerado em memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-correcao-fluxo-inscricao-aluno/download', adminAuth, relatorioCorrecaoFluxoInscricaoAluno);

    // Relatório de SINCRONIZAÇÃO DE USUÁRIO NA MATRÍCULA (30/08/2026):
    // sincronização do usuário PocketBase com a VPS (ensure + bridge-login)
    // antes da matrícula, garantindo o identificador correto e a consistência
    // com o SSO (mesmo pocketbase_id → mesmo id VPS). Gerado em memória (.txt).
    // Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-sincronizacao-usuario-matricula/download', adminAuth, relatorioSincronizacaoUsuarioMatricula);

    // Relatório de VERIFICAÇÃO DE PERSISTÊNCIA DE MATRÍCULA (30/08/2026):
    // verificação de que a matrícula foi persistida na VPS antes do SSO —
    // backend (objeto matricula + checagem /aluno/cursos) e frontend
    // (confirmação explícita, não assumindo 200 = sucesso). Idempotência
    // confirmada. Gerado em memória (.txt). Acesso restrito a administradores.
    router.get('/relatorio-verificacao-persistencia-matricula/download', adminAuth, relatorioVerificacaoPersistenciaMatricula);

    // Relatório de TRATAMENTO DE ERROS DE MATRÍCULA E SSO (30/08/2026):
    // tratamento separado para erros de matrícula e erros de SSO, com
    // mensagens distintas e claras em PT-BR, no backend (throw → middleware)
    // e no frontend (dois blocos try/catch separados). Gerado em memória
    // (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-tratamento-erros-matricula-sso/download', adminAuth, relatorioTratamentoErrosMatriculaSso);

    // Relatório de IMPLEMENTAÇÃO - NOVA PÁGINA DE CURSOS COM LEITOR DE PDF
    // (31/08/2026): nova página CursoAulaPage.jsx com leitor de PDF integrado
    // (pdf.js, uma página por vez em canvas), controles Anterior/Próxima,
    // indicador "Página X de Y", botão de download, responsivo, mantendo o
    // padrão visual do site. Botão "Abrir aula (PDF)" adicionado em
    // MeusCursosPage; rota /curso/:id/aula registrada. Sem alterações no
    // backend, SSO, autenticação ou permissões. Gerado em memória (.txt).
    // Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-implementacao-pagina-cursos-pdf/download', adminAuth, relatorioImplementacaoPaginaCursosPdf);

    // Relatório de VALIDAÇÃO DA INTEGRAÇÃO Frontend ↔ VPS (31/08/2026):
    // auditoria completa dos endpoints da VPS (probes reais), mapeamento
    // proxy Express ↔ endpoint VPS, validação do fluxo ponta a ponta
    // (Login → Cursos → Matrícula → Painel → PDF) e decisão arquitetural
    // de NÃO adotar cliente direto navegador→VPS (vpsService.js) por violar
    // as restrições do requisito e depender de endpoints inexistentes
    // (/auth/me → 404, /cursos/:id/matricula → 404). Gerado em memória
    // (.txt). Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-validacao-integracao-vps/download', adminAuth, relatorioValidacaoIntegracaoVps);

    // Relatório de VALIDAÇÃO PONTA A PONTA com dados reais (31/08/2026):
    // validação completa Matrícula → SSO → Meus Cursos → PDF usando dados
    // reais (Aluno Rony Garcia, Curso 29, matrícula local qjdz95atdk8i6e3).
    // Tabela de 28 testes com APROVADO/FALHOU/NÃO EXECUTADO + evidências
    // observadas (leitura direta PB, probes VPS, auditoria de código).
    // Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-validacao-ponta-a-ponta/download', adminAuth, relatorioValidacaoPontaAPonta);

    // Relatório de INVESTIGAÇÃO: ausência de PDF na resposta da API
    // (31/08/2026). Investigação comparativa painel ↔ API ↔ mapeamento
    // frontend ↔ componente sobre por que o PDF não aparece para o Curso 29.
    // Classifica 13 hipóteses como CONFIRMADA/NÃO CONFIRMADA com evidências
    // (probe real VPS, auditoria de código, schema PocketBase). Sem alterar
    // código/VPS. Acesso restrito a administradores (adminAuth — admins).
    router.get('/relatorio-investigacao-ausencia-pdf/download', adminAuth, relatorioInvestigacaoAusenciaPdf);

    // Relatório FINAL DE INVESTIGAÇÃO — Auditoria VPS Completa
    // (31/08/2026 19:30 Brasília): investigação completa de Matrícula, PDF,
    // SSO e Sincronização de Dados (Curso 29, Matrícula 133, Rony Garcia).
    // Confirma persistência/sincronização da matrícula, funcionamento do
    // SSO e fonte oficial do PDF (aulas.material_pdf_url); identifica a
    // ausência de PDF no Curso 29 (mentor não fez upload). Sem alterar
    // código/VPS, sem expor tokens. Gerado em memória (.txt). Acesso
    // restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-investigacao-final-vps/download', adminAuth, relatorioInvestigacaoFinalVps);

    // Relatório de CORREÇÃO DO FRONTEND — Consumo de aulas.material_pdf_url
    // (31/08/2026): CursoAulaPage.jsx corrigido para consumir o campo OFICIAL
    // do PDF (aulas.material_pdf_url) via proxy autenticado /cursos/:id/aulas,
    // removendo fallbacks para video_url/pdf_url e tratando a ausência de PDF.
    // Sem alterar matrícula, SSO, autenticação, permissões ou backend VPS.
    // Gerado em memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-correcao-frontend-material-pdf/download', adminAuth, relatorioCorrecaoFrontendMaterialPdf);

    // Relatório de AJUSTE DO PAINEL DO ALUNO — Renderização Condicional de
    // Mídia (Vídeo/Imagem/PDF) (31/08/2026): CursoAulaPage.jsx ajustado para
    // renderizar condicionalmente a mídia principal da aula (vídeo YouTube →
    // imagem → leitor PDF → mensagem "Material indisponível"), com leitor PDF
    // integrado no espaço principal (sem duplicidade), contador "Página X de
    // Y", navegação anterior/próxima com limites, sem download automático e
    // botão "Baixar PDF" separado (href direto, target=_blank, só quando há
    // PDF). Sem alterar matrícula, SSO, autenticação, permissões ou VPS.
    // Gerado em memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-ajuste-painel-aluno-midia/download', adminAuth, relatorioAjustePainelAlunoMidia);

    // Relatório de INTEGRAÇÃO DO NOVO PAINEL DO ALUNO NO SITE
    // (31/08/2026): integração do novo frontend do painel do aluno
    // (CursoAulaPage.jsx com leitor de PDF integrado) como destino principal
    // da área do aluno no site, substituindo o redirecionamento SSO para o
    // painel antigo da VPS. Botões "Área do aluno", "Abrir painel do aluno",
    // "Acessar curso" e inscrição gratuita agora levam ao novo painel
    // integrado (lista de cursos + leitor PDF). Sem alterar backend VPS,
    // autenticação, matrículas, permissões ou tokens. Gerado em memória
    // (.txt). Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-integracao-novo-painel-aluno/download', adminAuth, relatorioIntegracaoNovoPainelAluno);

    // Relatório de CORREÇÃO DA PASSAGEM DE SESSÃO SSO (31/08/2026): o proxy
    // /cursos/:id/aulas usava o token de curso (de /cursos/:id/token) em vez
    // do token de sessão (bridge-login) para chamar /aluno/cursos/:id/aulas
    // na VPS, que retornava 401/403 e o frontend exibia "Sua sessão
    // expirou". Corrigido para usar o token de sessão em um único passo.
    // Além disso, o token de sessão da VPS passou a ser mantido apenas em
    // memória (não em localStorage) e a expiração redireciona ao login.
    // Probe real confirmado (Rony Garcia, curso 29). Gerado em memória
    // (.txt). Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-correcao-sessao-sso/download', adminAuth, relatorioCorrecaoSessaoSso);

    // Relatório de OTIMIZAÇÃO DE LAYOUT DA TELA DE APRENDIZAGEM
    // (31/08/2026): otimização de layout (apenas CSS/Tailwind) da página
    // CursoAulaPage.jsx para melhor legibilidade em desktop — conteúdo
    // principal ampliado (~80% da largura), margens reduzidas, título,
    // apresentação, leitor PDF e controles ampliados, coluna lateral
    // (aulas) estreitada, responsividade em celular mantida. Sem alterar
    // textos, dados, rotas, SSO, matrículas, lógica do leitor ou VPS.
    // Gerado em memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-otimizacao-layout-aula/download', adminAuth, relatorioOtimizacaoLayoutAula);

    // Relatório de CORREÇÃO DE FALHAS FUNCIONAIS DA TELA DE AULA
    // (31/08/2026): corrige duas falhas — (1) leitor PDF não carregava arquivo
    // autenticado (agora via proxy GET /cursos/:id/aulas/:aulaId/pdf → blob →
    // pdf.js, sem CORS/URL simulada) e (2) controles "Voltar"/"Avançar"
    // ficavam cortados em celular (min-height agora responsivo 360/480/640px).
    // Botão "Baixar PDF" separado mantido. VPS, SSO, matrículas e permissões
    // intactos. Gerado em memória (.txt). Acesso restrito a administradores
    // (adminAuth — coleção admins).
    router.get('/relatorio-correcao-falhas-tela-aula/download', adminAuth, relatorioCorrecaoFalhasTelaAula);

    // Relatório de MELHORIA DA EXPERIÊNCIA DA TELA DE AULAS (31/08/2026):
    // cabeçalho compacto (nome + duração), informações do curso em seção menor
    // (categoria, área, autor, data), leitor PDF maximizado (ocupa a área
    // central), prova integrada (última aula → "Fazer prova"; prova na
    // sidebar com estado Pendente/Concluída) e nova página da prova
    // (/curso/:id/prova/:provaId). Renderização condicional de mídia mantida.
    // VPS, API, SSO, matrículas, permissões e dados reais intactos. Gerado em
    // memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-melhoria-experiencia-tela-aulas/download', adminAuth, relatorioMelhoriaExperienciaTelaAulas);

    // Relatório de REDUÇÃO DE ALTURA DO CABEÇALHO DA TELA DE AULA
    // (31/08/2026): reduz significativamente a altura vertical do cabeçalho
    // da página CursoAulaPage.jsx, tornando-o realmente compacto — padding
    // vertical reduzido (py-5 → py-1.5), título + duração + link "Meus
    // cursos" na mesma linha (flex items-baseline), fontes reduzidas (título
    // text-lg/sm:text-xl, duração text-xs, info text-[11px]) e linha de
    // informações compacta (mt-0.5, gap-x-3). Altura final ~60-80px. Sem
    // alterar layout, conteúdo, rotas, SSO, responsividade, coluna lateral
    // ou leitor de PDF. Gerado em memória (.txt). Acesso restrito a
    // administradores (adminAuth — coleção admins).
    router.get('/relatorio-reducao-altura-cabecalho-aula/download', adminAuth, relatorioReducaoAlturaCabecalhoAula);

    // Relatório de INVESTIGAÇÃO E IMPLEMENTAÇÃO — PROVAS POR ETAPA
    // (01/09/2026): investigação real da estrutura de provas/etapas no
    // backend VPS (Curso 29, Rony Garcia) + implementação da associação
    // dinâmica prova↔aula no proxy (provas_por_aula) e no frontend (prova
    // exibida após a aula correspondente, estado Pendente/Concluída). A VPS
    // atual NÃO possui sistema de provas (endpoint /aluno/cursos/:id/prova
    // 404; aulas sem campos de prova) — nenhum dado simulado; o frontend
    // fica pronto para quando a VPS passar a devolver provas por aula.
    // Gerado em memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-investigacao-provas-etapa/download', adminAuth, relatorioInvestigacaoProvasEtapa);

    // Relatório de APLICAÇÃO DE DUAS ALTERAÇÕES NO FRONTEND (01/09/2026):
    // (1) Prova em Matriz Curricular — investigação real confirmou que a VPS
    //   não possui sistema de provas (Curso 29: /aluno/cursos/:id/prova 404,
    //   aulas sem campos de prova); painel-mentor.html vive na VPS (fora do
    //   sandbox) e não pode ser editado daqui; o painel do aluno já exibe a
    //   prova vinculada (Pendente/Concluída) com dados reais quando a VPS os
    //   devolver. (2) Layout PDF corrigido — container do canvas de min-h
    //   (empurrava controles fora da viewport) para max-h com overflow-auto
    //   (rolagem interna, controles sempre visíveis, proporção preservada,
    //   botão "Baixar PDF" separado). Gerado em memória (.txt). Acesso
    //   restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-aplicacao-duas-alteracoes-frontend/download', adminAuth, relatorioAplicacaoDuasAlteracoesFrontend);

    // Relatório de CORREÇÃO DE DOIS PROBLEMAS NO FRONTEND (01/09/2026):
    // (1) Leitor de PDF passa a usar 100% da largura útil disponível
    //   (canvas width:100% + height:auto, padding reduzido, justify-start),
    //   preservando proporção e rolagem interna, sem espaço vazio nas laterais.
    // (2) Ação "Prova" visível no painel do mentor (CursoMentorCursosPage)
    //   ao lado de "Excluir curso" — botão clicável que abre a prova real do
    //   curso (CursoProvaPage consulta a VPS via proxy GET /cursos/:id/prova).
    //   Sem dados simulados; sem transformar prova em etapa; proteção mantida.
    // Gerado em memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-correcao-dois-problemas-frontend/download', adminAuth, relatorioCorrecaoDoisProblemasFrontend);

    // Download do RELATÓRIO DE CORREÇÃO DO LEITOR DE PDF — documento ocupa
    //   100% da largura útil da área principal (wrapper sem padding/borda/
    //   moldura, card sem padding lateral, canvas block h-auto w-full),
    //   proporção preservada, rolagem interna mantida e espaço real para
    //   controles e botão Baixar PDF. Sem sobreposição, corte ou auto-download.
    // Gerado em memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-correcao-leitor-pdf-largura/download', adminAuth, relatorioCorrecaoLeitorPdfLargura);

    // Download do RELATÓRIO DE INVESTIGAÇÃO DA ESTRUTURA REAL DA API —
    // Endpoints e Campos para Conclusão de Etapa (01/09/2026). Investigação
    // real (Curso 29, Rony Garcia) de todos os endpoints de progresso/conclusão
    // da VPS. Conclusão: a VPS NÃO possui sistema de progresso/conclusão de
    // aulas — nenhum campo de conclusão na resposta de aulas e TODOS os
    // endpoints candidatos (GET/POST/PATCH/PUT) retornam 404. Sem dados
    // simulados. Gerado em memória (.txt). Acesso restrito a administradores
    // (adminAuth — coleção admins).
    router.get('/relatorio-investigacao-estrutura-api-conclusao-etapa/download', adminAuth, relatorioInvestigacaoEstruturaApiConclusaoEtapa);

    // Download do RELATÓRIO DE CORREÇÃO DA AUTENTICAÇÃO DO PAINEL DO ALUNO
    // (01/09/2026): corrigida APENAS a autenticação do painel do aluno no
    // frontend — leitura do token SSO recebido na URL, armazenamento para a
    // sessão atual (sessionStorage, NÃO localStorage), remoção do token da
    // barra de endereço e envio do token em todas as requisições reais a
    // /aluno/cursos/:id/aulas (header x-cursos-token -> backend repassa como
    // Authorization: Bearer para a VPS). Tratamento de 401/403 sem
    // redirecionar incorretamente para /login. Registra também o que NÃO foi
    // feito nas últimas alterações. Gerado em memória (.txt). Acesso
    // restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-correcao-autenticacao-painel-aluno/download', adminAuth, relatorioCorrecaoAutenticacaoPainelAluno);

    // Download do RELATÓRIO DE CORREÇÃO DO AVANÇO DA TELA DE APRENDIZAGEM —
    // Curso Livre Secretariado (Curso 29). Investigação real do fluxo
    // "Concluir etapa -> Próxima -> Fazer prova" contra a VPS (bridge-login +
    // GET /aluno/cursos/29/aulas + varredura de endpoints de conclusão/
    // progresso/prova com token válido). CONCLUSÃO: IMPEDIMENTO — a VPS não
    // possui mecanismo de conclusão de etapa (aulas sem campos de conclusão;
    // todos os endpoints de conclusão/progresso/prova retornam 404 mesmo com
    // token válido). Nenhum endpoint criado, nenhum dado simulado, nenhum
    // armazenamento alternativo; autenticação/SSO/matriculas/permissões/VPS/
    // visual intactos. O avanço NÃO é declarado corrigido. Gerado em memória
    // (.txt). Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-correcao-avanco-tela-aprendizagem-secretariado/download', adminAuth, relatorioCorrecaoAvancoTelaAprendizagemSecretariado);

    // Download do RELATÓRIO DE INVESTIGAÇÃO DO FLUXO "ACESSAR PAINEL DO
    // MENTOR" (01/09/2026): investigação exclusiva do fluxo disparado pelo
    // botão "Acessar painel do mentor" em /curso/boas-vindas. Identifica a
    // requisição real (frontend getMentorSsoToken -> GET /mentor-sso-token ->
    // backend POST /auth/bridge-login na VPS -> redirectUrl /painel?token=),
    // valida que a credencial temporária de 10 minutos NÃO está sendo gerada
    // (VPS /auth/bridge-login retorna 502) e localiza a camada responsável
    // pela falha: SERVIÇO EXTERNO INDISPONÍVEL (VPS api.conexaobatista.com.br,
    // 69.62.124.240 — TODOS os endpoints retornam 502 Bad Gateway; DNS íntegro).
    // Encaminhamento do frontend e rota do backend estão CORRETOS e intactos;
    // nenhuma correção de encaminhamento aplicada (a falha não está no
    // frontend). Não cria endpoints, não simula credenciais, não altera painel
    // do aluno, SSO, matrículas, etapas, permissões ou visual. Gerado em
    // memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-investigacao-fluxo-painel-mentor/download', adminAuth, relatorioInvestigacaoFluxoPainelMentor);

    // Download do RELATÓRIO DE CORREÇÃO DA NAVEGAÇÃO DO PAINEL DO ALUNO —
    // Curso 29 (02/09/2026): investigação real que descobriu o sistema de
    // conclusão/progresso novo da VPS (POST .../concluir, campos
    // concluida/concluida_em, GET .../progresso), implementou o avanço real
    // entre aulas (proxy + botões Aula anterior/Concluir e avançar) e
    // documentou o IMPEDIMENTO de provas entre etapas (VPS sem sistema de
    // provas — endpoints 404; nenhum dado simulado). Gerado em memória (.txt).
    // Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-correcao-navegacao-painel-aluno-curso29/download', adminAuth, relatorioCorrecaoNavegacaoPainelAlunoCurso29);

    // Download do RELATÓRIO DE CORREÇÃO GENÉRICA DA NAVEGAÇÃO DO PAINEL DO
    // ALUNO (02/09/2026): navegação por etapas/prova reutilizável para
    // qualquer curso (sem IDs/nomes fixos). Remove o botão inferior "Concluir
    // e avançar", unifica a navegação no botão "Próxima" (páginas + regra de
    // prova/avanço), localiza e abre a prova real pelo vínculo
    // prova.etapa_id===aula.id (via /mentor/cursos/:id/provas) e documenta o
    // IMPEDIMENTO de envio/resultado (VPS sem endpoints de prova para aluno).
    // Gerado em memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-correcao-navegacao-generica-painel-aluno/download', adminAuth, relatorioCorrecaoNavegacaoGenericaPainelAluno);

    // Download do RELATÓRIO DE ALTERAÇÃO DO FLUXO DE LOGIN (BRIDGE-LOGIN)
    // (03/09/2026): o frontend passou a chamar DIRETAMENTE o endpoint público
    // https://api.conexaobatista.com.br/api/bridge-login, sem o header
    // x-bridge-secret, sem CURSOS_API_BRIDGE_SECRET e sem o token PocketBase,
    // com body exatamente { pocketbase_id, email, nome, mentor_status }. URL
    // final confirmada sem duplicação /api/api/bridge-login. Backend, SSO de
    // aluno, login de mentor e demais endpoints NÃO foram alterados. Gerado em
    // memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-alteracao-fluxo-login-bridge/download', adminAuth, relatorioAlteracaoFluxoLoginBridge);

    // Download do RELATÓRIO DE REVERSÃO DO FLUXO DE LOGIN (BRIDGE-LOGIN)
    // (03/09/2026): o frontend voltou a chamar o PROXY EXPRESS
    // /cursos/bridge-login (via apiServerClient.fetch), enviando SOMENTE o
    // token PocketBase no header Authorization (Bearer). O segredo
    // (x-bridge-secret / CURSOS_API_BRIDGE_SECRET) permanece no backend
    // (cursos-sso.js), que valida o usuário (authMiddleware) e adiciona o
    // segredo internamente. Nenhum segredo trafega pelo navegador. Gerado em
    // memória (.txt). Acesso restrito a administradores (adminAuth).
    router.get('/relatorio-reversao-fluxo-login-bridge/download', adminAuth, relatorioReversaoFluxoLoginBridge);

    // Download do relatório de auditoria da variável de ambiente da API da VPS.
    // Valores sensíveis não são incluídos; a rota registra também quando a
    // ocorrência singular solicitada não existe na configuração real.
    router.get('/relatorio-correcao-variavel-api-vps/download', adminAuth, relatorioCorrecaoVariavelApiVps);

    // Auditoria somente leitura dos fluxos de login e SSO, com URLs públicas
    // e endpoints identificados sem expor segredos, tokens ou credenciais.
    router.get('/relatorio-auditoria-fluxos-login/download', adminAuth, relatorioAuditoriaFluxosLogin);

    // Diagnóstico do segredo CURSOS_API_BRIDGE_SECRET usado no fluxo
    // bridge-login. Executa requisições reais contra a VPS a partir do runtime
    // autorizado, compara o segredo do projeto com o esperado pela VPS (403
    // quando ausente/incorreto; aceito quando correto) e registra status HTTP,
    // headers sem valores sensíveis e body mascarado. NUNCA expõe o segredo
    // completo. Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-diagnostico-bridge-secret/download', adminAuth, relatorioDiagnosticoBridgeSecret);

    // Download do RELATÓRIO DE CORREÇÃO DA RENDERIZAÇÃO DE VÍDEOS DO YOUTUBE
    // (07/09/2026): correção SOMENTE no frontend (CursoAulaPage.jsx) para
    // renderizar vídeos do YouTube das aulas. O frontend passou a ler o campo
    // `youtube_id` da VPS (ID puro ou URL completa), extrair o ID de vários
    // formatos (watch, youtu.be, embed, shorts, com parâmetros extras),
    // montar a URL de embed e renderizar um <iframe> responsivo 16:9.
    // Adicionado fallback de "Vídeo indisponível" para valores inválidos/
    // ausentes e preservada a renderização de vídeo direto, imagem, PDF e
    // aulas sem material. Não altera backend, banco, permissões, matrícula,
    // autenticação, SSO ou endpoints. Gerado em memória (.txt). Acesso
    // restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-correcao-renderizacao-youtube/download', adminAuth, relatorioCorrecaoRenderizacaoYoutube);

    // Relatório da correção geral do frontend do portal de cursos: seleção de
    // mídia orientada pelo campo `tipo` da aula (slide | video | imagem | pdf),
    // com subtipo video_type (youtube | upload) só quando tipo=video; presença
    // isolada de youtube_id/video_url/video_type NÃO classifica mais como
    // YouTube. Renderização de slides (deck PDF em conteudo_url via pdf.js),
    // vídeo upload (Cloudinary) e imagem (conteudo_url). Provas posicionadas
    // pela configuração real do mentor (etapa_id === aula.id), sem regra fixa.
    // Genérico para todos os cursos; curso 29 apenas como caso de teste. Não
    // altera backend, banco, permissões, matrícula, autenticação, SSO ou
    // endpoints. Gerado em memória (.txt). Acesso restrito a administradores
    // (adminAuth — coleção admins).
    router.get('/relatorio-correcao-frontend-tipos-midia/download', adminAuth, relatorioCorrecaoFrontendTiposMidia);

    // Relatório de correção 01 — normalização segura de URLs de slides
    // (erro url.startsWith is not a function). Gerado em memória (.txt).
    // Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-correcao-01-urls-slides/download', adminAuth, relatorioCorrecao01UrlsSlides);
    router.get('/relatorio-correcao-02-urls-slides/download', adminAuth, relatorioCorrecao02UrlsSlides);
    // Relatório de correção 03 — mensagem falsa "Material de slides indisponível"
    // em aulas do tipo slide cujo PDF carrega corretamente. Gerado em memória (.txt).
    // Acesso restrito a administradores (adminAuth — coleção admins).
    router.get('/relatorio-correcao-03-mensagem-falsa-slides/download', adminAuth, relatorioCorrecao03MensagemFalsaSlides);

    // Endpoint PÚBLICO que retorna a lista canônica de 34 categorias dos
    // cursos. Usado pelo filtro da área pública /cursos (sem autenticação).
    router.get('/categorias', categorias);

    // Proxy PÚBLICO de listagem de cursos publicados (status='publicado')
    // da API externa de cursos (VPS). Normaliza nomes antigos de categoria
    // para os canônicos e aplica filtro opcional ?categoria=. Usado pela
    // área pública /cursos (sem autenticação; evita mixed content HTTP).
    router.get('/cursos-publicados', cursosPublicados);

    // Proxy PÚBLICO de detalhe de um curso publicado (status='publicado') da
    // API externa de cursos (VPS). Retorna os campos completos do curso
    // (descrição, matriz curricular, mentor_nome, preço, carga horária).
    // Usado pela página de detalhes /curso/:id (sem autenticação).
    router.get('/cursos-publicados/:id', cursoPublicoDetalhe);

    router.use('/ecommerce/subscriptions', authMiddleware, subscriptionsRouter);

    return router;
};

