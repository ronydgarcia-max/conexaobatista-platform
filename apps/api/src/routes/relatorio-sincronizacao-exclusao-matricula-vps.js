// Relatório de CORREÇÃO — Sincronização após exclusão de matrícula no painel
// administrativo da VPS.
// GET /relatorio-sincronizacao-exclusao-matricula-vps/download
//
// Documenta a alteração exclusiva no frontend que passou a consultar a
// matrícula REAL na API da VPS (GET /cursos/meus → /cursos/usuario/meus,
// fonte oficial de matrículas) ao abrir "Meus Cursos" ou "Acessar curso".
// Quando a VPS confirma que o aluno não está matriculado (matrícula excluída
// no painel administrativo da VPS), o curso é removido imediatamente da
// lista, do curso selecionado e do estado/cache local (registro PocketBase
// stale deletado), exibe "Você ainda não está matriculado" e NÃO tenta
// renovar o bridge-login nem exibe "Sua sessão na plataforma expirou".
// Matrículas válidas, progresso, cursos, provas, autenticação, SSO, imagem,
// layout, backend e publicação foram preservados.

import logger from '../utils/logger.js';

function montarRelatorio() {
  const dataHora = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  return [
    '================================================================================',
    'RELATÓRIO DE CORREÇÃO — SINCRONIZAÇÃO APÓS EXCLUSÃO DE MATRÍCULA NA VPS',
    'Consulta da matrícula real na API ao abrir "Meus Cursos" ou "Acessar curso"',
    '================================================================================',
    '',
    `Data/hora da geração (Brasília): ${dataHora}`,
    '',
    '--------------------------------------------------------------------------------',
    '1. RESUMO EXECUTIVO',
    '--------------------------------------------------------------------------------',
    'SINTOMA: uma matrícula excluída no painel administrativo da VPS continuava',
    '         aparecendo em "Meus Cursos" e, ao clicar "Acessar curso", a tela',
    '         de aula exibia "Sua sessão na plataforma de cursos expirou" em vez',
    '         de "Você ainda não está matriculado".',
    '',
    'CAUSA RAIZ: a lista de "Meus Cursos" e a verificação de matrícula da tela',
    '         de aula liam o PocketBase (coleção `matriculas`), onde o registro',
    '         local permanece stale após a exclusão feita na VPS — a exclusão',
    '         no painel administrativo da VPS NÃO propaga para o PocketBase.',
    '         Assim o frontend acreditava que o aluno ainda estava matriculado e',
    '         interpretava o 401/403 da VPS como "sessão expirada" em vez de',
    '         "não matriculado".',
    '',
    'CORREÇÃO APLICADA (exclusivamente no frontend):',
    '  * Nova função `verificarMatriculaApi(cursoId)` em cursosService.js —',
    '    consulta a fonte oficial da VPS (GET /cursos/meus, proxy Express',
    '    /cursos/meus → /cursos/usuario/meus) e retorna',
    '    { matriculado, disponivel }. `disponivel=false` indica falha',
    '    transitória (VPS indisponível/rede) e NÃO é tratada como "não',
    '    matriculado" — o curso é preservado.',
    '  * `getMeusCursos()` (cursosService.js) agora revalida cada matrícula',
    '    do PocketBase contra a lista REAL da VPS: cursos ausentes da lista',
    '    da VPS são removidos da lista exibida E do cache local (registro',
    '    PocketBase deletado). Falhas transitórias preservam o curso.',
    '  * `CursoAulaPage.jsx` consulta a matrícula real na VPS ANTES de chamar',
    '    `getAulas`. Se a VPS confirmar "não matriculado", exibe "Você ainda',
    '    não está matriculado", remove o registro local stale e NÃO chama',
    '    `getAulas` — portanto NÃO tenta renovar o bridge-login nem exibe',
    '    "Sua sessão na plataforma expirou". O fallback de 401/403 também',
    '    passou a usar a VPS como fonte da verdade (em vez do PocketBase).',
    '',
    '--------------------------------------------------------------------------------',
    '2. ESTADOS E FLUXOS DE CONSULTA AJUSTADOS',
    '--------------------------------------------------------------------------------',
    'ARQUIVO: apps/web/src/services/cursosService.js',
    '  * NOVA função `verificarMatriculaApi(cursoId)`:',
    '      - Fonte: VPS (GET /cursos/meus via authedFetch).',
    '      - Retorna { matriculado, disponivel }.',
    '      - authedFetch renova o bridge-login UMA única vez se o token',
    '        expirou; erros são capturados (disponivel=false), sem entrar no',
    '        loop "renovar e tentar de novo → sessão expirada".',
    '      - Exportada no default export do serviço.',
    '  * `getMeusCursos()`:',
    '      - Após a revalidação de existência/publicação do curso',
    '        (GET /cursos-publicados/:id, já existente), adicionou a',
    '        REVALIDAÇÃO DE MATRÍCULA REAL NA VPS (GET /cursos/meus).',
    '      - Cursos ausentes da lista da VPS → removidos da lista exibida',
    '        e do cache local (PocketBase `matriculas` deletado com',
    '        requestKey único por delete).',
    '      - VPS indisponível (disponivel=false) → preserva os cursos',
    '        (não remove por falha transitória).',
    '',
    'ARQUIVO: apps/web/src/pages/curso/CursoAulaPage.jsx ("Acessar curso")',
    '  * Import atualizado: `verificarMatriculaApi` + `cancelarMatricula`',
    '    (em vez de `verificarMatricula`, baseado em PocketBase).',
    '  * Effect `carregarAulas`: ANTES de `getAulas`, consulta',
    '    `verificarMatriculaApi(id)`:',
    '      - disponivel && !matriculado → setNaoMatriculado(true),',
    '        cancelarMatricula(id) (limpa cache PocketBase stale),',
    '        erroAulas="" e return ANTES de getAulas. NÃO renova bridge-login',
    '        além da consulta única, NÃO exibe "sessão expirada".',
    '      - disponivel=false (VPS indisponível) → segue para getAulas',
    '        (fallback seguro, não bloqueia acesso por falha transitória).',
    '  * Fallback de 401/403 (getAulas falha com sessão PB válida):',
    '      - Trocou `verificarMatricula` (PocketBase) por',
    '        `verificarMatriculaApi` (VPS, fonte oficial).',
    '      - disponivel && !matriculado → setNaoMatriculado(true),',
    '        cancelarMatricula(id), erroAulas="" (sem "sessão expirada").',
    '      - Caso contrário → mensagem de sessão/permissão (problema real).',
    '  * Estado `naoMatriculado` (já existente) continua exibindo o bloco',
    '    "Você não está matriculado neste curso" + botão "Inscrever-se".',
    '',
    'ARQUIVO: apps/web/src/pages/curso/CursoMeusCursosPage.jsx ("Meus Cursos")',
    '  * Consome automaticamente a lista limpa de `getMeusCursos()` — cursos',
    '    cuja matrícula foi excluída na VPS não aparecem mais. Sem alteração',
    '    de estado adicional (a limpeza ocorre no serviço).',
    '',
    '--------------------------------------------------------------------------------',
    '3. O QUE NÃO FOI ALTERADO',
    '--------------------------------------------------------------------------------',
    '  * Backend (apps/api), rotas proxy, segredos e tokens — preservados.',
    '    A rota GET /cursos/meus (cursos-sso.js) já existia e continua intacta.',
    '  * API da VPS, endpoints, base de dados da VPS — preservados. Nenhum',
    '    dado da VPS é excluído; apenas o registro local stale (PocketBase)',
    '    é removido para sincronizar o frontend.',
    '  * Autenticação PocketBase, SSO, bridge-login, captura de token da URL',
    '    — preservados.',
    '  * Matrículas válidas, progresso, provas, cursos, leitor de PDF/vídeo/',
    '    slide/imagem — preservados.',
    '  * Layout, imagem, identidade visual — preservados.',
    '  * Schema PocketBase, regras de acesso, permissões — preservados.',
    '  * Publicação — site NÃO publicado.',
    '',
    '--------------------------------------------------------------------------------',
    '4. VALIDAÇÃO',
    '--------------------------------------------------------------------------------',
    'VALIDAÇÃO POR INSPEÇÃO DE CÓDIGO (COMPROVADA):',
    '  * `verificarMatriculaApi` consulta GET /cursos/meus (VPS) e retorna',
    '    { matriculado, disponivel }; erros → disponivel=false.',
    '  * `getMeusCursos` revalida contra a lista da VPS e deleta registros',
    '    PocketBase stale com requestKey único (evita auto-cancelamento).',
    '  * `CursoAulaPage` consulta a matrícula real ANTES de getAulas; quando',
    '    a VPS confirma "não matriculado", exibe "não matriculado", limpa o',
    '    cache e NÃO chama getAulas (sem renovação de bridge-login, sem',
    '    "sessão expirada").',
    '  * Fallback de 401/403 usa a VPS como fonte da verdade.',
    '',
    'VALIDAÇÃO AUTENTICADA AO VIVO (NÃO COMPROVADA):',
    '  * Requer uma sessão autenticada + uma matrícula excluída no painel',
    '    administrativo da VPS para confirmar: (a) o curso some de "Meus',
    '    Cursos"; (b) ao abrir "Acessar curso", aparece "Você ainda não está',
    '    matriculado" (e não "sessão expirada"); (c) o registro PocketBase',
    '    stale é removido.',
    '',
    'Nenhum segredo, token ou credencial é exposto neste relatório.',
    '',
    '================================================================================',
    'Fim do Relatório de correção — Sincronização após exclusão de matrícula na VPS',
    '================================================================================',
    '',
  ].join('\n');
}

export default function relatorioSincronizacaoExclusaoMatriculaVps(req, res) {
  try {
    const corpo = montarRelatorio();
    const nome = 'relatorio-sincronizacao-exclusao-matricula-vps-09-09-2026.txt';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.status(200).send(corpo);
  } catch (err) {
    logger.error('Falha ao gerar Relatório de sincronização após exclusão de matrícula na VPS', { err: err?.message });
    res.status(500).json({ error: 'Não foi possível gerar o relatório.' });
  }
}
