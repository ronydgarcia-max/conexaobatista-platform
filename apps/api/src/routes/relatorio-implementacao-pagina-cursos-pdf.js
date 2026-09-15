// Download do relatório de IMPLEMENTAÇÃO - NOVA PÁGINA DE CURSOS COM LEITOR
// DE PDF (.txt gerado em memória).
//
// Documenta a implementação de uma nova página moderna de aula com leitor de
// PDF integrado no frontend (Conexão Cursos), substituindo visualmente o
// painel-aluno.html da VPS — SEM alterar backend, rotas, SSO, autenticação ou
// permissões.
//
// Alterações no frontend:
//   - apps/web/src/pages/curso/CursoAulaPage.jsx (NOVO) — leitor de PDF com
//     pdf.js (uma página por vez em <canvas>), controles Anterior/Próxima,
//     indicador "Página X de Y", botão de download, responsivo.
//   - apps/web/src/pages/curso/CursoMeusCursosPage.jsx — botão "Abrir aula
//     (PDF)" adicionado em cada curso matriculado.
//   - apps/web/src/App.jsx — rota /curso/:id/aula registrada.
//
// Rota protegida por adminAuth (coleção `admins`).
// GET /relatorio-implementacao-pagina-cursos-pdf/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const agora = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "long",
  });

  return `================================================================================
RELATÓRIO DE IMPLEMENTAÇÃO - Nova Página de Cursos com Leitor de PDF - 31/08/2026 18:14
================================================================================

Período: 31/08/2026
Data/hora de geração: ${agora} (horário de Brasília)

------------------------------------------------------------------------------
ÍNDICE
------------------------------------------------------------------------------
  1. Objetivo
  2. Escopo e Restrições
  3. Alterações no Frontend
  4. Componentes Envolvidos
  5. Comportamento do Leitor de PDF
  6. Origem do Arquivo PDF
  7. Integrações Preservadas
  8. Validação Realizada
  9. Etapas de Implantação na VPS
 10. Dependências
 11. Próximas Etapas (Opcional)

================================================================================
1. Objetivo
================================================================================

  Substituir visualmente o painel-aluno.html (VPS) por uma nova página moderna
  no frontend do Conexão Batista, com leitor de PDF integrado, mantendo o
  padrão visual existente (cores, tipografia, identidade, espaçamentos).

================================================================================
2. Escopo e Restrições
================================================================================

  Escopo: apenas camada de apresentação (frontend).
  Restrições respeitadas:
    - NÃO alterar backend.
    - NÃO alterar rotas existentes (apenas adicionar /curso/:id/aula).
    - NÃO alterar SSO do aluno.
    - NÃO alterar autenticação.
    - NÃO alterar permissões de acesso.
    - NÃO alterar a API de cursos.

================================================================================
3. Alterações no Frontend
================================================================================

  (a) apps/web/src/pages/curso/CursoAulaPage.jsx (NOVO)
      Nova página de aula com leitor de PDF integrado. Renderiza UMA página
      por vez em <canvas> via pdf.js (pdfjs-dist 6.2.108, já instalado).
      Indicador "Página X de Y", controles Anterior/Próxima (com limites
      respeitados — não navega além do início/fim), botão separado de
      download, layout responsivo (desktop e celular), re-renderização ao
      redimensionar a janela. Coluna lateral com informações do curso
      (descrição, objetivos, público-alvo, pré-requisitos, matriz
      curricular). Consome o proxy público existente GET /cursos-publicados/:id
      (sem autenticação, sem mixed content).

  (b) apps/web/src/pages/curso/CursoMeusCursosPage.jsx (ATUALIZADO)
      Adicionado botão secundário "Abrir aula (PDF)" em cada curso
      matriculado, navegando para /curso/:id/aula. O botão primário
      "Acessar curso" (redirecionamento SSO para a VPS) foi preservado.

  (c) apps/web/src/App.jsx (ATUALIZADO)
      Import de CursoAulaPage e registro da rota /curso/:id/aula dentro do
      CursoLayout (área isolada da plataforma de cursos).

================================================================================
4. Componentes Envolvidos
================================================================================

  - CursoAulaPage.jsx (leitor de PDF) — NOVO
  - CursoMeusCursosPage.jsx (listagem de cursos matriculados) — ATUALIZADO
  - App.jsx (roteamento) — ATUALIZADO
  - cursosService.js (serviço de cursos) — sem alterações
  - CursoLayout.jsx (layout da plataforma) — sem alterações

================================================================================
5. Comportamento do Leitor de PDF
================================================================================

  - Recebe a URL do PDF (Cloudinary) do backend em curso.pdf_url (ou
    variantes pdfUrl / arquivo_pdf / material_url).
  - Carrega o documento com pdf.js (pdfjsLib.getDocument) e obtém o número
    real de páginas (doc.numPages) — não estima.
  - Exibe UMA página por vez em <canvas> (renderização vetorial, nítida em
    qualquer densidade de tela — usa devicePixelRatio).
  - Indicador: "Página X de Y" (ex.: 1/3, 2/3, 3/3).
  - Controles: botão "Anterior" (desabilitado na página 1) e "Próxima"
    (desabilitado na última página) — impede navegação além do início/fim.
  - Responsivo: re-renderiza a página ao redimensionar a janela; largura
    do canvas acompanha o container.
  - Botão separado "Baixar PDF" (download direto da URL do Cloudinary).
  - Renderização em <canvas> funciona em desktop e celular (não depende do
    visualizador de PDF nativo do navegador, ausente em muitos mobiles).
  - Quando o curso não possui PDF, exibe um estado vazio amigável com link
    para o painel do curso (SSO VPS).

================================================================================
6. Origem do Arquivo PDF
================================================================================

  - URL fornecida pelo backend em curso.pdf_url.
  - Armazenado no Cloudinary.
  - Carregado diretamente pelo pdf.js no navegador (HTTPS — sem mixed
    content, pois o proxy /cursos-publicados/:id já resolve o detalhe do
    curso; a URL do Cloudinary é HTTPS).

================================================================================
7. Integrações Preservadas
================================================================================

  - Autenticação de aluno (PocketBase) — sem alterações.
  - SSO do aluno (GET /aluno-sso) — sem alterações.
  - Rotas de matrícula (POST /cursos/:id/matricula) — sem alterações.
  - Permissões de acesso — sem alterações.
  - API de cursos (proxy /cursos-publicados/:id) — sem alterações.
  - Fluxo "Acessar curso" (SSO VPS) — sem alterações (botão primário
    mantido em MeusCursosPage e link lateral em CursoAulaPage).

================================================================================
8. Validação Realizada
================================================================================

  - Página carrega detalhes do curso via proxy público existente.
  - Leitor de PDF renderiza uma página por vez em <canvas>.
  - Navegação página a página respeita os limites (1..N).
  - Botão de download dispara o download do PDF.
  - Layout responsivo em desktop e celular.
  - Estado vazio quando o curso não possui PDF.
  - Sem alterações no backend, SSO, autenticação ou permissões.
  - Padrão visual mantido (cores #1e3a8a / #f59e0b, Montserrat/Open Sans,
    espaçamentos, cards arredondados).

================================================================================
9. Etapas de Implantação na VPS
================================================================================

  1. Exportar arquivos do frontend:
     - apps/web/src/pages/curso/CursoAulaPage.jsx

  2. Substituir na VPS:
     - O arquivo painel-aluno.html será substituído visualmente pela nova
       página CursoAulaPage.jsx compilada no bundle do frontend.
     - Os estilos são Tailwind (já integrados no bundle).

  3. Instruções de Cópia (opcional, se a VPS precisar de uma versão HTML
     estática):
     - Compilar CursoAulaPage.jsx para HTML estático (ou servir via React).
     - Integrar estilos equivalentes no HTML.
     - Manter a referência à URL do PDF do Cloudinary (curso.pdf_url).

  4. Validação na VPS:
     - Acessar /curso/:id/aula.
     - Verificar carregamento do leitor de PDF.
     - Testar navegação entre páginas (1/N → N/N → 1/N).
     - Confirmar download do PDF.
     - Testar responsividade (mobile).

================================================================================
10. Dependências
================================================================================

  - pdfjs-dist 6.2.108 (já instalado em apps/web) — renderização de PDF.
  - React + Vite + Tailwind (stack existente).
  - Nenhuma dependência adicional adicionada.

================================================================================
11. Próximas Etapas (Opcional)
================================================================================

  - Adicionar anotações no PDF.
  - Implementar busca no texto do PDF.
  - Adicionar marcadores de página (bookmarks).
  - Integrar com o sistema de progresso do aluno (marcar página atual como
    vista).
  - Adicionar miniaturas laterais para navegação rápida.

================================================================================
FIM DO RELATÓRIO
================================================================================`;
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-implementacao-pagina-cursos-pdf] Solicitação de relatório de implementação da nova página de cursos com leitor de PDF por: ${solicitante}`,
  );

  const conteudo = montarRelatorio();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-implementacao-pagina-cursos-pdf-31-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
