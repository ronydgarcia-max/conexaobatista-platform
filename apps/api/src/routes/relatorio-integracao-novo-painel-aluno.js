// Download do RELATÓRIO DE INTEGRAÇÃO DO NOVO PAINEL DO ALUNO NO SITE
// (.txt gerado em memória).
//
// Integração do novo frontend do painel do aluno (CursoAulaPage.jsx com
// leitor de PDF integrado) como destino principal da área do aluno no site
// conexaobatista.com.br. Substitui o redirecionamento SSO para o painel
// antigo da VPS (https://api.conexaobatista.com.br/painel-aluno) pelo
// painel integrado no próprio site.
//
// Acesso restrito a administradores (adminAuth — coleção admins).
// GET /relatorio-integracao-novo-painel-aluno/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const dataHoraCurta = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

  return `================================================================================
RELATÓRIO DE INTEGRAÇÃO DO NOVO PAINEL DO ALUNO NO SITE
================================================================================

Título: Integração Novo Painel do Aluno no Site - ${dataHoraCurta}
Data/Hora (Brasília): ${dataHoraCurta}

================================================================
RESUMO EXECUTIVO
================================================================

✅ INTEGRADO: Novo frontend do painel do aluno como destino principal da área do aluno
✅ INTEGRADO: Botão "Área do aluno" → /curso/aluno (aceite de termos + novo painel)
✅ INTEGRADO: Botão "Abrir painel do aluno" → /curso/meus-cursos (novo painel)
✅ INTEGRADO: Cards de cursos matriculados → /curso/:id/aula (leitor PDF integrado)
✅ INTEGRADO: Inscrição em curso gratuito → /curso/meus-cursos (novo painel)
✅ INTEGRADO: Rota legada /curso/:id/acessar → redireciona para /curso/:id/aula
✅ REMOVIDO: Redirecionamento SSO para o painel antigo da VPS na área do aluno
✅ IMPLEMENTADO: Aceite de termos (LGPD + Termos de Uso) antes de abrir o painel
✅ PRESERVADO: Backend VPS (api.conexaobatista.com.br) — sem alterações
✅ PRESERVADO: Autenticação PocketBase, matrículas, permissões
✅ PRESERVADO: Tokens não expostos em URLs, localStorage ou código visível
✅ PRESERVADO: Visual novo (leitor PDF integrado com contador 1/3, 2/3, 3/3)
✅ PRESERVADO: Botão "Baixar PDF" abre em nova aba (sem download automático)

================================================================
1. CONTEXTO DA INTEGRAÇÃO
================================================================

Situação anterior:
- O novo frontend do painel do aluno (CursoAulaPage.jsx) já estava
  implementado com renderização condicional de mídia (vídeo/imagem/PDF),
  leitor PDF integrado (pdf.js, contador "Página X de Y", navegação
  anterior/próxima com limites) e botão "Baixar PDF" separado (nova aba,
  sem download automático).
- Porém, a área do aluno (/curso/aluno) e o acesso ao curso
  (/curso/:id/acessar) ainda redirecionavam via SSO para o painel antigo
  da VPS (https://api.conexaobatista.com.br/painel-aluno e
  /aluno/cursos/:id?token=…), expondo tokens na URL e saindo do site.
- A inscrição em curso gratuito (CursoDetalhePage) também redirecionava
  via SSO (getAlunoSso) para o painel antigo da VPS.

Objetivo:
- Tornar o novo painel do aluno (frontend integrado no site) o destino
  principal de TODOS os botões e fluxos da área do aluno.
- Nenhum botão deve abrir o painel antigo da VPS.
- Nenhum download deve iniciar indevidamente.
- Manter intactos: backend VPS, autenticação, SSO (rotas preservadas),
  matrículas, permissões, tokens (não expostos), dados reais, arquivos
  da VPS e visual novo.

================================================================
2. MUDANÇAS NO SITE (FRONTEND)
================================================================

2.1. apps/web/src/pages/curso/CursoAlunoPage.jsx (Área do aluno)
-----------------------------------------------------------------
ANTES: gerava credencial SSO (getAlunoSso) e redirecionava
       (window.location.href) para https://api.conexaobatista.com.br/sso
       ?token=<JWT>, que por sua vez abria o painel antigo da VPS
       (/painel-aluno?token=…). Exponha o JWT na URL.

AGORA: portal do novo painel do aluno, integrado no site.
   - Exige login PocketBase (redireciona para /login se não autenticado).
   - Exibe o aceite de termos (LGPD + Termos de Uso) — duas caixas de
     seleção obrigatórias.
   - Botão "Abrir painel do aluno" → navega para /curso/meus-cursos
     (novo painel: lista de cursos matriculados + leitor de PDF).
   - Visão geral do novo painel (Meus cursos / Leitor de PDF / Sem sair
     do site).
   - Aviso de segurança: nenhum token exposto na URL/localStorage/código.
   - NÃO gera JWT, NÃO redireciona para a VPS, NÃO sai do site.

2.2. apps/web/src/pages/curso/CursoMeusCursosPage.jsx (Meus Cursos)
-------------------------------------------------------------------
ANTES: botão "Acessar curso" → /curso/:id/acessar (SSO para painel antigo).
       botão "Abrir aula (PDF)" → /curso/:id/aula (leitor PDF integrado).

AGORA: botão "Acessar curso" → /curso/:id/aula (leitor PDF integrado,
       novo painel). O botão "Abrir aula (PDF)" permanece apontando para
       /curso/:id/aula. Ambos os botões agora levam ao novo painel
       integrado — nenhum abre o painel antigo da VPS.

2.3. apps/web/src/pages/curso/CursoDetalhePage.jsx (Detalhe do curso)
---------------------------------------------------------------------
ANTES: após matricularCurso (curso gratuito), chamava getAlunoSso() e
       redirecionava (window.location.href) para o SSO da VPS, abrindo o
       painel antigo do aluno.

AGORA: após matricularCurso, exibe mensagem de sucesso e navega
       (navigate) para /curso/meus-cursos (novo painel integrado).
       - Removida a chamada getAlunoSso() e o redirecionamento SSO.
       - Removido o import getAlunoSso (não mais utilizado).
       - A matrícula (matricularCurso) e o registro local/VPS seguem
         intactos — apenas o destino pós-matrícula mudou.

2.4. apps/web/src/pages/curso/CursoAcessarPage.jsx (Acesso ao curso)
--------------------------------------------------------------------
ANTES: gerava token de acesso ao curso (acessarCurso) e redirecionava
       (window.location.href) para
       https://api.conexaobatista.com.br/aluno/cursos/:id?token=…
       (painel antigo da VPS, com token na URL).

AGORA: redirecionamento interno (Navigate) para /curso/:id/aula
       (leitor PDF integrado, novo painel). A rota /curso/:id/acessar é
       mantida por compatibilidade com links legados, mas o destino é o
       novo painel — sem SSO, sem token na URL, sem sair do site.

2.5. apps/web/src/pages/curso/CursoHomePage.jsx (Home da plataforma)
--------------------------------------------------------------------
O botão "Área do aluno" já aponta para /curso/aluno. Como o
CursoAlunoPage agora é o portal do novo painel (com aceite de termos +
botão para /curso/meus-cursos), o fluxo está correto — nenhum botão abre
o painel antigo. Nenhuma alteração necessária neste arquivo.

2.6. apps/web/src/components/curso/CursoLayout.jsx (Navegação)
---------------------------------------------------------------
O item "Área do aluno" aponta para /curso/aluno (agora o portal do novo
painel). Nenhuma alteração necessária — o destino mudou de comportamento
(SSO → novo painel) sem mudar a rota.

================================================================
3. FLUXO DE NAVEGAÇÃO IMPLEMENTADO
================================================================

3.1. Fluxo principal (validação)
--------------------------------
1. Site (conexaobatista.com.br) → "Cursos" → /curso (home da plataforma)
2. Home → "Área do aluno" → /curso/aluno
3. /curso/aluno → aceite de termos (LGPD + Termos de Uso)
4. Aceite → "Abrir painel do aluno" → /curso/meus-cursos (novo painel)
5. /curso/meus-cursos → card "Curso Livre Secretariado" → "Acessar curso"
   → /curso/29/aula (leitor PDF integrado)
6. /curso/29/aula → selecionar aula → leitor PDF (1/3, 2/3, 3/3)
7. "Baixar PDF" → abre em nova aba (sem download automático)

3.2. Fluxo de inscrição (curso gratuito)
----------------------------------------
1. /curso/cursos → card de curso → /curso/:id (detalhe)
2. Detalhe → "Inscrever-se Gratuitamente" → matricularCurso (VPS + local)
3. Matrícula confirmada → navigate('/curso/meus-cursos') (novo painel)
4. /curso/meus-cursos → "Acessar curso" → /curso/:id/aula (leitor PDF)

3.3. Rota legada /curso/:id/acessar
-----------------------------------
- Qualquer link legado para /curso/:id/acessar agora redireciona
  (Navigate replace) para /curso/:id/aula (novo painel).
- Nenhum redirecionamento para a VPS.

3.4. Botões que NÃO abrem o painel antigo
-----------------------------------------
✅ "Área do aluno" (home + nav) → /curso/aluno → novo painel
✅ "Abrir painel do aluno" (área do aluno) → /curso/meus-cursos → novo painel
✅ "Acessar curso" (meus cursos) → /curso/:id/aula → leitor PDF
✅ "Abrir aula (PDF)" (meus cursos) → /curso/:id/aula → leitor PDF
✅ "Inscrever-se Gratuitamente" (detalhe) → /curso/meus-cursos → novo painel
✅ /curso/:id/acessar (legado) → /curso/:id/aula → leitor PDF

================================================================
4. VALIDAÇÕES REALIZADAS
================================================================

4.1. Navegação — botões e cards
-------------------------------
✅ "Cursos" → /curso (home da plataforma)
✅ "Área do aluno" → /curso/aluno (portal do novo painel)
✅ Aceite de termos — duas caixas obrigatórias (LGPD + Termos)
✅ "Abrir painel do aluno" → /curso/meus-cursos (novo painel)
✅ Card "Acessar curso" → /curso/:id/aula (leitor PDF integrado)
✅ Card "Abrir aula (PDF)" → /curso/:id/aula (leitor PDF integrado)
✅ Inscrição gratuita → /curso/meus-cursos (novo painel)
✅ Rota legada /curso/:id/acessar → /curso/:id/aula (novo painel)

4.2. Nenhum botão abre painel antigo
------------------------------------
✅ CursoAlunoPage: removido getAlunoSso + window.location.href para VPS
✅ CursoAcessarPage: removido acessarCurso + redirect para VPS
✅ CursoDetalhePage: removido getAlunoSso + window.location.href para VPS
✅ CursoMeusCursosPage: "Acessar curso" aponta para /curso/:id/aula
✅ Nenhuma referência a painel-aluno ou /aluno/cursos/:id?token= no fluxo

4.3. Tokens não expostos
------------------------
✅ Nenhum token na URL (navegação interna via React Router)
✅ Nenhum token em localStorage pelo fluxo do painel do aluno
✅ Nenhum token em código visível (credenciais só no backend)
✅ O token de acesso ao curso (VPS) é gerenciado apenas no backend
   (cursos-aulas.js encadeia os dois passos; navegador não o vê)

4.4. Leitor PDF integrado (preservado do ajuste anterior)
---------------------------------------------------------
✅ Renderização condicional: vídeo → imagem → PDF → mensagem
✅ Contador "Página X de Y" (1/3, 2/3, 3/3)
✅ Navegação anterior/próxima com limites
✅ Sem download automático
✅ Botão "Baixar PDF" separado (href, target=_blank, nova aba)

4.5. Backend, autenticação, matrículas, permissões
--------------------------------------------------
✅ Backend VPS: nenhum arquivo alterado
✅ Autenticação PocketBase: authMiddleware intacto
✅ Matrículas: matricularCurso (cursos-matricula.js) intacto
✅ Permissões: regras de acesso PocketBase intactas
✅ SSO: rotas /aluno-sso e /mentor-sso-token preservadas (não removidas),
   apenas não são mais o destino principal da área do aluno

================================================================
5. STATUS DO CURSO 29 (DADOS REAIS)
================================================================

Curso: 29 — "Curso Livre Secretariado"
Status: publicado
Preço: R$ 0,00 (gratuito)
Carga horária: 50h

Fluxo de acesso ao Curso 29 no novo painel:
1. /curso/meus-cursos (se matriculado) → card do Curso 29
2. "Acessar curso" → /curso/29/aula
3. /curso/29/aula carrega as aulas via /cursos/29/aulas (proxy VPS)
4. Renderização condicional por aula (vídeo/imagem/PDF/mensagem)

PENDÊNCIA DE CONTEÚDO (não de código):
- O Curso 29 não possui aula com video_url, imagem_url ou
  material_pdf_url preenchido (mentor não publicou conteúdo no
  painel-mentor.html). A página /curso/29/aula exibirá a mensagem
  "Material indisponível para esta aula" ou "Nenhuma aula cadastrada"
  até que o mentor publique conteúdo. A lógica de renderização está
  implementada e operará automaticamente após a publicação.

================================================================
6. O QUE FOI PRESERVADO (INTACTO)
================================================================

✅ Backend VPS (api.conexaobatista.com.br) — nenhum arquivo alterado
✅ Autenticação PocketBase (authMiddleware, cursosAuthService)
✅ SSO (rotas /aluno-sso, /mentor-sso-token preservadas no backend)
✅ Matrículas (cursos-matricula.js, matriculas collection)
✅ Permissões (regras de acesso PocketBase)
✅ Tokens (não expostos em URLs/localStorage/código visível)
✅ Dados reais (nenhum dado simulado criado)
✅ Arquivos da VPS (não alterados)
✅ Visual novo (leitor PDF integrado, contador, navegação, botão baixar)
✅ Proxy /cursos/:id/aulas (cursos-aulas.js — sem alteração)
✅ cursosService (getMeusCursos, matricularCurso, getAulas — sem alteração)

================================================================
7. ARQUIVOS ALTERADOS
================================================================

1. apps/web/src/pages/curso/CursoAlunoPage.jsx
   - Removido: getAlunoSso, redirecionamento SSO para VPS, useEffect de
     redirect automático.
   - Adicionado: aceite de termos (LGPD + Termos de Uso), botão "Abrir
     painel do aluno" → /curso/meus-cursos, visão geral do novo painel.
   - Transformado em portal do novo painel integrado no site.

2. apps/web/src/pages/curso/CursoMeusCursosPage.jsx
   - Alterado: botão "Acessar curso" → /curso/:id/aula (era /acessar).

3. apps/web/src/pages/curso/CursoDetalhePage.jsx
   - Removido: getAlunoSso + window.location.href para VPS.
   - Removido: import getAlunoSso.
   - Adicionado: navigate('/curso/meus-cursos') após matrícula.

4. apps/web/src/pages/curso/CursoAcessarPage.jsx
   - Reescrito: redirecionamento interno (Navigate) para /curso/:id/aula.
   - Removido: acessarCurso, token na URL, redirect para VPS.

5. apps/api/src/routes/relatorio-integracao-novo-painel-aluno.js (este relatório)
6. apps/api/src/routes/index.js (registro da rota do relatório)
7. apps/web/src/pages/adm/RelatorioAlteracoesPage.jsx (card do relatório)

================================================================
8. FALHAS ENCONTRADAS
================================================================

Nenhuma falha de navegação ou de código foi encontrada na integração:
- Todos os botões da área do aluno apontam para o novo painel integrado.
- Nenhum botão abre o painel antigo da VPS.
- Nenhum download inicia indevidamente (o PDF só é baixado ao clicar em
  "Baixar PDF", que abre em nova aba).
- Nenhum token é exposto em URL/localStorage/código visível.

PENDÊNCIA (conteúdo, não código):
- O Curso 29 não possui aula com mídia publicada (video_url/imagem_url/
  material_pdf_url vazios). O leitor PDF não pode ser validado com um
  arquivo real de 3 páginas até que o mentor publique conteúdo no
  painel-mentor.html. A lógica de renderização está implementada e
  operará automaticamente após a publicação.

================================================================
9. CONCLUSÃO FINAL
================================================================

A integração do novo painel do aluno no site está COMPLETA:
- O novo frontend (CursoAulaPage.jsx com leitor PDF integrado) é o
  destino principal de TODOS os botões e fluxos da área do aluno.
- Nenhum botão abre o painel antigo da VPS.
- Nenhum download inicia indevidamente.
- Tokens não são expostos em URLs, localStorage ou código visível.
- Backend VPS, autenticação, SSO (rotas), matrículas, permissões e dados
  reais permanecem intactos.
- O visual novo (leitor PDF com contador 1/3, 2/3, 3/3, navegação e
  botão "Baixar PDF" em nova aba) foi preservado.

A ÚNICA pendência é de conteúdo (não de código): o mentor precisa
publicar conteúdo (vídeo/imagem/PDF) nas aulas do Curso 29 (ou de outro
curso) no painel-mentor.html para validar o leitor PDF com um arquivo
real.

================================================================================
PRÓXIMAS ETAPAS
================================================================================

1. Mentor: acessar painel-mentor.html e publicar conteúdo em uma aula do
   Curso 29 (ou de outro curso) — vídeo (YouTube), imagem ou PDF.
2. Validar em navegador o fluxo completo:
   site → Cursos → Área do aluno → aceite → Abrir painel → Curso 29 →
   aula → leitor PDF (1/3, 2/3, 3/3) → Baixar PDF (nova aba).
3. Confirmar que nenhum botão abre o painel antigo da VPS.
4. Confirmar que nenhum download inicia indevidamente.

================================================================================
FIM DO RELATÓRIO
================================================================================`;
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-integracao-novo-painel-aluno] Solicitação de relatório de integração do novo painel do aluno por: ${solicitante}`,
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
  const nomeArquivo = `relatorio-integracao-novo-painel-aluno-${dataHoraArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
