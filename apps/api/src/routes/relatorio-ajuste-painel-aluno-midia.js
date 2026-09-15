// Download do RELATÓRIO DE AJUSTE DO PAINEL DO ALUNO — Renderização
// Condicional de Mídia (Vídeo/Imagem/PDF) (.txt gerado em memória).
//
// Ajuste do CursoAulaPage.jsx (página de aula / painel do aluno no app React)
// para renderizar condicionalmente a mídia principal da aula:
//   1. video_url  → embed do YouTube (iframe responsivo 16:9)
//   2. imagem_url → <img> no espaço principal
//   3. material_pdf_url → leitor PDF integrado (pdf.js, uma página por vez,
//      contador "Página X de Y", navegação anterior/próxima com limites,
//      sem download automático)
//   4. nenhum dos três → mensagem "Material indisponível para esta aula"
//
// O leitor PDF agora ocupa o espaço principal de mídia (não há mais leitor
// duplicado em seção inferior). O botão "Baixar PDF" é separado do leitor,
// visível apenas quando material_pdf_url existe, e abre em nova aba
// (target="_blank", href direto para material_pdf_url).
//
// Sem alterar matrícula, SSO, autenticação, permissões ou backend VPS.
//
// Acesso restrito a administradores (adminAuth — coleção admins).
// GET /relatorio-ajuste-painel-aluno-midia/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const dataHoraCurta = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

  return `================================================================================
RELATÓRIO DE AJUSTE DO PAINEL DO ALUNO — RENDERIZAÇÃO CONDICIONAL DE MÍDIA
================================================================================

Título: Ajuste Painel do Aluno: Renderização Condicional de Mídia - ${dataHoraCurta}
Data/Hora (Brasília): ${dataHoraCurta}

================================================================
RESUMO EXECUTIVO
================================================================

✅ IMPLEMENTADO: Renderização condicional de mídia principal (vídeo → imagem → PDF → mensagem)
✅ IMPLEMENTADO: Vídeo YouTube embed (iframe responsivo 16:9) quando video_url existe
✅ IMPLEMENTADO: Imagem no espaço principal quando imagem_url existe
✅ IMPLEMENTADO: Leitor PDF integrado (pdf.js) quando material_pdf_url existe
✅ IMPLEMENTADO: Contador de páginas "Página X de Y" (ex.: 1/3, 2/3, 3/3)
✅ IMPLEMENTADO: Navegação anterior/próxima com limites (primeira/última página)
✅ IMPLEMENTADO: Sem download automático (PDF apenas exibido no leitor)
✅ IMPLEMENTADO: Botão "Baixar PDF" separado do leitor (href direto, target=_blank)
✅ IMPLEMENTADO: Botão "Baixar PDF" visível apenas quando material_pdf_url existe
✅ IMPLEMENTADO: Mensagem "Material indisponível para esta aula" quando não há mídia
✅ REMOVIDO: Duplicidade de leitor PDF (agora apenas um leitor no espaço principal)
✅ IMPLEMENTADO: Lista de aulas com ícones por tipo de mídia (vídeo/imagem/PDF/sem)
✅ IMPLEMENTADO: Responsividade (mobile, tablet, desktop)
✅ PRESERVADO: Matrícula, SSO, autenticação, permissões, backend VPS, proxy /cursos/:id/aulas

❌ PENDÊNCIA (conteúdo, não código): Curso 29 não possui aula com material_pdf_url,
    video_url ou imagem_url preenchido (mentor não publicou conteúdo no painel-mentor)

================================================================
1. CONTEXTO DO AJUSTE
================================================================

Auditoria VPS anterior confirmou os campos OFICIAIS de mídia das aulas:
- Vídeos:  aulas.video_url        (URL YouTube)
- Imagens: aulas.imagem_url       (URL da imagem)
- PDF:     aulas.material_pdf_url (URL Cloudinary)

Endpoint OFICIAL: GET /aluno/cursos/:id/aulas (retorna array de aulas).
Proxy Express:    GET /cursos/:id/aulas (cursos-aulas.js — encadeia os dois
                  tokens da VPS; o navegador nunca gerencia o token de curso).

Estado anterior do CursoAulaPage.jsx:
- Consumia APENAS material_pdf_url (campo OFICIAL do PDF).
- Não exibia vídeo nem imagem — apenas PDF ou "PDF não disponível".
- Botão de download era um <button> programático (não <a href>).

Ajuste solicitado:
- Renderização condicional: vídeo → imagem → PDF → "Material indisponível".
- Leitor PDF integrado no espaço principal (sem duplicidade).
- Botão "Baixar PDF" separado, em nova aba, visível só quando há PDF.

================================================================
2. MUDANÇAS NO CÓDIGO (FRONTEND)
================================================================

Arquivo: apps/web/src/pages/curso/CursoAulaPage.jsx

2.1. Novas funções auxiliares de extração de mídia
---------------------------------------------------
- videoUrlDaAula(aula): lê aula.video_url (string trim).
- imagemUrlDaAula(aula): lê aula.imagem_url (ou aula.imagem legado).
- youtubeEmbedUrl(url): converte URL YouTube (watch?v=, youtu.be/,
  /embed/, /shorts/) em URL de embed. Se não for YouTube, devolve a
  URL original (outro player).
- materialPdfDaAula(aula): mantida — lê APENAS aula.material_pdf_url.

2.2. normalizarAula — tipo de mídia por aula
--------------------------------------------
Cada aula normalizada agora traz:
- videoUrl, imagemUrl, pdfUrl
- temVideo, temImagem, temPdf (booleanos)
- tipoMidia: 'video' | 'imagem' | 'pdf' | 'nenhum'
  Prioridade: vídeo → imagem → PDF → nenhum.

2.3. Espaço principal de mídia (renderização condicional)
---------------------------------------------------------
A área principal agora renderiza conforme tipoMidia da aula selecionada:

  tipoMidia === 'video':
    → <iframe src={youtubeEmbedUrl(video_url)}> em container 16:9
      responsivo (padding-bottom 56.25%), allowFullScreen.

  tipoMidia === 'imagem':
    → <img src={imagem_url} alt={titulo}> centralizado, max-w-full,
      sombra suave, dentro do mesmo container do leitor PDF.

  tipoMidia === 'pdf':
    → Leitor pdf.js integrado (canvas, uma página por vez).
    → Controles: Anterior (disabled na página 1) | "Página X de Y" |
      Próxima (disabled na última página).
    → Botão "Baixar PDF" separado (<a href={material_pdf_url}
      target="_blank" rel="noopener noreferrer">).
    → Sem download automático — o PDF só é exibido no leitor.

  tipoMidia === 'nenhum':
    → Mensagem "Material indisponível para esta aula" + explicação de
      que o mentor precisa publicar o conteúdo no painel do mentor.

2.4. Remoção de duplicidade
---------------------------
- Não há mais leitor PDF em seção inferior.
- Existe APENAS um leitor principal (o espaço de mídia).
- O botão "Baixar PDF" é separado do leitor (link, não integrado ao canvas).

2.5. Botão "Baixar PDF" (separado, nova aba)
--------------------------------------------
- Elemento: <a id="download-pdf-btn" href={pdfUrl} target="_blank"
  rel="noopener noreferrer">.
- Visível APENAS quando tipoMidia === 'pdf' (material_pdf_url existe).
- Usa href direto para material_pdf_url (sem programação de click).
- Abre em nova aba (target="_blank").
- No estado de erro de carregamento do PDF, um link "Baixar PDF" também
  é oferecido como fallback (mesmo padrão href + target=_blank).

2.6. Lista de aulas — ícones por tipo de mídia
----------------------------------------------
A sidebar de aulas agora exibe ícones conforme o tipo de mídia:
- vídeo  → ícone Video
- imagem → ícone Image
- PDF    → ícone FileText
- nenhum → ícone FileX (acinzentado)

2.7. Badge do cabeçalho da aula
-------------------------------
O badge ao lado do título da aula agora reflete o tipo de mídia:
- "Vídeo" / "Imagem" / "PDF disponível" / "Sem material".

2.8. Responsividade
-------------------
- Grid lg:grid-cols-[1fr_22rem] → coluna única em mobile/tablet.
- iframe 16:9 responsivo (padding-bottom 56.25%).
- Canvas com largura responsiva (container.clientWidth) + devicePixelRatio.
- Botões w-full em mobile, w-auto em sm+.
- Re-render do canvas no resize da janela (debounce 200ms).
- Sidebar sticky em desktop (lg:sticky lg:top-24).

================================================================
3. FLUXO OFICIAL IMPLEMENTADO
================================================================

1. Aluno acessa /curso/:id/aula (página de aula / painel do aluno).
2. Frontend carrega o curso (cabeçalho/sidebar) via /cursos-publicados/:id.
3. Frontend chama getAulas(id)
   → proxy Express GET /cursos/:id/aulas (authMiddleware + x-cursos-token)
   → VPS: passo 1 — GET /cursos/:id/token (token de acesso ao curso)
   → VPS: passo 2 — GET /aluno/cursos/:id/aulas (com token de acesso)
4. Resposta: { curso_id, aulas: [...], raw }
5. Cada aula contém video_url, imagem_url e/ou material_pdf_url (ou vazio).
6. Renderização condicional (prioridade vídeo → imagem → PDF → nenhum):
   - video_url       → embed YouTube (iframe 16:9)
   - imagem_url      → <img> no espaço principal
   - material_pdf_url → leitor PDF (1/3, 2/3, 3/3) + botão "Baixar PDF"
   - nenhum          → "Material indisponível para esta aula"
7. Se PDF:
   - Leitor integrado no espaço principal (canvas, pdf.js)
   - Contador "Página X de Y"
   - Navegação anterior/próxima com limites
   - Botão "Baixar PDF" separado (href, target=_blank)
   - Sem download automático
8. Responsividade: mobile, tablet, desktop.

O token de acesso ao curso NUNCA é gerenciado pelo navegador — o backend
encadeia os dois passos (token de acesso + lista de aulas).

================================================================
4. VALIDAÇÕES REALIZADAS
================================================================

4.1. Renderização condicional (vídeo → imagem → PDF → mensagem)
---------------------------------------------------------------
✅ tipoMidia derivado por prioridade: vídeo > imagem > PDF > nenhum
✅ Vídeo: iframe YouTube embed (youtubeEmbedUrl converte watch/youtu.be/shorts)
✅ Imagem: <img> centralizado, max-w-full, sombra
✅ PDF: leitor pdf.js no espaço principal
✅ Nenhum: mensagem "Material indisponível para esta aula"

4.2. Carregamento do PDF (pdf.js)
---------------------------------
✅ pdfjsLib.getDocument(material_pdf_url).promise
✅ Worker configurado (pdfjs-dist/build/pdf.worker.min.mjs?url)
✅ Estado carregandoPdf com spinner
✅ Tratamento de erro (erroPdf) com fallback de download (link)

4.3. Contador de páginas (1/3, 2/3, 3/3)
-----------------------------------------
✅ doc.numPages → totalPaginas
✅ Exibição: "Página {paginaAtual} de {totalPaginas}"
✅ Atualizado a cada navegação

4.4. Navegação anterior/próxima
-------------------------------
✅ proximaPagina: incrementa se paginaAtual < totalPaginas
✅ paginaAnterior: decrementa se paginaAtual > 1
✅ Renderização da nova página via renderPagina(numero)

4.5. Limites (primeira página, última página)
---------------------------------------------
✅ Anterior disabled quando paginaAtual <= 1
✅ Próxima disabled quando paginaAtual >= totalPaginas
✅ disabled:cursor-not-allowed disabled:opacity-40

4.6. Sem download automático
----------------------------
✅ O PDF é apenas exibido no leitor (canvas)
✅ Nenhum <a download> ou click programático disparado no carregamento
✅ O download só ocorre quando o aluno clica em "Baixar PDF"

4.7. Botão "Baixar PDF" (separado, nova aba)
--------------------------------------------
✅ Elemento <a href={material_pdf_url} target="_blank" rel="noopener noreferrer">
✅ Visível apenas quando tipoMidia === 'pdf'
✅ href direto para material_pdf_url (sem programação de click)
✅ Abre em nova aba (target="_blank")
✅ Separado do leitor (não integrado ao canvas/controles)

4.8. Remoção de duplicidade
---------------------------
✅ Apenas um leitor PDF (espaço principal de mídia)
✅ Sem leitor PDF em seção inferior

4.9. Responsividade (mobile, tablet, desktop)
---------------------------------------------
✅ Grid coluna única abaixo de lg
✅ iframe 16:9 responsivo (padding-bottom 56.25%)
✅ Canvas com largura responsiva (container.clientWidth) + devicePixelRatio
✅ Botões w-full em mobile, w-auto em sm+
✅ Re-render no resize da janela (debounce 200ms)

4.10. Mensagem "Material indisponível"
--------------------------------------
✅ Exibida quando tipoMidia === 'nenhum' (sem vídeo/imagem/PDF)
✅ Texto: "Material indisponível para esta aula"
✅ Explicação: mentor precisa publicar o conteúdo no painel do mentor

================================================================
5. STATUS DO CURSO 29 (DADOS REAIS)
================================================================

Curso: 29 — "Curso Livre Secretariado"
Status: publicado
Preço: R$ 0,00 (gratuito)
Carga horária: 50h

Campos OFICIAIS de mídia das aulas:
- aulas.video_url        → ❌ VAZIO
- aulas.imagem_url       → ❌ VAZIO
- aulas.material_pdf_url → ❌ VAZIO

DADO FALTANTE EXATO:
- A tabela "aulas" do Curso 29 (PostgreSQL, VPS) não possui nenhum
  registro com video_url, imagem_url OU material_pdf_url preenchidos.
- Ou o Curso 29 não tem aulas cadastradas, ou tem aulas mas nenhuma com
  mídia publicada (mentor não fez upload no painel-mentor.html).

CONSEQUÊNCIA NO FRONTEND:
- A página /curso/29/aula carrega as aulas via /cursos/29/aulas.
- Se houver aulas sem mídia: exibe "Material indisponível para esta aula".
- Se não houver aulas: exibe "Nenhuma aula cadastrada".
- Nenhum leitor/vídeo/imagem é exibido (correto — não há mídia).

NOTA: Não foi possível validar com um PDF real de 3 páginas porque
nenhuma aula de nenhum curso acessível possui material_pdf_url
preenchido no momento. A lógica de renderização está implementada e
operará automaticamente assim que o mentor publicar conteúdo.

================================================================
6. O QUE ESTÁ FALTANDO (AÇÃO DO MENTOR)
================================================================

Para validar com PDF real de 3 páginas (ou vídeo/imagem):

1. O mentor deve acessar o painel-mentor.html (área do mentor).
2. Selecionar o curso (ex.: Curso 29).
3. Criar uma aula (se não existir) — definir título e ordem.
4. Publicar conteúdo na aula (UM dos campos):
   - video_url        → colar URL do YouTube
   - imagem_url       → fazer upload da imagem
   - material_pdf_url → fazer upload do PDF (Cloudinary)
5. Salvar a aula.

Após a publicação, ao acessar /curso/29/aula:
- A aula aparecerá na lista com o ícone correspondente (vídeo/imagem/PDF).
- Ao selecioná-la, o espaço principal renderizará a mídia correta:
  - vídeo → embed YouTube
  - imagem → <img>
  - PDF → leitor pdf.js (1/3, 2/3, 3/3) + botão "Baixar PDF"
- NENHUMA alteração no frontend é necessária após o upload.

================================================================
7. O QUE FOI PRESERVADO (INTACTO)
================================================================

✅ Matrícula: cursos-matricula.js, cursosService.matricularCurso — sem alteração
✅ SSO: cursos-sso.js, mentor-sso-token, aluno-sso — sem alteração
✅ Autenticação: authMiddleware, cursosAuthService — sem alteração
✅ Permissões: regras de acesso PocketBase — sem alteração
✅ Backend VPS: nenhum arquivo da VPS alterado
✅ Proxy /cursos/:id/aulas: cursos-aulas.js — sem alteração (já devolve as aulas)
✅ cursosService.getAulas: sem alteração (já devolve { aulas, raw })

================================================================
8. ARQUIVOS ALTERADOS
================================================================

1. apps/web/src/pages/curso/CursoAulaPage.jsx
   - Adicionado: videoUrlDaAula, imagemUrlDaAula, youtubeEmbedUrl.
   - Adicionado: normalizarAula com videoUrl/imagemUrl/tipoMidia.
   - Adicionado: renderização condicional vídeo/imagem/PDF/mensagem.
   - Adicionado: iframe YouTube embed (16:9 responsivo).
   - Adicionado: <img> no espaço principal.
   - Adicionado: botão "Baixar PDF" como <a href target=_blank> separado.
   - Removido: botão programático baixarPdf (substituído por link).
   - Removido: duplicidade de leitor PDF (apenas espaço principal).
   - Alterado: mensagem de ausência → "Material indisponível para esta aula".
   - Alterado: ícones da lista de aulas por tipo de mídia.
   - Alterado: badge do cabeçalho por tipo de mídia.

2. apps/api/src/routes/relatorio-ajuste-painel-aluno-midia.js (este relatório)
3. apps/api/src/routes/index.js (registro da rota do relatório)
4. apps/web/src/pages/adm/RelatorioAlteracoesPage.jsx (card do relatório)

================================================================
9. CONCLUSÃO FINAL
================================================================

O ajuste do painel do aluno está COMPLETO:
- Renderização condicional de mídia: vídeo → imagem → PDF → mensagem.
- Leitor PDF integrado no espaço principal (sem duplicidade).
- Contador "Página X de Y" + navegação anterior/próxima com limites.
- Sem download automático.
- Botão "Baixar PDF" separado (href direto, target=_blank, só quando há PDF).
- Mensagem "Material indisponível para esta aula" quando não há mídia.
- Responsividade mobile/tablet/desktop.

A ÚNICA pendência é de conteúdo (não de código):
- O Curso 29 (e possivelmente outros cursos) não possui aula com
  video_url, imagem_url ou material_pdf_url preenchido. O mentor precisa
  publicar o conteúdo no painel-mentor.html. Após a publicação, a
  renderização condicional funcionará automaticamente, sem novas
  alterações no frontend.

================================================================
PRÓXIMAS ETAPAS
================================================================

1. Mentor: acessar painel-mentor.html e publicar conteúdo em uma aula do
   Curso 29 (ou de outro curso de teste) — vídeo (YouTube), imagem ou PDF.
2. Validar em navegador: /curso/29/aula (ou curso com mídia) — confirmar
   renderização condicional, leitor PDF (1/N, navegação, limites), botão
   "Baixar PDF" (nova aba) e responsividade (mobile/tablet/desktop).
3. Para um teste imediato com PDF de 3 páginas: criar um curso novo no
   painel-mentor, adicionar uma aula e fazer upload de um PDF de 3
   páginas, então acessar /curso/{id}/aula.

================================================================================
FIM DO RELATÓRIO
================================================================================`;
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-ajuste-painel-aluno-midia] Solicitação de relatório de ajuste do painel do aluno por: ${solicitante}`,
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
  const nomeArquivo = `relatorio-ajuste-painel-aluno-midia-${dataHoraArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
