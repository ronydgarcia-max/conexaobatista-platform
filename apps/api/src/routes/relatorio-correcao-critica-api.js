// Download do relatório de CORREÇÃO CRÍTICA - Cursos Conexão Batista (.txt
// gerado em memória).
//
// Documenta cinco correções críticas aplicadas em 26/08/2026:
//   1. URL da API — fallbacks de código que apontavam para o IP morto
//      http://69.62.124.240:3333 (timeout) atualizados para o domínio
//      funcional https://api.conexaobatista.com.br.
//   2. Paths sem prefixo /api — confirmado que o frontend já utiliza os
//      paths corretos do proxy Express (sem prefixo /api) via
//      apiServerClient; nenhuma chamada /api/cursos encontrada no código.
//   3. Dados reais (Objetivos/Público-alvo/Pré-requisitos) — investigação
//      da API externa confirma que esses campos NÃO existem no modelo de
//      dados; o proxy mapeia variantes PT/EN e o frontend exibe placeholders
//      discretos quando ausentes (comportamento correto).
//   4. Fluxo de inscrição — URL de redirecionamento à plataforma de cursos
//      atualizada do IP morto para https://cursos.conexaobatista.com.br;
//      fluxo ensure + bridge-login intacto.
//   5. Limpeza total — remoção de todas as referências ao IP morto
//      69.62.124.240:3333 do código funcional (backend, hooks PocketBase,
//      frontend).
//
// Rota protegida por adminAuth (coleção `admins`).
// GET /relatorio-correcao-critica-api/download

import logger from "../utils/logger.js";

function montarRelatorioCorrecaoCriticaApi() {
  const agora = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "long",
  });

  return `================================================================================
RELATÓRIO DE CORREÇÃO CRÍTICA - Cursos Conexão Batista
================================================================================

Período: 26/08/2026
Data/hora de geração: ${agora} (horário de Brasília)

------------------------------------------------------------------------------
AVISO
------------------------------------------------------------------------------
Este relatório documenta correções críticas aplicadas no código do
portal público Cursos Conexão Batista. As alterações foram validadas
via curl na API externa e via inspeção do código-fonte. Nenhum dado
de produção foi modificado diretamente por este relatório.

------------------------------------------------------------------------------
ÍNDICE
------------------------------------------------------------------------------
  1. Correção Crítica - URL da API
  2. Correção Crítica - Paths sem prefixo /api
  3. Correção Crítica - Dados Reais (Objetivos/Público-alvo/Pré-requisitos)
  4. Correção Crítica - Fluxo de Inscrição
  5. Limpeza Total - Remoção de IP Morto e Paths Incorretos

================================================================================
1. Correção Crítica - URL da API
================================================================================

PROBLEMA:
  Vários arquivos de rota do backend (Express) e hooks do PocketBase
  continham fallbacks de código hardcoded apontando para o endereço
  IP direto http://69.62.124.240:3333, que está inacessível (timeout
  de conexão). Embora a variável de ambiente CURSOS_API_URL em
  apps/api/.env já estivesse correta (https://api.conexaobatista.com.br),
  os fallbacks representavam um risco: se a variável deixasse de ser
  carregada, o código cairia no IP morto e todas as chamadas falhariam.

CAUSA RAIZ:
  Endereço IP direto da VPS (69.62.124.240:3333) não é alcançável a
  partir do processo Express do sandbox nem do navegador (mixed content
  HTTPS -> HTTP). O domínio https://api.conexaobatista.com.br é o
  endpoint funcional e seguro (HTTPS).

CORREÇÃO:
  Atualização de todos os fallbacks de código de
  http://69.62.124.240:3333 para https://api.conexaobatista.com.br
  nos seguintes arquivos:

  Backend (apps/api/src/routes/):
    - cursos-mentor-status.js
    - batista.js
    - cursos-cadastro.js
    - cursos-usuario-ensure.js
    - cursos-sso.js

  PocketBase hooks (apps/pocketbase/pb_hooks/):
    - cursos_sso.pb.js (4 ocorrências)

CÓDIGO ANTES:
  const CURSOS_API_URL = (process.env.CURSOS_API_URL
    || "http://69.62.124.240:3333").replace(/\\/+$/, "");

CÓDIGO DEPOIS:
  const CURSOS_API_URL = (process.env.CURSOS_API_URL
    || "https://api.conexaobatista.com.br").replace(/\\/+$/, "");

TESTE:
  $ curl -sS --max-time 10 https://api.conexaobatista.com.br/health
  {"status":"ok"}

  $ curl -sS --max-time 10 https://api.conexaobatista.com.br/cursos
  [{"id":29,"titulo":"Curso Livre Secretariado",...}]

IMPACTO:
  Resiliência: mesmo se a variável CURSOS_API_URL não for carregada,
  o código utiliza o domínio funcional correto como fallback. Elimina
  o risco de timeout silencioso em todos os fluxos de cursos.

================================================================================
2. Correção Crítica - Paths sem prefixo /api
================================================================================

PROBLEMA RELATADO:
  Suspeita de que o frontend utilizava paths com prefixo /api
  (ex.: /api/cursos, /api/cursos-publicos) que não existem na
  API externa.

INVESTIGAÇÃO:
  Busca exaustiva (grep) por /api/cursos em apps/web/src retornou
  apenas referências em comentários explicativos — nenhuma chamada
  fetch real com prefixo /api foi encontrada no código funcional.

  O frontend já utiliza o proxy Express corretamente via
  apiServerClient.fetch(), que adiciona o prefixo /hcgi/api
  automaticamente. As rotas do proxy são registradas sem prefixo /api
  adicional:
    - GET /cursos-publicados         (listagem pública)
    - GET /cursos-publicados/:id     (detalhe público)
    - POST /cursos/usuarios-ensure   (sincronização de usuário)
    - POST /cursos/bridge-login      (SSO)
    - GET /cursos/meus               (cursos do aluno)

CORREÇÃO:
  Nenhuma alteração necessária — o frontend já estava correto. A
  arquitetura de proxy (frontend -> Express -> API externa) está
  intacta e utiliza os paths corretos. O prefixo /hcgi/api é adicionado
  pelo apiServerClient e não deve ser confundido com um prefixo /api
  da API externa.

TESTE:
  $ curl -sS https://api.conexaobatista.com.br/cursos
  → JSON com lista de cursos (200 OK)

  $ curl -sS https://api.conexaobatista.com.br/api/cursos
  → "Cannot GET /api/cursos" (404 — confirma que /api não existe)

IMPACTO:
  Confirmação de que a camada de apresentação já estava alinhada com
  a API externa. Nenhum risco de 404 por prefixo incorreto.

================================================================================
3. Correção Crítica - Dados Reais (Objetivos/Público-alvo/Pré-requisitos)
================================================================================

PROBLEMA RELATADO:
  Campos Objetivos, Público-alvo e Pré-requisitos não apareciam na
  página de detalhes do curso.

INVESTIGAÇÃO DA API EXTERNA:
  Teste direto (curl) em https://api.conexaobatista.com.br/cursos/29
  confirma que o modelo de dados da API externa NÃO possui os
  campos objetivos, publico_alvo ou pre_requisitos.

  Campos disponíveis na API externa:
    id, mentor_id, titulo, descricao, categoria, carga_horaria,
    preco, status, imagem_url, created_at, updated_at,
    parecer_ia, motivo_reprovacao, video_url, video_type,
    video_public_id, thumbnail_url, confirmed_author,
    ia_score, ia_veredito, matriz_curricular, subcategoria

CORREÇÃO:
  O proxy curso-publico-detalhe.js já mapeia variantes de nomes de
  campos (PT/EN: objetivos/objetivo/course_objectives/goals,
  publico_alvo/target_audience/audience,
  pre_requisitos/prerequisites/requirements) para os nomes canônicos.
  Quando o campo não existe sob nenhuma variante, o valor é null e o
  frontend exibe um placeholder discreto ("Os objetivos serão
  detalhados em breve.") — comportamento correto, sem inventar dados.

  O campo matriz_curricular ESTÁ disponível e é exibido corretamente
  na aba "Matriz curricular" da página de detalhes, com parsing das
  linhas numeradas em módulos/aulas.

TESTE:
  $ curl -sS https://api.conexaobatista.com.br/cursos/29
  → "matriz_curricular":"Matriz Curricular\\n1 – Apresentação...
  → "objetivos": (campo ausente — não existe no modelo)

IMPACTO:
  A página de detalhes exibe todos os dados disponíveis na API. Os
  campos ausentes (objetivos/público-alvo/pré-requisitos) mostram
  placeholders profissionais. Quando a API externa adicionar esses
  campos, eles aparecerão automaticamente sem necessidade de alteração
  de código (mapeamento de variantes já implementado).

================================================================================
4. Correção Crítica - Fluxo de Inscrição
================================================================================

PROBLEMA:
  Após a inscrição/checkout, o usuário era redirecionado para o IP
  morto http://69.62.124.240:3333/ (timeout), impedindo a conclusão
  da matrícula na plataforma de cursos.

CORREÇÃO:
  Atualização da constante PLATAFORMA_CURSOS_URL de
  http://69.62.124.240:3333/ para https://cursos.conexaobatista.com.br
  nos seguintes arquivos:
    - apps/web/src/pages/curso/CursoDetalhePage.jsx
    - apps/web/src/pages/curso/CursoCarrinhoPage.jsx

  O fluxo de inscrição condicional (gratuito/pago) permanece intacto:
    - GRATUITO: exige login PocketBase → sincroniza usuário (ensure)
      → autentica na plataforma (bridge-login) → redireciona para a
      plataforma de cursos.
    - PAGO: adiciona curso real (com preço da API) ao carrinho →
      redireciona para o carrinho → checkout na plataforma.

CÓDIGO ANTES:
  const PLATAFORMA_CURSOS_URL = 'http://69.62.124.240:3333/';

CÓDIGO DEPOIS:
  const PLATAFORMA_CURSOS_URL = 'https://cursos.conexaobatista.com.br';

IMPACTO:
  O redirecionamento pós-inscrição/checkout agora aponta para a
  plataforma de cursos funcional (HTTPS), permitindo que o usuário
  conclua a matrícula sem timeout.

================================================================================
5. Limpeza Total - Remoção de IP Morto e Paths Incorretos
================================================================================

PROBLEMA:
  Referências ao IP morto 69.62.124.240:3333 persistiam em múltiplos
  arquivos do código funcional (backend, hooks PocketBase, frontend),
  representando risco de timeout e confusão de manutenção.

CORREÇÃO:
  Remoção/atualização de TODAS as referências funcionais ao IP morto
  69.62.124.240:3333 do código:

  Backend — fallbacks de URL (5 arquivos):
    - cursos-mentor-status.js    → https://api.conexaobatista.com.br
    - batista.js                 → https://api.conexaobatista.com.br
    - cursos-cadastro.js         → https://api.conexaobatista.com.br
    - cursos-usuario-ensure.js   → https://api.conexaobatista.com.br
    - cursos-sso.js              → https://api.conexaobatista.com.br

  PocketBase hooks — fallbacks de URL (4 ocorrências):
    - cursos_sso.pb.js           → https://api.conexaobatista.com.br

  Frontend — URLs de redirecionamento (4 arquivos):
    - CursoDetalhePage.jsx       → https://cursos.conexaobatista.com.br
    - CursoCarrinhoPage.jsx      → https://cursos.conexaobatista.com.br
    - CursosPage.jsx (2 links)   → https://cursos.conexaobatista.com.br
    - CadastroCursosPage.jsx     → https://cursos.conexaobatista.com.br

  NOTA: Referências ao IP morto em textos de relatórios anteriores
  (relatorio-download.js) são conteúdo histórico e foram preservadas
  intactas — não são código funcional.

VERIFICAÇÃO:
  Busca (grep) por 69.62.124.240 em apps/ após a correção retorna
  apenas referências em conteúdo de relatórios históricos (texto),
  não em código funcional. Nenhuma chamada fetch ou redirecionamento
  utiliza o IP morto.

IMPACTO:
  Base de código limpa e consistente. Todos os endpoints apontam
  para domínios funcionais (HTTPS). Elimina o risco de timeout
  silencioso e facilita a manutenção futura.

================================================================================
RESUMO DAS CORREÇÕES
================================================================================

  Arquivos editados (código funcional): 13
    Backend:     5 arquivos (fallbacks de URL)
    PB hooks:    1 arquivo  (4 fallbacks de URL)
    Frontend:    4 arquivos (URLs de redirecionamento)
    API routes:  1 arquivo  (novo relatório + registro)
    Admin UI:    1 arquivo  (novo card de relatório)
    Index:       1 arquivo  (registro de rota)

  Novas rotas: 1
    GET /relatorio-correcao-critica-api/download (adminAuth)

  Testes realizados:
    ✅ curl https://api.conexaobatista.com.br/health → {"status":"ok"}
    ✅ curl https://api.conexaobatista.com.br/cursos → JSON com cursos
    ✅ curl https://api.conexaobatista.com.br/cursos/29 → JSON com detalhes
    ✅ grep 69.62.124.240 em código funcional → 0 ocorrências ativas
    ✅ grep /api/cursos em frontend → 0 chamadas fetch reais

================================================================================
FIM DO RELATÓRIO
================================================================================`;
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-correcao-critica-api] Solicitação de relatório de correção crítica por: ${solicitante}`,
  );

  const conteudo = montarRelatorioCorrecaoCriticaApi();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-correcao-critica-api-26-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
