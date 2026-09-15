// Relatório de CORREÇÃO — Menu do frontend: ocultar/impedir links do
// Painel do Mentor para usuários com função de aluno.
// GET /relatorio-correcao-menu-mentor-aluno/download
//
// Documenta a correção EXCLUSIVA do menu do frontend (CursoLayout.jsx):
// usuários autenticados cuja função NÃO seja mentor aprovado
// (users.mentor_status !== 'aprovado') — ou seja, alunos — não veem e não
// podem abrir os links "Meus Cursos (Mentor)" (/curso/mentor-cursos) e
// "Área do mentor" (/curso/boas-vindas, que leva ao Painel do Mentor
// hospedado na VPS via SSO). Permanece somente a navegação do Painel do
// Aluno. Não recria o Painel do Mentor, não altera URL da VPS, backend,
// API, cursos, matrículas, progresso, autenticação, SSO ou publicação.
// Gerado em memória (.txt). Acesso restrito a administradores (adminAuth —
// coleção admins). Não expõe segredos, tokens ou credenciais.

import logger from '../utils/logger.js';

function montarRelatorio() {
  const dataHora = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'medium',
  });

  return [
    '================================================================================',
    'RELATÓRIO DE CORREÇÃO — MENU DO FRONTEND',
    'Ocultar/impedir links do Painel do Mentor para usuários com função de aluno',
    '================================================================================',
    '',
    `Data/hora da geração (Brasília): ${dataHora}`,
    '',
    '--------------------------------------------------------------------------------',
    '1. RESUMO EXECUTIVO',
    '--------------------------------------------------------------------------------',
    'SINTOMA: usuários autenticados com função de aluno viam no menu da',
    '         plataforma de cursos os links "Meus Cursos (Mentor)" e',
    '         "Área do mentor" — este último leva ao Painel do Mentor',
    '         hospedado na VPS (https://api.conexaobatista.com.br/painel)',
    '         via SSO (GET /painel?token=<JWT>).',
    '',
    'CORREÇÃO APLICADA (exclusivamente no menu do frontend):',
    '  * Os itens de menu marcados como mentorOnly ("Meus Cursos (Mentor)"',
    '    e "Área do mentor") agora são FILTRADOS do cabeçalho (desktop e',
    '    mobile) e do rodapé quando o usuário autenticado NÃO é mentor',
    '    aprovado (users.mentor_status !== "aprovado").',
    '  * Para alunos, permanece SOMENTE a navegação do Painel do Aluno:',
    '    Home, Cursos, Meus Cursos, Carrinho e Área do aluno.',
    '  * A filtragem é reativa: assina pb.authStore.onChange, então o menu',
    '    se atualiza imediatamente ao fazer login/logout ou trocar de',
    '    usuário (aluno → mentor aprovado e vice-versa).',
    '',
    'CRITÉRIO DE FUNÇÃO:',
    '  * Mentor aprovado  → users.mentor_status === "aprovado" (vê tudo).',
    '  * Aluno            → qualquer outro estado (pendente, rejeitado,',
    '                       vazio) ou usuário não autenticado (vê somente',
    '                       a navegação do Painel do Aluno).',
    '',
    '--------------------------------------------------------------------------------',
    '2. COMPONENTES/ITENS DE MENU AJUSTADOS',
    '--------------------------------------------------------------------------------',
    'ARQUIVO ÚNICO ALTERADO: apps/web/src/components/curso/CursoLayout.jsx',
    '',
    'ITENS DE NAVEGAÇÃO (array navItems):',
    '  * { to: "/curso/mentor-cursos", label: "Meus Cursos (Mentor)",',
    '      icon: FolderCheck, mentorOnly: true }  → OCULTO para alunos.',
    '  * { to: "/curso/boas-vindas", label: "Área do mentor",',
    '      icon: GraduationCap, mentorOnly: true } → OCULTO para alunos.',
    '    (Este link leva à MentorBoasVindasPage, cujo botão "Acessar painel',
    '    do mentor" redireciona para o Painel do Mentor na VPS via SSO.)',
    '',
    '  * Itens MANTIDOS (visíveis para todos, inclusive alunos):',
    '      - Home (/curso)',
    '      - Cursos (/curso/cursos)',
    '      - Meus Cursos (/curso/meus-cursos)  → Painel do Aluno',
    '      - Carrinho (/curso/carrinho)',
    '      - Área do aluno (/curso/aluno)      → Painel do Aluno',
    '',
    'FUNÇÃO ADICIONADA: useIsMentorAprovado()',
    '  * Lê pb.authStore.record (ou pb.authStore.model) e retorna',
    '    Boolean(record && record.mentor_status === "aprovado").',
    '  * Inicializa o estado a partir do authStore atual (não aguarda o',
    '    primeiro onChange) e assina pb.authStore.onChange para atualizar',
    '    reativamente em login/logout/troca de usuário.',
    '  * Faz cleanup do listener na desmontagem.',
    '',
    'CURSOHEADER (cabeçalho):',
    '  * Desktop (nav lg:flex): renderiza itensVisiveis = navItems.filter',
    '    (n => !n.mentorOnly || isMentor).',
    '  * Mobile (menu hambúrguer): renderiza o mesmo itensVisiveis.',
    '  * Alunos não veem e não podem clicar/abrir os links do mentor.',
    '',
    'CURSOFOOTER (rodapé):',
    '  * Coluna "Plataforma": renderiza itensVisiveis (mesmo filtro).',
    '  * Alunos não veem os links do mentor no rodapé.',
    '',
    '--------------------------------------------------------------------------------',
    '3. O QUE NÃO FOI ALTERADO (PRESERVADO)',
    '--------------------------------------------------------------------------------',
    '  * Painel do Mentor NÃO foi recriado — MentorBoasVindasPage.jsx,',
    '    CursoMentorPage.jsx e CursoMentorCursosPage.jsx permanecem intactos.',
    '  * URL da VPS (api.conexaobatista.com.br) — INTACTA. Nenhuma URL',
    '    alterada; o redirecionamento SSO do mentor não foi tocado.',
    '  * Backend Express, proxies e rotas — INTACTOS.',
    '  * API, cursos, matrículas, progresso, provas, conclusão de aulas,',
    '    leitor de PDF/vídeos/slides — INTACTOS.',
    '  * Autenticação PocketBase e SSO (bridge-login, tokens em',
    '    sessionStorage) — INTACTOS. Nenhum token exposto.',
    '  * Rotas do React (App.jsx) — INTACTAS. As rotas /curso/mentor-cursos',
    '    e /curso/boas-vindas continuam registradas (mentores aprovados e',
    '    acesso direto por URL continuam funcionando); a correção é apenas',
    '    na EXIBIÇÃO do menu para alunos.',
    '  * Layout, estilos, identidade visual, rodapé (estrutura) — INTACTOS.',
    '  * Coleções, regras de acesso, permissões, índices, schema — INTACTOS.',
    '  * Publicação — site NÃO publicado (não alterado).',
    '',
    '--------------------------------------------------------------------------------',
    '4. VALIDAÇÕES REALIZADAS',
    '--------------------------------------------------------------------------------',
    'VALIDAÇÃO POR INSPEÇÃO DE CÓDIGO (COMPROVADA):',
    '  * navItems marca corretamente os dois itens mentor com mentorOnly.',
    '  * useIsMentorAprovado deriva o estado exclusivamente de',
    '    users.mentor_status === "aprovado" (fonte única e oficial).',
    '  * CursoHeader (desktop + mobile) e CursoFooter filtram com',
    '    !n.mentorOnly || isMentor — alunos nunca recebem os links do mentor.',
    '  * Assinatura pb.authStore.onChange garante reatividade em',
    '    login/logout/troca de usuário, com cleanup no useEffect.',
    '  * Nenhum outro arquivo foi alterado; nenhuma rota removida; nenhum',
    '    backend/URL/VPS/SSO tocado.',
    '',
    'VALIDAÇÃO AUTENTICADA AO VIVO (NÃO COMPROVADA):',
    '  * Requer sessão autenticada no navegador: login como aluno (mentor_status',
    '    !== "aprovado") → confirmar ausência dos dois links no cabeçalho',
    '    (desktop + mobile) e no rodapé; login como mentor aprovado →',
    '    confirmar presença dos dois links; troca de usuário → confirmar',
    '    atualização reativa do menu.',
    '  * Não executável no sandbox sem credenciais de superusuário PocketBase.',
    '',
    '--------------------------------------------------------------------------------',
    '5. SEGREDOS',
    '--------------------------------------------------------------------------------',
    'Nenhum segredo, token ou credencial é exposto neste relatório.',
    '',
    '================================================================================',
    'Fim do Relatório de correção — Menu do frontend (mentor × aluno)',
    '================================================================================',
    '',
  ].join('\n');
}

export default function relatorioCorrecaoMenuMentorAluno(req, res) {
  try {
    const corpo = montarRelatorio();
    const nome = 'relatorio-correcao-menu-mentor-aluno-09-09-2026.txt';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
    res.status(200).send(corpo);
  } catch (err) {
    logger.error('Falha ao gerar Relatório de correção do menu mentor × aluno', { err: err?.message });
    res.status(500).json({ error: 'Não foi possível gerar o relatório.' });
  }
}
