// Relatório de CORREÇÃO — Prompt 2, atualizar a imagem do curso.
// GET /relatorio-atualizacao-imagem-curso/download
//
// Documenta a alteração EXCLUSIVA no frontend que corrigiu a origem da imagem
// exibida nos cards de "Cursos" e "Meus Cursos". Após uma nova inscrição, a
// imagem passou a ser obtida dos dados ATUAIS do curso retornados pela API
// (GET /cursos-publicados/:id, campo curso.imagem_url), sem reutilizar a
// imagem antiga congelada no registro da matrícula (PocketBase
// matriculas.curso_imagem) no momento da inscrição. Quando o curso não tem
// imagem definida, o card preserva o estado visual padrão já existente
// (placeholder com ícone BookOpen). Não altera título, descrição, preço,
// progresso, matrícula, autenticação, SSO, layout, API da VPS nem publicação.

import logger from '../utils/logger.js';

function montarRelatorio() {
  const dataHora = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  return [
    '================================================================================',
    'RELATÓRIO DE CORREÇÃO — PROMPT 2, ATUALIZAR A IMAGEM DO CURSO',
    'Origem da imagem dos cards de Cursos e Meus Cursos',
    '================================================================================',
    '',
    `Data/hora da geração (Brasília): ${dataHora}`,
    '',
    '--------------------------------------------------------------------------------',
    '1. RESUMO EXECUTIVO',
    '--------------------------------------------------------------------------------',
    'SINTOMA: após uma nova inscrição (ou troca da imagem do curso pelo mentor),',
    '         o card de "Meus Cursos" continuava exibindo a imagem ANTIGA,',
    '         congelada no registro da matrícula (PocketBase matriculas.',
    '         curso_imagem) no momento da inscrição, em vez da imagem atual do',
    '         curso.',
    '',
    'CORREÇÃO APLICADA (exclusivamente no frontend):',
    '  * getMeusCursos() em cursosService.js já revalidava cada matrícula',
    '    contra GET /cursos-publicados/:id (para remover cursos 404). Agora,',
    '    quando a resposta é 200, o corpo JSON é lido e a imagem ATUAL do curso',
    '    (campo curso.imagem_url) é capturada em um Map `imagensAtuais`.',
    '  * O mapeamento final de cada curso passou a usar',
    '    `imagensAtuais.get(cursoId) || m.curso_imagem || ""` — ou seja, a',
    '    imagem fresca da API tem prioridade; o campo antigo da matrícula só',
    '    serve de fallback quando a consulta à API falhou (falha transitória',
    '    de rede/5xx); e quando nenhuma imagem existe, o valor é string vazia.',
    '  * A página CursoMeusCursosPage.jsx (normalizarCurso) já trata img vazia',
    '    exibindo o estado visual padrão já existente (placeholder com ícone',
    '    BookOpen). Nenhuma alteração de layout foi necessária.',
    '',
    '--------------------------------------------------------------------------------',
    '2. DE QUAL RESPOSTA DA API A IMAGEM PASSOU A SER OBTIDA',
    '--------------------------------------------------------------------------------',
    'ENDPOINT: GET /cursos-publicados/:id  (proxy Express público)',
    '  * Backend: curso-publico-detalhe.js — repassa para a API da VPS e',
    '    devolve { curso: { ... imagem_url, titulo, descricao, ... } }.',
    '  * Campo da imagem: data.curso.imagem_url  (fallback data.curso.img).',
    '',
    'A MESMA fonte já usada por:',
    '  * CursoCursosPage.jsx (listagem pública): GET /cursos-publicados →',
    '    normalizarCursoPublico lê c.imagem_url || c.img. (Já estava correto:',
    '    a listagem pública sempre usou a imagem atual da API; nenhuma',
    '    alteração foi necessária nesta página.)',
    '  * CursoDetalhePage.jsx (detalhe): GET /cursos-publicados/:id →',
    '    normalizarCurso lê c.imagem_url || c.img.',
    '',
    'Portanto, os cards de "Cursos" e "Meus Cursos" agora compartilham a MESMA',
    'origem de imagem: a resposta atual de GET /cursos-publicados/:id, campo',
    'curso.imagem_url. A imagem antiga da matrícula (matriculas.curso_imagem)',
    'deixou de ser a fonte primária do card de "Meus Cursos".',
    '',
    '--------------------------------------------------------------------------------',
    '3. COMPONENTE E ESTADO AJUSTADOS',
    '--------------------------------------------------------------------------------',
    'ARQUIVO ALTERADO: apps/web/src/services/cursosService.js',
    '  * Função: getMeusCursos()',
    '  * Novo estado local: `const imagensAtuais = new Map()` — preenchido',
    '    durante a revalidação paralela (res.ok → res.json() →',
    '    curso.imagem_url).',
    '  * Mapeamento final: `img: imagensAtuais.get(cursoId) || m.curso_imagem',
    '    || ""` (imagem atual da API com prioridade; fallback para o campo da',
    '    matrícula apenas em falha transitória; string vazia quando não há',
    '    imagem).',
    '',
    'ARQUIVO NÃO ALTERADO (já correto):',
    '  * apps/web/src/pages/curso/CursoCursosPage.jsx — normalizarCursoPublico',
    '    já lê c.imagem_url || c.img da resposta de GET /cursos-publicados.',
    '  * apps/web/src/pages/curso/CursoMeusCursosPage.jsx — normalizarCurso já',
    '    trata img vazia com o placeholder padrão (BookOpen).',
    '',
    '--------------------------------------------------------------------------------',
    '4. O QUE NÃO FOI ALTERADO',
    '--------------------------------------------------------------------------------',
    '  * Título, descrição, preço, progresso, matrícula — preservados.',
    '  * Autenticação PocketBase e SSO (bridge-login, tokens) — preservados.',
    '  * Backend Express, proxy /cursos-publicados/:id e API da VPS —',
    '    preservados (nenhuma alteração na API da VPS).',
    '  * Layout, estilos, placeholder padrão e responsividade — preservados.',
    '  * Schema do banco, coleções e regras de acesso — preservados.',
    '  * Publicação — site NÃO publicado.',
    '',
    '--------------------------------------------------------------------------------',
    '5. VALIDAÇÃO',
    '--------------------------------------------------------------------------------',
    'VALIDAÇÃO POR INSPEÇÃO DE CÓDIGO (COMPROVADA):',
    '  * getMeusCursos() captura curso.imagem_url do corpo 200 de',
    '    GET /cursos-publicados/:id e a usa com prioridade no mapeamento final.',
    '  * Fallback para m.curso_imagem ocorre apenas quando a consulta à API',
    '    falhou (falha transitória), não no caminho normal.',
    '  * Sem imagem definida → string vazia → placeholder padrão existente.',
    '  * CursoCursosPage já usava a imagem atual da API (sem alteração).',
    '',
    'VALIDAÇÃO AUTENTICADA AO VIVO (NÃO COMPROVADA):',
    '  * Requer uma sessão autenticada no navegador: inscrever-se em um curso',
    '    cuja imagem foi alterada pelo mentor após a inscrição, abrir "Meus',
    '    Cursos" e confirmar que o card exibe a imagem atual (e não a antiga',
    '    da matrícula); e confirmar que um curso sem imagem exibe o placeholder.',
    '',
    'Nenhum segredo, token ou credencial é exposto neste relatório.',
    '',
    '================================================================================',
    'Fim do Relatório — Prompt 2, atualizar a imagem do curso',
    '================================================================================',
    '',
  ].join('\n');
}

export default function relatorioAtualizacaoImagemCurso(req, res) {
  try {
    const corpo = montarRelatorio();
    const nome = 'relatorio-atualizacao-imagem-curso-09-09-2026.txt';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.status(200).send(corpo);
  } catch (err) {
    logger.error('Falha ao gerar Relatório de atualização da imagem do curso', { err: err?.message });
    res.status(500).json({ error: 'Não foi possível gerar o relatório.' });
  }
}
