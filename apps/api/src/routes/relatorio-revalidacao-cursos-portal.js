// Relatório de CORREÇÃO — Revalidação de cursos do portal + remoção do item
// "Meus Cursos (Mentor)" do menu e das rotas do frontend.
// GET /relatorio-revalidacao-cursos-portal/download
//
// Documenta duas correções EXCLUSIVAS no frontend do portal de cursos:
//
//   (1) Remoção completa do item "Meus Cursos (Mentor)" do menu (cabeçalho
//       desktop + mobile e rodapé) e da rota /curso/mentor-cursos no React
//       (App.jsx) — para alunos E mentores. O Painel do Mentor já funciona
//       separadamente na VPS (acessível pelo link "Área do mentor", que faz
//       SSO para a VPS); o painel NÃO foi recriado e a URL da VPS NÃO foi
//       alterada.
//
//   (2) Revalidação da lista de "Meus Cursos" pela API real: ao abrir
//       "Área do Aluno" ou "Meus Cursos", cada matrícula (PocketBase) é
//       conferida contra GET /cursos-publicados/:id. Cursos que retornarem
//       404 ("Curso não encontrado ou não publicado") — excluídos,
//       inexistentes ou não publicados — são removidos do estado local/cache
//       (lista exibida + registro de matrícula local stale). Cursos válidos,
//       matrículas e progresso são preservados. Falhas transitórias (rede/5xx)
//       NÃO removem o curso.
//
// Preserva: autenticação, SSO, backend, API da VPS, cursos, matrículas,
// progresso, provas, leitor de PDF/vídeos/slides, layout, schema, permissões
// e publicação. Gerado em memória (.txt). Acesso restrito a administradores
// (adminAuth — coleção admins). Não expõe segredos, tokens ou credenciais.

import logger from '../utils/logger.js';

function montarRelatorio() {
  const dataHora = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  return [
    '================================================================================',
    'RELATÓRIO DE CORREÇÃO — REVALIDAÇÃO DE CURSOS DO PORTAL',
    'Remoção do item "Meus Cursos (Mentor)" + revalidação da lista pela API real',
    '================================================================================',
    '',
    `Data/hora da geração (Brasília): ${dataHora}`,
    '',
    '--------------------------------------------------------------------------------',
    '1. RESUMO EXECUTIVO',
    '--------------------------------------------------------------------------------',
    'SINTOMA 1: o menu da plataforma de cursos exibia o item "Meus Cursos (Mentor)"',
    '          (/curso/mentor-cursos) — uma área duplicada do Painel do Mentor,',
    '          que já funciona separadamente na VPS via SSO.',
    '',
    'SINTOMA 2: ao abrir "Área do Aluno" ou "Meus Cursos", a lista podia exibir',
    '          cursos excluídos, inexistentes ou não publicados (matrículas',
    '          locais stale no PocketBase cujo curso deixou de existir/ser',
    '          publicado na VPS), gerando "Curso não encontrado ou não',
    '          publicado" ao tentar abri-los.',
    '',
    'CORREÇÕES APLICADAS (exclusivamente no frontend do portal):',
    '  (1) O item "Meus Cursos (Mentor)" foi REMOVIDO COMPLETAMENTE do menu',
    '      (cabeçalho desktop + mobile e rodapé) e da rota /curso/mentor-cursos',
    '      no React (App.jsx) — para alunos E mentores. O Painel do Mentor NÃO',
    '      foi recriado e a URL da VPS NÃO foi alterada; o acesso ao painel da',
    '      VPS permanece pelo link "Área do mentor" (SSO).',
    '  (2) getMeusCursos() agora REVALIDA cada matrícula contra a API real',
    '      (GET /cursos-publicados/:id). Cursos que retornarem 404 são',
    '      removidos do estado local/cache (lista exibida + registro de',
    '      matrícula local stale). Cursos válidos, matrículas e progresso são',
    '      preservados. Falhas transitórias (rede/5xx) NÃO removem o curso.',
    '',
    '--------------------------------------------------------------------------------',
    '2. COMPONENTES E ESTADOS AJUSTADOS',
    '--------------------------------------------------------------------------------',
    'ARQUIVO 1: apps/web/src/components/curso/CursoLayout.jsx',
    '  * Removido do array navItems o item:',
    '      { to: "/curso/mentor-cursos", label: "Meus Cursos (Mentor)",',
    '        icon: FolderCheck, mentorOnly: true }',
    '  * Removido o import não utilizado de FolderCheck (lucide-react).',
    '  * O link "Área do mentor" (/curso/boas-vindas, mentorOnly) permanece —',
    '    é a entrada SSO para o Painel do Mentor na VPS, visível somente para',
    '    mentores aprovados (users.mentor_status === "aprovado").',
    '  * ESTADOS AJUSTADOS: navItems (array de navegação); itensVisiveis',
    '    (cabeçalho desktop, menu mobile e rodapé) — não incluem mais o item',
    '    removido para nenhum usuário (aluno ou mentor).',
    '  * Comentário do módulo atualizado para registrar a remoção.',
    '',
    'ARQUIVO 2: apps/web/src/App.jsx',
    '  * Removido o import de CursoMentorCursosPage.',
    '  * Removida a rota <Route path="mentor-cursos" ... />.',
    '  * ESTADOS AJUSTADOS: árvore de rotas do React — /curso/mentor-cursos',
    '    não existe mais no frontend (qualquer acesso direto cai no catch-all',
    '    e volta para /curso).',
    '',
    'ARQUIVO 3: apps/web/src/services/cursosService.js',
    '  * getMeusCursos() reescrita: após ler as matrículas do PocketBase',
    '    (coleção `matriculas`), revalida cada uma em paralelo contra',
    '    GET /cursos-publicados/:id (endpoint público, sem auth).',
    '  * 404 → curso excluído/inexistente/não publicado → remove o registro',
    '    local stale (pb.collection("matriculas").delete com requestKey',
    '    único) e retorna null (filtrado da lista).',
    '  * 200 → curso válido → preservado.',
    '  * 5xx/erro de rede → falha transitória → curso preservado (não remove',
    '    por falha temporária, para não descartar matrículas válidas).',
    '  * ESTADOS AJUSTADOS: lista de cursos retornada (somente válidos);',
    '    cache local (registro de matrícula stale removido quando o curso é',
    '    confirmadamente inexistente/não publicado).',
    '',
    'ARQUIVO 4: apps/web/src/pages/curso/CursoMeusCursosPage.jsx',
    '  * Nenhuma alteração de código necessária — consome getMeusCursos(),',
    '    que agora retorna apenas cursos válidos. O estado `cursos` (UI)',
    '    recebe automaticamente a lista revalidada e filtrada.',
    '  * ESTADOS AJUSTADOS (indiretamente): `cursos` (lista exibida) não',
    '    contém mais cursos excluídos/inexistentes/não publicados.',
    '',
    'ARQUIVO 5: apps/web/src/pages/curso/CursoAlunoPage.jsx',
    '  * Nenhuma alteração de código necessária — é a porta de entrada que',
    '    leva a /curso/meus-cursos (onde a revalidação ocorre). Não exibe',
    '    lista de cursos, apenas o aceite de termos e o botão "Abrir painel',
    '    do aluno". A revalidação ao abrir "Área do Aluno" é satisfeita pela',
    '    revalidação em getMeusCursos() no destino.',
    '',
    '--------------------------------------------------------------------------------',
    '3. O QUE NÃO FOI ALTERADO (PRESERVADO)',
    '--------------------------------------------------------------------------------',
    '  * Painel do Mentor NÃO foi recriado — MentorBoasVindasPage.jsx,',
    '    CursoMentorPage.jsx e CursoMentorCursosPage.jsx (arquivo da página)',
    '    permanecem no projeto, mas SEM rota no React e SEM item de menu.',
    '  * URL da VPS (api.conexaobatista.com.br) — INTACTA. O redirecionamento',
    '    SSO do mentor (link "Área do mentor") não foi tocado.',
    '  * Backend Express, proxies e rotas — INTACTOS. Nenhum endpoint',
    '    adicionado/removido; GET /cursos-publicados/:id já existia.',
    '  * API da VPS, cursos, matrículas, progresso, provas, conclusão de',
    '    aulas, leitor de PDF/vídeos/slides — INTACTOS.',
    '  * Autenticação PocketBase e SSO (bridge-login, tokens em',
    '    sessionStorage) — INTACTOS. Nenhum token exposto.',
    '  * Layout, estilos, identidade visual, rodapé (estrutura) — INTACTOS.',
    '  * Coleções, regras de acesso, permissões, índices, schema — INTACTOS.',
    '  * A revalidação só remove registros locais stale quando a API',
    '    confirma 404 — matrículas válidas e progresso (na VPS) jamais são',
    '    tocados por falhas transitórias.',
    '  * Publicação — site NÃO publicado (não alterado).',
    '',
    '--------------------------------------------------------------------------------',
    '4. VALIDAÇÕES REALIZADAS',
    '--------------------------------------------------------------------------------',
    'VALIDAÇÃO POR INSPEÇÃO DE CÓDIGO (COMPROVADA):',
    '  * navItems não contém mais o item "Meus Cursos (Mentor)"; FolderCheck',
    '    não é mais importado; itensVisiveis (header mobile/desktop + footer)',
    '    não o incluem para nenhum usuário.',
    '  * App.jsx não importa CursoMentorCursosPage nem registra a rota',
    '    /curso/mentor-cursos.',
    '  * getMeusCursos() chama GET /cursos-publicados/:id para cada',
    '    matrícula; 404 → delete do registro local stale + filtro (null);',
    '    200/5xx/rede → preserva. requestKey único evita auto-cancelamento',
    '    do SDK PocketBase.',
    '  * O endpoint /cursos-publicados/:id é público (sem authMiddleware),',
    '    registrado em index.js — a revalidação funciona sem sessão.',
    '',
    'VALIDAÇÃO AUTENTICADA AO VIVO (NÃO COMPROVADA):',
    '  * Requer sessão autenticada no navegador: login como aluno/mentor →',
    '    confirmar ausência do item "Meus Cursos (Mentor)" no menu (desktop,',
    '    mobile e rodapé); abrir "Meus Cursos" com uma matrícula cujo curso',
    '    foi excluído/não publicado → confirmar que ele não aparece e que o',
    '    registro local stale foi removido; confirmar que cursos válidos',
    '    continuam listados com matrícula e progresso preservados.',
    '  * Não executável no sandbox sem credenciais de superusuário PocketBase',
    '    e sem controlar o estado de publicação de cursos na VPS.',
    '',
    '--------------------------------------------------------------------------------',
    '5. LIMITAÇÕES',
    '--------------------------------------------------------------------------------',
    '  * A revalidação faz uma chamada HTTP por matrícula a cada abertura de',
    '    "Meus Cursos" (em paralelo). Para um número pequeno de matrículas o',
    '    custo é desprezível; não há paginação nem cache de revalidação.',
    '  * Só remove registros locais stale quando a API retorna 404. Se a VPS',
    '    ficar indisponível (5xx/timeout), os cursos são preservados na lista',
    '    (não removidos por falha transitória) — podem aparecer',
    '    temporariamente até a próxima revalidação bem-sucedida.',
    '  * A página CursoMentorCursosPage.jsx não foi excluída do projeto',
    '    (apenas desconectada do menu e das rotas) para evitar quebrar',
    '    imports/eventuais referências; sem rota, ela não é alcançável.',
    '',
    '--------------------------------------------------------------------------------',
    '6. SEGREDOS',
    '--------------------------------------------------------------------------------',
    'Nenhum segredo, token ou credencial é exposto neste relatório.',
    '',
    '================================================================================',
    'Fim do Relatório de correção — Revalidação de cursos do portal',
    '================================================================================',
    '',
  ].join('\n');
}

export default function relatorioRevalidacaoCursosPortal(req, res) {
  try {
    const corpo = montarRelatorio();
    const nome = 'relatorio-revalidacao-cursos-portal-09-09-2026.txt';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.status(200).send(corpo);
  } catch (err) {
    logger.error('Falha ao gerar Relatório de revalidação de cursos do portal', { err: err?.message });
    res.status(500).json({ error: 'Não foi possível gerar o relatório.' });
  }
}
