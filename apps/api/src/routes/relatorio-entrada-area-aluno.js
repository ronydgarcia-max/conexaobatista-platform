// Relatório de CORREÇÃO — Entrada direta da Área do Aluno.
// GET /relatorio-entrada-area-aluno/download
//
// Documenta a alteração exclusiva no frontend que removeu o bloqueio
// "Antes de continuar" da entrada da Área do Aluno. Usuários autenticados
// seguem diretamente para /curso/meus-cursos, sem novo pedido de aceite a
// cada acesso. Os textos e links legais existentes permanecem nas páginas
// legais apropriadas. Nenhum campo, política, consentimento, tela, fluxo de
// autenticação, SSO, matrícula, progresso, prova, curso, API da VPS ou painel
// do Mentor foi alterado.

import logger from '../utils/logger.js';

function montarRelatorio() {
  const dataHora = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  return [
    '================================================================================',
    'RELATÓRIO DE CORREÇÃO — ENTRADA DA ÁREA DO ALUNO',
    'Acesso direto ao Painel do Aluno sem novo bloqueio de aceite',
    '================================================================================',
    '',
    `Data/hora da geração (Brasília): ${dataHora}`,
    '',
    '--------------------------------------------------------------------------------',
    '1. RESUMO EXECUTIVO',
    '--------------------------------------------------------------------------------',
    'SINTOMA: a entrada /curso/aluno exibia novamente o bloqueio "Antes de',
    '         continuar" e exigia marcar os aceites antes de abrir o painel.',
    '',
    'CORREÇÃO APLICADA (exclusivamente no frontend):',
    '  * CursoAlunoPage.jsx deixou de renderizar o bloqueio, os checkboxes e',
    '    o botão condicionado ao aceite.',
    '  * Usuário autenticado é encaminhado diretamente para /curso/meus-cursos,',
    '    que é o Painel do Aluno integrado ao site.',
    '  * Usuário não autenticado continua sendo encaminhado para o login.',
    '  * A captura e a remoção do token SSO da URL foram preservadas.',
    '',
    '--------------------------------------------------------------------------------',
    '2. COMPONENTE E FLUXO AJUSTADOS',
    '--------------------------------------------------------------------------------',
    'ARQUIVO ALTERADO: apps/web/src/pages/curso/CursoAlunoPage.jsx',
    '  * Entrada /curso/aluno: verifica a sessão PocketBase existente.',
    '  * Sessão válida: navega diretamente para /curso/meus-cursos.',
    '  * Sessão inválida: mantém o redirecionamento para /login?redirect=/curso/aluno.',
    '  * Não foi criado estado, campo, política, consentimento ou tela nova.',
    '  * Os textos e links legais existentes não foram removidos do projeto;',
    '    permanecem nas páginas legais apropriadas do site.',
    '',
    '--------------------------------------------------------------------------------',
    '3. O QUE NÃO FOI ALTERADO',
    '--------------------------------------------------------------------------------',
    '  * Autenticação PocketBase e captura de sessão SSO — preservadas.',
    '  * Matrículas, progresso, provas, cursos e leitor de conteúdo — preservados.',
    '  * API Express, API da VPS, tokens e rotas de backend — preservados.',
    '  * Painel do Mentor e seu acesso via SSO — preservados.',
    '  * Textos e links legais existentes em suas áreas apropriadas — preservados.',
    '  * Publicação — site NÃO publicado.',
    '',
    '--------------------------------------------------------------------------------',
    '4. VALIDAÇÃO',
    '--------------------------------------------------------------------------------',
    'VALIDAÇÃO POR INSPEÇÃO DE CÓDIGO (COMPROVADA):',
    '  * CursoAlunoPage.jsx não renderiza mais "Antes de continuar", checkboxes',
    '    ou bloqueio de aceite.',
    '  * Sessão válida segue para /curso/meus-cursos; sessão inválida segue para login.',
    '  * A captura do token SSO e a limpeza da URL permanecem no fluxo.',
    '',
    'VALIDAÇÃO AUTENTICADA AO VIVO (NÃO COMPROVADA):',
    '  * Requer abrir /curso/aluno com uma sessão autenticada no navegador e',
    '    confirmar o redirecionamento imediato para /curso/meus-cursos.',
    '',
    'Nenhum segredo, token ou credencial é exposto neste relatório.',
    '',
    '================================================================================',
    'Fim do Relatório de correção — Entrada da Área do Aluno',
    '================================================================================',
    '',
  ].join('\n');
}

export default function relatorioEntradaAreaAluno(req, res) {
  try {
    const corpo = montarRelatorio();
    const nome = 'relatorio-entrada-area-aluno-09-09-2026.txt';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.status(200).send(corpo);
  } catch (err) {
    logger.error('Falha ao gerar Relatório de entrada da Área do Aluno', { err: err?.message });
    res.status(500).json({ error: 'Não foi possível gerar o relatório.' });
  }
}
