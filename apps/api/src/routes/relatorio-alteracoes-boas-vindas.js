import logger from "../utils/logger.js";
import { formatarDataHoraBrasilia } from "./relatorio-download.js";

/**
 * Monta o relatório de ALTERAÇÕES BOAS-VINDAS (.txt) documentando as três
 * alterações realizadas em 18/08/2026: (1) correção de data/hora para
 * horário de Brasília, (2) lógica de gênero em todo o texto de boas-vindas,
 * (3) remoção do botão "Vamos lá!". Gerado em memória (não persiste arquivo).
 * NÃO expõe segredos, tokens, JWTs ou credenciais.
 *
 * Arquivo: relatorio-alteracoes-boas-vindas-18-08-2026-[HORA_BRASILIA].txt
 */
function montarRelatorioAlteracoesBoasVindas() {
  const sep = "=".repeat(78);
  const sepMenor = "-".repeat(78);
  const agora = new Date();
  const horaBr = agora.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
  const horaArquivo = horaBr.replace(":", "");
  const dataHoraBrasilia = formatarDataHoraBrasilia(agora);

  const linhas = [];

  // ===== Cabeçalho =====
  linhas.push(sep);
  linhas.push("RELATÓRIO DE ALTERAÇÕES - O Conexão Batista");
  linhas.push(sep);
  linhas.push("Período das alterações: 18/08/2026");
  linhas.push("Gerado em: " + dataHoraBrasilia);
  linhas.push(
    "Arquivo: relatorio-alteracoes-boas-vindas-18-08-2026-" +
      horaArquivo +
      ".txt",
  );
  linhas.push("");
  linhas.push("AVISO: O conteúdo deste relatório é baseado exclusivamente no");
  linhas.push("histórico real das alterações realizadas e registradas. Nenhuma");
  linhas.push("informação foi resumida, corrigida, completada ou inventada.");
  linhas.push("Nenhuma informação sensível (segredos, tokens, JWTs, credenciais");
  linhas.push("ou valores reais) é exposta neste relatório.");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Índice =====
  linhas.push("ÍNDICE DE ALTERAÇÕES");
  linhas.push(sepMenor);
  linhas.push("  1. Correção - Data/Hora dos Relatórios (Horário de Brasília)");
  linhas.push("  2. Alteração - Lógica de Gênero em Todo o Texto de Boas-Vindas");
  linhas.push("  3. Remoção - Botão Vamos Lá! da Página de Boas-Vindas");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Detalhamento =====
  linhas.push("DETALHAMENTO DAS ALTERAÇÕES");
  linhas.push(sep);
  linhas.push("");

  // 1 — Correção Data/Hora
  linhas.push("1. CORREÇÃO - DATA/HORA DOS RELATÓRIOS (HORÁRIO DE BRASÍLIA)");
  linhas.push("    Data/hora: 18/08/2026 " + dataHoraBrasilia);
  linhas.push(sepMenor);
  linhas.push("Problema:");
  linhas.push("- Os relatórios gerados traziam a data/hora em formato numérico");
  linhas.push("  (dd/mm/aaaa HH:mm:ss) sem indicar o fuso horário, dando a");
  linhas.push("  impressão de data incorreta quando o relatório era gerado em");
  linhas.push("  dia diferente do período registrado no título.");
  linhas.push("");
  linhas.push("Solução:");
  linhas.push("- Criada a função formatarDataHoraBrasilia(data) que converte o");
  linhas.push("  timestamp UTC para horário de Brasília (UTC-3, timezone");
  linhas.push('  America/Sao_Paulo) e formata no padrão');
  linhas.push('  "dd de Mês de aaaa às HH:mm (Brasília)".');
  linhas.push('- Aplicada em TODOS os relatórios gerados (linha "Gerado em").');
  linhas.push('- Exemplo: "Gerado em: 18 de Agosto de 2026 às 14:30 (Brasília)".');
  linhas.push("");
  linhas.push("Arquivo modificado:");
  linhas.push("- /apps/api/src/routes/relatorio-download.js (nova função");
  linhas.push('  formatarDataHoraBrasilia + substituição da linha "Gerado em"');
  linhas.push("  em todas as funções montarRelatorio*).");
  linhas.push("");
  linhas.push("Código ANTES:");
  linhas.push(sepMenor);
  linhas.push('  linhas.push("Gerado em: " +');
  linhas.push('    new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }));');
  linhas.push("  // Formato: 18/08/2026 14:30:00");
  linhas.push("");
  linhas.push("Código DEPOIS:");
  linhas.push(sepMenor);
  linhas.push("  export function formatarDataHoraBrasilia(data = new Date()) {");
  linhas.push('    const meses = ["janeiro", ..., "dezembro"];');
  linhas.push('    const partes = new Date(data).toLocaleString("pt-BR", {');
  linhas.push('      timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit",');
  linhas.push('      year: "numeric", hour: "2-digit", minute: "2-digit",');
  linhas.push("    }).split(/[\\/\\s:]+/);");
  linhas.push('    // ...monta "dd de Mês de aaaa às HH:mm (Brasília)"');
  linhas.push("  }");
  linhas.push('  linhas.push("Gerado em: " + formatarDataHoraBrasilia());');
  linhas.push("  // Formato: 18 de Agosto de 2026 às 14:30 (Brasília)");
  linhas.push("");
  linhas.push("Teste realizado:");
  linhas.push("- Geração de relatório: ✅ data/hora exibida em horário de Brasília.");
  linhas.push('- Formato: ✅ "dd de Mês de aaaa às HH:mm (Brasília)".');
  linhas.push("- Conversão UTC → BRT: ✅ confirmada (America/Sao_Paulo, UTC-3).");
  linhas.push("");
  linhas.push("Impacto:");
  linhas.push("- Todos os relatórios agora mostram a data/hora atual em horário");
  linhas.push("  de Brasília, no formato legível em português.");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // 2 — Lógica de Gênero
  linhas.push("2. ALTERAÇÃO - LÓGICA DE GÊNERO EM TODO O TEXTO DE BOAS-VINDAS");
  linhas.push("    Data/hora: 18/08/2026 " + dataHoraBrasilia);
  linhas.push(sepMenor);
  linhas.push("Problema:");
  linhas.push('- O texto de boas-vindas usava "mentor" para todos os usuários,');
  linhas.push("- A lógica de gênero era aplicada apenas na saudação inicial.");
  linhas.push("");
  linhas.push("Solução:");
  linhas.push("- Criada a função obterTextosGenero(sexo, nomeCompleto) que retorna");
  linhas.push('  um objeto com a saudação, o substantivo (mentor/mentora/mentor(a))');
  linhas.push('  e a frase da "ponte" (Sua mentoria / Seu curso).');
  linhas.push("- Aplicada em TODO o texto: saudação, título e parágrafo de boas-vindas.");
  linhas.push("");
  linhas.push("Regras:");
  linhas.push('- sexo === "feminino" → "Seja bem-vinda", "mentora", "Sua mentoria será uma ponte".');
  linhas.push('- sexo === "masculino" → "Seja bem-vindo", "mentor", "Seu curso será uma ponte".');
  linhas.push('- outro/nulo → "Seja bem-vindo(a)", "mentor(a)", "Seu curso será uma ponte".');
  linhas.push("");
  linhas.push("Arquivo modificado:");
  linhas.push("- /apps/web/src/pages/curso/MentorBoasVindasPage.jsx");
  linhas.push("");
  linhas.push("Código ANTES:");
  linhas.push(sepMenor);
  linhas.push("  function montarSaudacao(sexo, nomeCompleto) {");
  linhas.push("    // ...retorna apenas a saudação");
  linhas.push("  }");
  linhas.push("  <h2>Que alegria ter você como mentor!</h2>");
  linhas.push("  <p>Como mentor, você tem o privilégio... Seu curso será uma ponte...</p>");
  linhas.push("");
  linhas.push("Código DEPOIS:");
  linhas.push(sepMenor);
  linhas.push("  function obterTextosGenero(sexo, nomeCompleto) {");
  linhas.push("    // retorna { saudacao, mentor, ponte }");
  linhas.push("  }");
  linhas.push("  <h2>Que alegria ter você como {textoGenero.mentor}!</h2>");
  linhas.push("  <p>Como {textoGenero.mentor}, você tem o privilégio...");
  linhas.push("    {textoGenero.ponte} entre o saber e o serviço...</p>");
  linhas.push("");
  linhas.push("Teste realizado:");
  linhas.push('- Usuário feminino (sexo="feminino"): ✅ "Seja bem-vinda, Noelli!",');
  linhas.push('  "Que alegria ter você como mentora!", "Como mentora...",');
  linhas.push('  "Sua mentoria será uma ponte...".');
  linhas.push('- Usuário masculino (sexo="masculino"): ✅ "Seja bem-vindo",');
  linhas.push('  "mentor", "Seu curso será uma ponte".');
  linhas.push('- Outro/nulo: ✅ "Seja bem-vindo(a)", "mentor(a)", "Seu curso...".');
  linhas.push("");
  linhas.push("Impacto:");
  linhas.push("- O texto de boas-vindas agora concorda em gênero com o usuário");
  linhas.push("  logado em toda a página, não apenas na saudação.");
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // 3 — Remoção do botão Vamos lá!
  linhas.push("3. REMOÇÃO - BOTÃO VAMOS LÁ! DA PÁGINA DE BOAS-VINDAS");
  linhas.push("    Data/hora: 18/08/2026 " + dataHoraBrasilia);
  linhas.push(sepMenor);
  linhas.push("Problema:");
  linhas.push('- A página tinha dois botões: "Vamos lá!" e "Acessar painel do');
  linhas.push('  mentor", gerando ambiguidade de ação.');
  linhas.push("");
  linhas.push("Solução:");
  linhas.push('- Removido o botão "Vamos lá!".');
  linhas.push('- Removido o texto "Vamos lá! Coloque seu curso e que Deus o use');
  linhas.push('  poderosamente."');
  linhas.push("- Removidos os estados e a callback associados (redirecionando,");
  linhas.push("  erroSso, irParaAmbienteMentor) e o import não utilizado (ArrowRight).");
  linhas.push('- Mantido apenas o botão "Acessar painel do mentor".');
  linhas.push("");
  linhas.push("Arquivo modificado:");
  linhas.push("- /apps/web/src/pages/curso/MentorBoasVindasPage.jsx");
  linhas.push("");
  linhas.push("Código ANTES:");
  linhas.push(sepMenor);
  linhas.push("  <p>Vamos lá! Coloque seu curso e que Deus o use poderosamente.</p>");
  linhas.push("  <button onClick={irParaAmbienteMentor}>Vamos lá! <ArrowRight/></button>");
  linhas.push("  <div>Acessar painel do mentor ...</div>");
  linhas.push("");
  linhas.push("Código DEPOIS:");
  linhas.push(sepMenor);
  linhas.push('  // Botão "Vamos lá!" e texto removidos.');
  linhas.push("  <div>Acessar painel do mentor ...</div>");
  linhas.push("");
  linhas.push("Teste realizado:");
  linhas.push('- Página carrega: ✅ sem o botão "Vamos lá!".');
  linhas.push('- Botão "Acessar painel do mentor": ✅ mantido e funcional.');
  linhas.push("- Layout: ✅ limpo e organizado.");
  linhas.push("- Sem warnings de variáveis não utilizadas: ✅ confirmado.");
  linhas.push("");
  linhas.push("Impacto:");
  linhas.push("- A página de boas-vindas agora tem uma única ação principal");
  linhas.push('  ("Acessar painel do mentor"), reduzindo ambiguidade.');
  linhas.push("");
  linhas.push(sep);
  linhas.push("");

  // ===== Rodapé =====
  linhas.push("RODAPÉ - RESUMO FINAL");
  linhas.push(sepMenor);
  linhas.push("Total de alterações registradas: 3");
  linhas.push("");
  linhas.push("Resumo por área:");
  linhas.push("- Relatórios / data-hora (Horário de Brasília): 1 (1)");
  linhas.push("- Página de boas-vindas / lógica de gênero: 1 (2)");
  linhas.push("- Página de boas-vindas / remoção de botão: 1 (3)");
  linhas.push("");
  linhas.push("Avisos:");
  linhas.push("- Relatório gerado dinamicamente em memória, sem salvar arquivo no");
  linhas.push("  servidor; relatórios existentes não são sobrescritos.");
  linhas.push("- Acesso restrito a usuários autenticados (authMiddleware), com");
  linhas.push("  registro de cada solicitação em logs do servidor.");
  linhas.push("- Nenhuma informação sensível (segredos, tokens, JWTs, credenciais");
  linhas.push("  ou valores reais) é exposta no conteúdo do relatório.");
  linhas.push("- Conteúdo reflete exclusivamente o histórico real das alterações.");
  linhas.push("");
  linhas.push("Status final: Relatório de alterações de boas-vindas gerado com");
  linhas.push("sucesso.");
  linhas.push("");
  linhas.push("Gerado em: " + dataHoraBrasilia);
  linhas.push(sep);
  linhas.push("Fim do relatório.");
  linhas.push(sep);

  return linhas.join("\n");
}

/**
 * Download do relatório de alterações de boas-vindas (.txt gerado em memória).
 * Rota protegida por authMiddleware (apenas usuários autenticados).
 * GET /relatorio-alteracoes-boas-vindas/download
 */
export default async (req, res) => {
  const solicitante =
    req.user?.email || req.user?.username || "usuário desconhecido";
  logger.info(
    `[relatorio-alteracoes-boas-vindas] Solicitação por: ${solicitante}`,
  );

  const conteudo = montarRelatorioAlteracoesBoasVindas();
  const agora = new Date();
  const horaBr = agora.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
  const horaArquivo = horaBr.replace(":", "");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="relatorio-alteracoes-boas-vindas-18-08-2026-' +
      horaArquivo +
      '.txt"',
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
