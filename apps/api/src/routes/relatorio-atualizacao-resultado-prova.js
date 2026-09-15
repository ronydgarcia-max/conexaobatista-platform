// Relatório de CORREÇÃO — Prompt 3, atualizar o resultado da prova.
// GET /relatorio-atualizacao-resultado-prova/download
//
// Documenta a alteração EXCLUSIVA no frontend que corrigiu o retorno visual
// após o envio das respostas de uma prova. Depois que a API confirma o
// registro, a questão é atualizada imediatamente com o resultado REAL
// retornado, indicando correta/incorreta por questão quando a API traz essa
// correção, e bloqueando novo envio da mesma questão/prova já registrada.
// Nenhum resultado é inventado localmente. Se a API não trouxer correção por
// questão, a tela informa claramente que a correção detalhada depende do
// backend. Não altera provas, banco, autenticação, progresso, cursos ou
// publicação.

import logger from '../utils/logger.js';

function montarRelatorio() {
  const dataHora = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  return [
    '================================================================================',
    'RELATÓRIO DE CORREÇÃO — PROMPT 3, ATUALIZAR O RESULTADO DA PROVA',
    'Retorno visual após o envio das respostas',
    '================================================================================',
    '',
    `Data/hora da geração (Brasília): ${dataHora}`,
    '',
    '--------------------------------------------------------------------------------',
    '1. RESUMO EXECUTIVO',
    '--------------------------------------------------------------------------------',
    'SINTOMA: após enviar as respostas da prova, a tela não atualizava cada',
    '         questão com o resultado real (correta/incorreta) retornado pela',
    '         API, e não bloqueava claramente um novo envio da mesma questão',
    '         já registrada.',
    '',
    'CORREÇÃO APLICADA (exclusivamente no frontend):',
    '  * CursoProvaPage.jsx agora aguarda a confirmação REAL da API',
    '    (enviarRespostasProva → POST /cursos/:id/provas/:provaId/respostas)',
    '    antes de atualizar a tela. Nenhum resultado é calculado ou inventado',
    '    localmente.',
    '  * Após o sucesso, o estado `registrada=true` BLOQUEIA qualquer novo',
    '    envio da mesma prova: inputs desabilitados, botão "Enviar respostas"',
    '    oculto, e um aviso de bloqueio (tentativa única) é exibido.',
    '  * A correção POR QUESTÃO é extraída da resposta real da API (função',
    '    `extrairCorrecao`). Quando a API traz a correção (campos por',
    '    questão), cada questão recebe um selo "Correta"/"Incorreta", a',
    '    alternativa correta é destacada em verde e a resposta escolhida',
    '    incorreta em vermelho.',
    '  * Quando a API NÃO traz correção por questão (apenas nota geral), a',
    '    tela exibe claramente: "Sua prova foi registrada pela API. A',
    '    correção detalhada por questão (correta/incorreta) depende do',
    '    backend — a API retornou apenas a nota geral."',
    '  * O 409 (tentativa única — prova já respondida) também marca',
    '    `registrada=true`, bloqueia reenvio e carrega o resultado real',
    '    existente (getResultadoProva).',
    '',
    '--------------------------------------------------------------------------------',
    '2. QUAL RESPOSTA DA API FOI USADA PARA ATUALIZAR A TELA',
    '--------------------------------------------------------------------------------',
    'ENDPOINT DE ENVIO: POST /cursos/:id/provas/:provaId/respostas',
    '  * Proxy: cursos-prova-respostas.js → VPS POST /aluno/provas/:provaId/',
    '    respostas. Devolve o corpo da VPS tal qual (201).',
    '  * Campos usados para o RESULTADO GERAL (sempre exibidos quando',
    '    presentes): `nota`, `aprovado`, `total_perguntas`, `total_acertos`,',
    '    `nota_minima`.',
    '',
    'CORREÇÃO POR QUESTÃO (usada quando presente na resposta):',
    '  * A função `extrairCorrecao(res)` procura por arrays de correção em',
    '    campos comuns da resposta: `respostas`, `detalhes`, `resultados`,',
    '    `correcoes`, `resposta_detalhes`, `perguntas`, `questoes`, `questions`.',
    '  * Para cada item do array, lê:',
    '      - pergunta_id  (ou questao_id / question_id / id)',
    '      - correta      (ou certa / correct / is_correct) — bool',
    '      - alternativa_correta_id (ou correta_id / resposta_correta_id /',
    '        correct_alternative_id / alternativa_correta)',
    '      - alternativa_id escolhida (ou alternativa_escolhida_id /',
    '        resposta_id / escolhida_id)',
    '  * Só marca correção quando a API devolve explicitamente `correta`',
    '    (bool) ou `alternativa_correta_id` para a questão. Sem isso,',
    '    `correcaoDetalhada=false` e o aviso "depende do backend" é exibido.',
    '',
    'ENDPOINT DE RESULTADO EXISTENTE: GET /cursos/:id/provas/:provaId/',
    'resultado (getResultadoProva) — usado ao abrir uma prova já respondida',
    'e após 409. Mesma extração de correção é aplicada à sua resposta.',
    '',
    '--------------------------------------------------------------------------------',
    '3. COMPONENTE E ESTADOS AJUSTADOS',
    '--------------------------------------------------------------------------------',
    'ARQUIVO ALTERADO: apps/web/src/pages/curso/CursoProvaPage.jsx',
    '  * Novos estados:',
    '      - `registrada` (bool): API confirmou o registro (sucesso ou 409).',
    '        Bloqueia reenvio (inputs disabled, botão oculto, aviso exibido).',
    '      - `correcaoDetalhada` (bool): a API trouxe correção por questão.',
    '      - `correcaoPorQuestao` (Map<pergunta_id, { correta,',
    '        alternativa_correta_id, escolhida_id }>): extraído da resposta.',
    '  * Nova função: `extrairCorrecao(res)` — normaliza a correção por',
    '    questão a partir da resposta real da API (nenhum dado inventado).',
    '  * `enviarProva()`: em caso de sucesso, define `registrada=true` e',
    '    extrai a correção da resposta. Em caso de 409, define `registrada',
    '    =true`, bloqueia reenvio e carrega o resultado existente. Outros',
    '    erros mantêm o formulário liberado para tentar novamente.',
    '  * Efeito de carga inicial: quando `getResultadoProva` devolve um',
    '    resultado com nota, define `registrada=true` e extrai a correção.',
    '  * Renderização: selo "Correta"/"Incorreta" por questão, destaque verde',
    '    da alternativa correta, destaque vermelho da resposta escolhida',
    '    incorreta, aviso "depende do backend" quando não há correção',
    '    detalhada, e aviso de bloqueio de reenvio.',
    '',
    '--------------------------------------------------------------------------------',
    '4. O QUE NÃO FOI ALTERADO',
    '--------------------------------------------------------------------------------',
    '  * Provas, questões, alternativas e gabarito — preservados (o gabarito',
    '    continua removido no backend; a correção só aparece se a API devolver).',
    '  * Banco de dados, schema, coleções e regras de acesso — preservados.',
    '  * Autenticação PocketBase e SSO (bridge-login, tokens) — preservados.',
    '  * Progresso do curso, aulas, conclusão de etapa — preservados.',
    '  * Cursos, matrículas e API da VPS — preservados (nenhuma alteração na',
    '    VPS nem nos proxies; o contrato da API não foi alterado).',
    '  * Layout, estilos e responsividade — preservados.',
    '  * Publicação — site NÃO publicado.',
    '',
    '--------------------------------------------------------------------------------',
    '5. VALIDAÇÃO',
    '--------------------------------------------------------------------------------',
    'VALIDAÇÃO POR INSPEÇÃO DE CÓDIGO (COMPROVADA):',
    '  * `enviarProva` só atualiza a tela após a confirmação real da API;',
    '    nenhum resultado é calculado localmente.',
    '  * `registrada=true` bloqueia novo envio (inputs disabled, botão',
    '    oculto, aviso exibido) tanto no sucesso quanto no 409.',
    '  * `extrairCorrecao` só marca correção quando a API devolve',
    '    explicitamente `correta` ou `alternativa_correta_id`.',
    '  * Quando a API não traz correção por questão, o aviso "depende do',
    '    backend" é exibido claramente.',
    '',
    'VALIDAÇÃO AUTENTICADA AO VIVO (NÃO COMPROVADA):',
    '  * Requer sessão autenticada + prova com questões publicadas na VPS:',
    '    enviar respostas, confirmar o bloqueio de reenvio e o resultado real',
    '    exibido; e confirmar o aviso "depende do backend" quando a VPS',
    '    retornar apenas a nota geral.',
    '',
    'Nenhum segredo, token ou credencial é exposto neste relatório.',
    '',
    '================================================================================',
    'Fim do Relatório — Prompt 3, atualizar o resultado da prova',
    '================================================================================',
    '',
  ].join('\n');
}

export default function relatorioAtualizacaoResultadoProva(req, res) {
  try {
    const corpo = montarRelatorio();
    const nome = 'relatorio-atualizacao-resultado-prova-09-09-2026.txt';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.status(200).send(corpo);
  } catch (err) {
    logger.error('Falha ao gerar Relatório de atualização do resultado da prova', { err: err?.message });
    res.status(500).json({ error: 'Não foi possível gerar o relatório.' });
  }
}
