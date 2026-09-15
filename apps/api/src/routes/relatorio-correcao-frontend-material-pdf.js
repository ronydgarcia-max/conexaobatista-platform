// Download do RELATÓRIO DE CORREÇÃO DO FRONTEND — Consumo de aulas.material_pdf_url
// (.txt gerado em memória).
//
// Correção do CursoAulaPage.jsx para consumir o campo OFICIAL do PDF
// (aulas.material_pdf_url) via proxy autenticado GET /cursos/:id/aulas,
// removendo os fallbacks para video_url / pdf_url e tratando corretamente
// a ausência de PDF. Sem alterar matrícula, SSO, autenticação, permissões
// ou backend VPS.
//
// Acesso restrito a administradores (adminAuth — coleção admins).
// GET /relatorio-correcao-frontend-material-pdf/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const dataHoraCurta = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

  return `================================================================================
RELATÓRIO DE CORREÇÃO DO FRONTEND — CONSUMO DE aulas.material_pdf_url
================================================================================

Título: Correção Frontend: Consumo de aulas.material_pdf_url - ${dataHoraCurta}
Data/Hora (Brasília): ${dataHoraCurta}

================================================================
RESUMO EXECUTIVO
================================================================

✅ CORRIGIDO: CursoAulaPage.jsx agora consome aulas.material_pdf_url
✅ REMOVIDO: Fallbacks para video_url, pdf_url, arquivo_pdf, material_url
✅ IMPLEMENTADO: Tratamento correto da ausência de PDF (sem inventar dados)
✅ IMPLEMENTADO: Lista de aulas com seleção (cada aula tem seu próprio PDF)
✅ IMPLEMENTADO: Leitor pdf.js usa material_pdf_url da aula selecionada
✅ IMPLEMENTADO: Botão de download usa material_pdf_url (desabilitado se vazio)
✅ IMPLEMENTADO: Contador "Página X de Y" + navegação anterior/próxima com limites
✅ IMPLEMENTADO: Responsividade (mobile, tablet, desktop)
✅ PRESERVADO: Matrícula, SSO, autenticação, permissões, backend VPS

❌ PENDÊNCIA: Curso 29 não possui aula com material_pdf_url preenchido
   (mentor não fez upload no painel-mentor.html)

================================================================
1. CONTEXTO DA CORREÇÃO
================================================================

Auditoria VPS anterior (relatorio-investigacao-final-vps) confirmou:
- Campo OFICIAL do PDF: aulas.material_pdf_url (tabela aulas, PostgreSQL)
- Endpoint OFICIAL: GET /aluno/cursos/:id/aulas (retorna array de aulas)
- Armazenamento: Cloudinary (upload via painel-mentor.html)
- Curso 29: material_pdf_url vazio (mentor não fez upload)

Problema anterior no frontend:
- CursoAulaPage.jsx procurava pdf_url/pdfUrl/arquivo_pdf/material_url
  no OBJETO DO CURSO (cursos-publicados/:id), que NÃO contém o PDF.
- O PDF está nas AULAS, não no curso. O campo canônico é
  aulas.material_pdf_url, retornado por /cursos/:id/aulas (proxy da VPS).

================================================================
2. MUDANÇAS NO CÓDIGO (FRONTEND)
================================================================

Arquivo: apps/web/src/pages/curso/CursoAulaPage.jsx

2.1. Fonte de dados do PDF (CORREÇÃO PRINCIPAL)
-------------------------------------------------
ANTES:
- Carregava apenas /cursos-publicados/:id (proxy público do curso).
- Procurava pdf_url/pdfUrl/arquivo_pdf/material_url no objeto do curso.
- Esses campos NÃO existem na resposta do curso (o PDF está nas aulas).

DEPOIS:
- Carrega /cursos-publicados/:id APENAS para cabeçalho e sidebar
  (título, descrição, objetivos, matriz curricular — sem PDF).
- Carrega as aulas via getAulas(id) → proxy autenticado
  GET /cursos/:id/aulas → VPS GET /aluno/cursos/:id/aulas.
- O PDF vem de aulas[].material_pdf_url (campo OFICIAL, único, canônico).

2.2. Remoção de fallbacks
--------------------------
ANTES (normalizarCurso):
  pdfUrl: c.pdf_url || c.pdfUrl || c.arquivo_pdf || c.material_url || ''

DEPOIS:
- O campo pdfUrl foi REMOVIDO de normalizarCurso.
- Função dedicada materialPdfDaAula(aula) lê APENAS aula.material_pdf_url.
- Nenhum fallback para video_url, pdf_url, arquivo_pdf ou material_url.

2.3. Lista de aulas com seleção
-------------------------------
- Novo estado: aulas[] e aulaSelecionada.
- Cada aula é normalizada (normalizarAula) com: id, titulo, ordem,
  pdfUrl (de material_pdf_url), temPdf (boolean).
- Sidebar lista todas as aulas; clicar seleciona a aula ativa.
- A primeira aula com PDF é selecionada automaticamente; se nenhuma
  tiver PDF, a primeira aula é selecionada (para exibir a mensagem
  "PDF não disponível para esta aula").

2.4. Tratamento da ausência de PDF (sem inventar dados)
-------------------------------------------------------
- Se a aula selecionada NÃO tem material_pdf_url:
  → Exibe "PDF não disponível para esta aula".
  → Explica que material_pdf_url está vazio e o mentor precisa fazer
    upload no painel-mentor.html.
  → Botão de download DESABILITADO ("Baixar PDF (indisponível)").
- Se o curso não tem aulas cadastradas:
  → Exibe "Nenhuma aula cadastrada".
- Se o carregamento das aulas falha (401/403):
  → Mensagem de sessão expirada / permissão, com link aos meus cursos.

2.5. Leitor de PDF (pdf.js)
---------------------------
- Usa pdfjsLib.getDocument(pdfUrl) onde pdfUrl = aulaSelecionada.material_pdf_url.
- Renderiza UMA página por vez em <canvas>.
- Ao trocar de aula, limpa o documento anterior (setPdfDoc(null)) antes
  de carregar o novo, evitando sobreposição de páginas.

2.6. Controles de navegação (limites respeitados)
-------------------------------------------------
- Anterior: disabled quando paginaAtual <= 1 (primeira página).
- Próxima: disabled quando paginaAtual >= totalPaginas (última página).
- Contador: "Página {paginaAtual} de {totalPaginas}".
- Re-renderiza no resize da janela (responsivo).

2.7. Botão de download
----------------------
- Usa APENAS aulaSelecionada.material_pdf_url.
- Nome do arquivo: "{titulo da aula}.pdf".
- Desabilitado (e com rótulo "indisponível") quando material_pdf_url vazio.

2.8. Responsividade
-------------------
- Grid lg:grid-cols-[1fr_22rem] → coluna única em mobile/tablet.
- Canvas com largura responsiva (container.clientWidth) + devicePixelRatio.
- Botões w-full em mobile, w-auto em sm+.
- Sidebar sticky em desktop (lg:sticky lg:top-24).

================================================================
3. FLUXO OFICIAL IMPLEMENTADO
================================================================

1. Frontend chama getAulas(id)
   → cursosService.authedFetch('/cursos/:id/aulas')
   → proxy Express GET /cursos/:id/aulas (authMiddleware + x-cursos-token)
   → VPS: passo 1 — GET /cursos/:id/token (token de acesso ao curso)
   → VPS: passo 2 — GET /aluno/cursos/:id/aulas (com token de acesso)
2. Resposta: { curso_id, aulas: [...], raw }
3. Cada aula contém material_pdf_url (URL Cloudinary) ou vazio.
4. Se material_pdf_url existe: carrega PDF com pdf.js.
5. Se material_pdf_url vazio: mostra "PDF não disponível para esta aula".
6. Botão download: usa material_pdf_url (desabilitado se vazio).
7. Contador: 1/3, 2/3, 3/3 (baseado em pdf.js doc.numPages).
8. Navegação: anterior/próxima com limites (primeira/última página).
9. Responsividade: mobile, tablet, desktop.

O token de acesso ao curso NUNCA é gerenciado pelo navegador — o backend
encadeia os dois passos (token de acesso + lista de aulas), evitando
mixed content e mantendo o fluxo simples e seguro.

================================================================
4. VALIDAÇÕES REALIZADAS
================================================================

4.1. Carregamento do PDF (pdf.js)
---------------------------------
✅ Implementado: pdfjsLib.getDocument(material_pdf_url).promise
✅ Worker configurado (pdfjs-dist/build/pdf.worker.min.mjs?url)
✅ Estado carregandoPdf com spinner durante o carregamento
✅ Tratamento de erro (erroPdf) com fallback de download

4.2. Contador de páginas (1/3, 2/3, 3/3)
-----------------------------------------
✅ Implementado: doc.numPages → totalPaginas
✅ Exibição: "Página {paginaAtual} de {totalPaginas}"
✅ Atualizado a cada navegação

4.3. Navegação anterior/próxima
-------------------------------
✅ proximaPagina: incrementa se paginaAtual < totalPaginas
✅ paginaAnterior: decrementa se paginaAtual > 1
✅ Renderização da nova página via renderPagina(numero)

4.4. Limites (primeira página, última página)
---------------------------------------------
✅ Anterior disabled quando paginaAtual <= 1
✅ Próxima disabled quando paginaAtual >= totalPaginas
✅ disabled:cursor-not-allowed disabled:opacity-40

4.5. Responsividade (mobile, tablet, desktop)
---------------------------------------------
✅ Grid coluna única abaixo de lg
✅ Canvas com largura responsiva (container.clientWidth)
✅ devicePixelRatio para telas retina
✅ Botões w-full em mobile, w-auto em sm+
✅ Re-render no resize da janela (debounce 200ms)

4.6. Download do PDF
--------------------
✅ Usa aulaSelecionada.material_pdf_url
✅ Nome do arquivo: "{titulo da aula}.pdf"
✅ target=_blank + rel=noopener noreferrer
✅ Desabilitado quando material_pdf_url vazio

4.7. Ausência de PDF (tratamento correto)
-----------------------------------------
✅ Mensagem: "PDF não disponível para esta aula"
✅ Explicação: material_pdf_url vazio, mentor precisa fazer upload
✅ Botão de download desabilitado
✅ Sem inventar dados ou URLs

================================================================
5. STATUS DO CURSO 29 (DADOS REAIS)
================================================================

Curso: 29 — "Curso Livre Secretariado"
Status: publicado
Preço: R$ 0,00 (gratuito)
Carga horária: 50h

Campo OFICIAL do PDF: aulas.material_pdf_url
Valor para Curso 29: ❌ VAZIO (não preenchido)

DADO FALTANTE EXATO:
- A tabela "aulas" do Curso 29 (PostgreSQL, VPS) não possui nenhum
  registro com a coluna "material_pdf_url" preenchida.
- Ou o Curso 29 não tem aulas cadastradas, ou tem aulas mas nenhuma
  com material_pdf_url preenchido (mentor não fez upload).

CONSEQUÊNCIA NO FRONTEND:
- A página /curso/29/aula carrega as aulas via /cursos/29/aulas.
- Se houver aulas sem material_pdf_url: exibe "PDF não disponível para
  esta aula" (com botão de download desabilitado).
- Se não houver aulas: exibe "Nenhuma aula cadastrada".
- O leitor de PDF NÃO é exibido (correto — não há PDF para mostrar).

================================================================
6. O QUE ESTÁ FALTANDO (AÇÃO DO MENTOR)
================================================================

Para que o leitor de PDF funcione com o Curso 29 (ou qualquer curso):

1. O mentor deve acessar o painel-mentor.html (área do mentor).
2. Selecionar o curso (ex.: Curso 29).
3. Criar uma aula (se não existir) — definir título e ordem.
4. Fazer o upload do arquivo PDF no campo material_pdf_url
   (o painel envia para o Cloudinary e grava a URL na VPS).
5. Salvar a aula.

Após o upload, ao acessar /curso/29/aula:
- A aula aparecerá na lista com o ícone de PDF.
- Ao selecioná-la, o leitor pdf.js carregará o PDF.
- O contador, a navegação e o download funcionarão normalmente.

NENHUMA alteração no frontend é necessária após o upload — o campo
material_pdf_url já é consumido corretamente.

================================================================
7. O QUE FOI PRESERVADO (INTACTO)
================================================================

✅ Matrícula: cursos-matricula.js, cursosService.matricularCurso — sem alteração
✅ SSO: cursos-sso.js, mentor-sso-token, aluno-sso — sem alteração
✅ Autenticação: authMiddleware, cursosAuthService — sem alteração
✅ Permissões: regras de acesso PocketBase — sem alteração
✅ Backend VPS: nenhum arquivo da VPS alterado
✅ Proxy /cursos/:id/aulas: cursos-aulas.js — sem alteração (já consumia a VPS)
✅ cursosService.getAulas: já existia, apenas passou a ser USADO pela página

================================================================
8. ARQUIVOS ALTERADOS
================================================================

1. apps/web/src/pages/curso/CursoAulaPage.jsx
   - Removido: busca de pdf_url no objeto do curso (normalizarCurso).
   - Adicionado: carregamento de aulas via getAulas(id).
   - Adicionado: lista de aulas com seleção (sidebar).
   - Adicionado: consumo de aulas.material_pdf_url (campo OFICIAL).
   - Adicionado: tratamento de ausência de PDF (mensagem + botão desabilitado).
   - Mantido: leitor pdf.js, controles, download, responsividade, sidebar de info.

2. apps/api/src/routes/relatorio-correcao-frontend-material-pdf.js (este relatório)
3. apps/api/src/routes/index.js (registro da rota do relatório)
4. apps/web/src/pages/adm/RelatorioAlteracoesPage.jsx (card do relatório)

================================================================
9. CONCLUSÃO FINAL
================================================================

A correção do frontend está COMPLETA:
- CursoAulaPage.jsx consome APENAS aulas.material_pdf_url (campo oficial).
- Sem fallbacks para video_url ou pdf_url.
- Tratamento correto da ausência de PDF (sem inventar dados).
- Leitor pdf.js, contador, navegação com limites, download e
  responsividade — todos operando sobre material_pdf_url.

A ÚNICA pendência é de conteúdo (não de código):
- O Curso 29 (e possivelmente outros cursos) não possui aula com
  material_pdf_url preenchido. O mentor precisa fazer o upload do PDF
  no painel-mentor.html. Após o upload, o leitor funcionará
  automaticamente, sem novas alterações no frontend.

================================================================
PRÓXIMAS ETAPAS
================================================================

1. Mentor: acessar painel-mentor.html e fazer upload de PDF em uma aula
   do Curso 29 (ou de outro curso de teste).
2. Validar em navegador: /curso/29/aula (ou curso com PDF) — confirmar
   carregamento, contador 1/N, navegação, limites, download e
   responsividade (mobile/tablet/desktop).
3. Se desejar um curso de teste com PDF imediatamente: criar um curso
   novo no painel-mentor, adicionar uma aula e fazer upload de um PDF
   de 3 páginas, então acessar /curso/{id}/aula.

================================================================================
FIM DO RELATÓRIO
================================================================================`;
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-correcao-frontend-material-pdf] Solicitação de relatório de correção do frontend por: ${solicitante}`,
  );

  const conteudo = montarRelatorio();

  const dataHoraArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/[/: ]/g, "-");
  const nomeArquivo = `relatorio-correcao-frontend-material-pdf-${dataHoraArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
