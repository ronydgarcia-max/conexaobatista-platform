// Relatório de CORREÇÃO — Prompt 4, finalizar e retornar ao aluno.
// GET /relatorio-prompt4-finalizar-retornar-aluno/download
//
// Documenta a alteração EXCLUSIVA no frontend do fluxo após a confirmação
// da conclusão final do curso. Quando a API confirma que todas as aulas
// foram concluídas (getProgresso → percentual >= 100), o registro de
// conclusão é preservado, a mensagem de sucesso já existente é exibida e
// o aluno é navegado automaticamente para a página principal do Painel do
// Aluno (/curso/meus-cursos). Não altera matrícula, progresso, provas,
// autenticação, SSO, cursos, painel do mentor, API da VPS ou publicação.

import logger from '../utils/logger.js';

function montarRelatorio() {
  const dataHora = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  return [
    '================================================================================',
    'RELATÓRIO DE CORREÇÃO — PROMPT 4, FINALIZAR E RETORNAR AO ALUNO',
    'Fluxo após a confirmação da conclusão final do curso',
    '================================================================================',
    '',
    `Data/hora da geração (Brasília): ${dataHora}`,
    '',
    '--------------------------------------------------------------------------------',
    '1. RESUMO EXECUTIVO',
    '--------------------------------------------------------------------------------',
    'SINTOMA: ao concluir a última aula de um curso (sem prova final), o',
    '         registro de conclusão era marcado e a mensagem de sucesso era',
    '         exibida, mas o aluno permanecia na tela de aula sem ser',
    '         encaminhado de volta ao Painel do Aluno.',
    '',
    'CORREÇÃO APLICADA (exclusivamente no frontend):',
    '  * CursoAulaPage.jsx — função `avancarEtapaOProva()`: após marcar a',
    '    última aula como concluída na VPS (concluirAula) e confirmar que não',
    '    há prova nem próxima aula, consulta o progresso REAL da VPS',
    '    (getProgresso). Quando a API confirma `percentual >= 100` (todas as',
    '    aulas concluídas), o estado `cursoConcluido` é mantido true',
    '    (preserva o registro de conclusão e a mensagem de sucesso já',
    '    existente) e o aluno é navegado AUTOMATICAMENTE para a página',
    '    principal do Painel do Aluno (/curso/meus-cursos) após um breve',
    '    intervalo (2s), para que veja a confirmação antes do redirecionamento.',
    '  * Nenhum dado é inventado localmente; a navegação só ocorre com a',
    '    confirmação real da API.',
    '',
    '--------------------------------------------------------------------------------',
    '2. QUAL CONFIRMAÇÃO DA API DISPARA A NAVEGAÇÃO',
    '--------------------------------------------------------------------------------',
    'ENDPOINT: GET /cursos/:id/progresso (proxy cursos-progresso.js → VPS',
    '          GET /aluno/cursos/:id/progresso)',
    '  * Função frontend: getProgresso(id) em cursosService.js',
    '  * Resposta esperada: { total_aulas, aulas_concluidas, percentual }',
    '',
    'CONDIÇÃO DISPARADORA:',
    '  * `percentual >= 100` (Number(prog?.percentual) || 0).',
    '  * Quando verdadeira, a API confirma que TODAS as aulas do curso foram',
    '    concluídas. O frontend então:',
    '      1. setCursoConcluido(true) — preserva o registro de conclusão e',
    '         mantém a mensagem de sucesso já existente visível;',
    '      2. setTimeout(() => navigate("/curso/meus-cursos", { replace: true',
    '         }), 2000) — navega automaticamente para a página principal do',
    '         Painel do Aluno após 2 segundos.',
    '',
    '  * Se `percentual < 100` ou o progresso estiver indisponível (erro de',
    '    rede/auth), NÃO há navegação e `cursoConcluido` permanece false',
    '    (matrícula nova com progresso incompleto ou indisponível).',
    '',
    '--------------------------------------------------------------------------------',
    '3. COMPONENTE E ESTADOS AJUSTADOS',
    '--------------------------------------------------------------------------------',
    'ARQUIVO ALTERADO: apps/web/src/pages/curso/CursoAulaPage.jsx',
    '  * Função: `avancarEtapaOProva()` (botão "Próxima" na última página da',
    '    última aula, sem prova configurada).',
    '  * Bloco alterado: a chamada `getProgresso(id)` que decide a conclusão',
    '    final do curso. Antes apenas `setCursoConcluido(percentual >= 100)`;',
    '    agora também dispara `navigate("/curso/meus-cursos", { replace: true',
    '    })` após 2s quando `percentual >= 100`.',
    '  * Estado `cursoConcluido` (bool): preservado — continua controlando a',
    '    mensagem de sucesso "Curso concluído! Você finalizou todas as aulas."',
    '    já existente no bloco de navegação.',
    '  * Navegação usa `replace: true` para evitar retorno à tela de aula',
    '    após a conclusão (o curso já está finalizado).',
    '',
    '--------------------------------------------------------------------------------',
    '4. O QUE NÃO FOI ALTERADO',
    '--------------------------------------------------------------------------------',
    '  * Matrícula (criação/cancelamento/sincronização) — preservada.',
    '  * Progresso (concluirAula, getProgresso, percentual) — preservado;',
    '    apenas a AÇÃO pós-confirmação (navegação) foi adicionada.',
    '  * Provas (detalhe, envio, resultado, bloqueio de reenvio) — preservadas.',
    '  * Autenticação PocketBase e SSO (bridge-login, tokens) — preservados.',
    '  * Cursos, aulas, mídias (PDF/slides/vídeo/imagem) — preservados.',
    '  * Painel do Mentor (hospedado na VPS via SSO) — não alterado.',
    '  * API da VPS e proxies — nenhum endpoint criado/alterado; o contrato',
    '    da API não foi modificado.',
    '  * Layout, estilos e responsividade — preservados.',
    '  * Banco de dados, schema, coleções e regras de acesso — preservados.',
    '  * Publicação — site NÃO publicado.',
    '',
    '--------------------------------------------------------------------------------',
    '5. VALIDAÇÃO',
    '--------------------------------------------------------------------------------',
    'VALIDAÇÃO POR INSPEÇÃO DE CÓDIGO (COMPROVADA):',
    '  * A navegação só ocorre quando `getProgresso` devolve `percentual',
    '    >= 100` (confirmação real da API).',
    '  * `setCursoConcluido(true)` é executado antes da navegação,',
    '    preservando o registro de conclusão e a mensagem de sucesso.',
    '  * `navigate("/curso/meus-cursos", { replace: true })` é disparado',
    '    após 2s, dando tempo para o aluno ver a confirmação.',
    '  * Em caso de progresso indisponível ou < 100%, nenhuma navegação',
    '    ocorre e `cursoConcluido` permanece false.',
    '',
    'VALIDAÇÃO AUTENTICADA AO VIVO (NÃO COMPROVADA):',
    '  * Requer sessão autenticada + curso com todas as aulas concluídas na',
    '    VPS: concluir a última aula, confirmar a mensagem de sucesso e o',
    '    redirecionamento automático para /curso/meus-cursos.',
    '',
    'Nenhum segredo, token ou credencial é exposto neste relatório.',
    '',
    '================================================================================',
    'Fim do Relatório — Prompt 4, finalizar e retornar ao aluno',
    '================================================================================',
    '',
  ].join('\n');
}

export default function relatorioPrompt4FinalizarRetornarAluno(req, res) {
  try {
    const corpo = montarRelatorio();
    const nome = 'relatorio-prompt4-finalizar-retornar-aluno-09-09-2026.txt';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.status(200).send(corpo);
  } catch (err) {
    logger.error('Falha ao gerar Relatório Prompt 4 (finalizar e retornar ao aluno)', { err: err?.message });
    res.status(500).json({ error: 'Não foi possível gerar o relatório.' });
  }
}
