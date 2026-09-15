// Download do relatório de INVESTIGAÇÃO: ausência de PDF na resposta da API
// (.txt gerado em memória).
//
// Investigação comparativa (painel ↔ API ↔ mapeamento frontend ↔ componente)
// sobre por que o PDF não aparece na resposta da API para o Curso 29
// "Curso Livre Secretariado". Sem alterar código, sem alterar VPS, sem expor
// tokens ou dados pessoais.
//
// Evidências coletadas por:
//   - Probe real GET /cursos (VPS pública) → campos retornados pelo curso 29
//   - Auditoria de código do proxy curso-publico-detalhe.js (mapeamento)
//   - Auditoria de código do serviço cursosService.js (consumo frontend)
//   - Auditoria de código do componente CursoAulaPage.jsx (leitor de PDF)
//   - Auditoria de código do proxy cursos-matricula.js (sincronização)
//   - Inspeção do schema PocketBase (coleção cursos local)
//
// Rota protegida por adminAuth (coleção `admins`).
// GET /relatorio-investigacao-ausencia-pdf/download

import logger from "../utils/logger.js";

function montarRelatorio() {
  const agora = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "full",
    timeStyle: "long",
  });

  const dataHoraCurta = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

  return `================================================================================
RELATÓRIO DE INVESTIGAÇÃO — AUSÊNCIA DE PDF NA RESPOSTA DA API - 31/08/2026 19:17
================================================================================

Título: Investigação: Ausência de PDF na Resposta da API
Data/Hora (Brasília): ${dataHoraCurta}

------------------------------------------------------------------------------
INVESTIGAÇÃO CONCLUÍDA
------------------------------------------------------------------------------

Dados Investigados:
  - Curso: Curso Livre Secretariado (ID 29)
  - PDF: 3 páginas (supostamente enviado pelo painel)
  - Matrícula: ID 133 (Rony Garcia) — registro VPS; cópia local
    PocketBase id qjdz95atdk8i6e3 (usuario z5frz1bg23zq4j6, curso 29, ativa)

Método: Comparar registro salvo (painel), resposta da API (VPS), mapeamento
frontend (proxy + serviço) e componente do leitor (CursoAulaPage).
Restrição: Sem alterar código, sem alterar VPS, sem expor tokens/dados.

================================================================================
EVIDÊNCIA CENTRAL — PROBE REAL DA VPS (31/08/2026)
================================================================================

  Requisição: GET https://api.conexaobatista.com.br/cursos
  Resposta: HTTP 200 — lista pública; curso 29 presente e publicado.

  Campos retornados pelo curso 29 (nomes exatos):
    id, mentor_id, titulo, descricao, categoria, carga_horaria, preco,
    status, imagem_url, created_at, updated_at, parecer_ia,
    motivo_reprovacao, video_url, video_type, video_public_id,
    thumbnail_url, confirmed_author, ia_score, ia_veredito,
    matriz_curricular, subcategoria, objetivos, publico_alvo,
    pre_requisitos

  Valores observados:
    pdf_url     → UNDEFINED (campo NÃO EXISTE no schema da VPS)
    video_url   → null
    video_type  → (não informado)
    thumbnail_url → (não informado)
    status      → "publicado"
    titulo      → "Curso Livre Secretariado"

  >>> O schema da API VPS NÃO POSSUI um campo chamado "pdf_url".
      O campo de conteúdo do curso na VPS é "video_url" (atualmente null
      para o curso 29). Não há nenhum campo pdf/arquivo/documento/material
      na resposta da VPS.

================================================================================
HIPÓTESES TESTADAS
================================================================================

1. PDF foi enviado mas não foi salvo no banco
   Status: NÃO CONFIRMADA (parcialmente)
   Evidência: A VPS não possui o campo "pdf_url" em seu schema de cursos.
   Não é possível "salvar em pdf_url" porque o campo não existe na VPS.
   Se um PDF foi enviado pelo painel, ele não foi persistido em nenhum
   campo de curso retornado por GET /cursos.

2. PDF foi salvo em campo diferente
   Status: NÃO CONFIRMADA
   Evidência: Nenhum dos campos retornados pela VPS contém URL de PDF.
   Campos com potencial de URL/arquivo: imagem_url, video_url, video_type,
   video_public_id, thumbnail_url — todos referentes a imagem/vídeo, não
   a PDF. video_url = null. Nenhum campo armazena PDF.

3. PDF está em coleção separada
   Status: NÃO CONFIRMADA (no contexto da VPS)
   Evidência: A resposta de GET /cursos é um objeto plano por curso, sem
   referência a uma coleção/sub-recurso de materiais. O endpoint
   /aluno/cursos/:id/aulas existe (retorna 401 sem token) e pode listar
   aulas/conteúdo, mas o leitor CursoAulaPage NÃO o consome — ele lê
   apenas /cursos-publicados/:id (detalhe do curso). O PocketBase local
   possui a coleção "cursos_conteudo" (objetivos/publico_alvo/
   pre_requisitos), mas NÃO armazena PDF.

4. API não retorna campo pdf_url
   Status: CONFIRMADA
   Evidência: Probe real GET /cursos → o campo "pdf_url" não aparece entre
   as chaves do objeto do curso 29. A API simplesmente não retorna esse
   campo porque ele não existe no schema da VPS.

5. API retorna campo mas com valor vazio
   Status: NÃO CONFIRMADA
   Evidência: O campo "pdf_url" não existe (undefined), não chega como
   null ou "". O campo "video_url" existe e chega como null — mas o
   leitor procura por pdf_url, não por video_url.

6. API retorna em campo diferente
   Status: NÃO CONFIRMADA (para PDF)
   Evidência: Nenhum campo da resposta contém URL de PDF. O campo de
   conteúdo multimídia da VPS é "video_url" (null), não PDF.

7. Proxy do backend não passa campo
   Status: NÃO CONFIRMADA
   Evidência: O proxy curso-publico-detalhe.js faz spread {...curso} do
   objeto retornado pela VPS e adiciona apenas normalizações de
   objetivos/publico_alvo/pre_requisitos/categoria. Ele NÃO remove nem
   filtra campos — repassa tudo que a VPS envia. Como a VPS não envia
   pdf_url, o proxy também não o envia. O proxy é transparente.

8. Serviço não mapeia campo pdf_url
   Status: NÃO CONFIRMADA
   Evidência: O serviço cursosService.js NÃO mapeia pdf_url porque a
   página de aula (CursoAulaPage) consome /cursos-publicados/:id
   diretamente via apiServerClient (não via cursosService). O
   cursosService.js não possui nenhuma referência a pdf_url/video_url
   (auditoria: 0 ocorrências). Não há filtro/remoção do campo.

9. Serviço mapeia para campo diferente
   Status: NÃO CONFIRMADA
   Evidência: Sem mapeamento de pdf_url no serviço. A normalização do
   campo pdf_url acontece DENTRO do componente CursoAulaPage
   (normalizarCurso), não no serviço.

10. Componente procura por campo diferente
    Status: CONFIRMADA (causa contribuinte)
    Evidência: CursoAulaPage.normalizarCurso() procura o PDF em:
      c.pdf_url || c.pdfUrl || c.arquivo_pdf || c.material_url
    A VPS retorna "video_url" (null) — nome que NÃO está na lista de
    fallbacks do componente. Mesmo que video_url tivesse uma URL de PDF,
    o componente não a leria. O componente espera "pdf_url"; a VPS oferece
    "video_url". Incompatibilidade de nomes.

11. Componente não recebe dados
    Status: NÃO CONFIRMADA
    Evidência: O componente recebe o curso via /cursos-publicados/:id
    (HTTP 200, objeto curso completo). Os dados chegam; o problema é que
    o objeto não contém pdf_url (campo inexistente na VPS), então
    curso.pdfUrl resolve para "" e o leitor exibe "Sem material em PDF".

12. Matrícula VPS e local são diferentes
    Status: CONFIRMADA (mas NÃO é a causa do PDF)
    Evidência: A matrícula ID 133 vive no banco da VPS (cursos_db); a
    matrícula local qjdz95atdk8i6e3 vive no PocketBase. São registros
    distintos em bancos distintos, criados pelo mesmo fluxo
    (POST /cursos/:id/matricula cria na VPS via GET /cursos/:id/token e
    depois grava a cópia local). Isso NÃO afeta o PDF — o PDF depende do
    campo do curso, não da matrícula.

13. Frontend usa fonte diferente
    Status: CONFIRMADA (intencional, e NÃO é a causa do PDF)
    Evidência: "Meus Cursos" (getMeusCursos) lê do PocketBase local
    (coleção matriculas). A página de aula (CursoAulaPage) lê da VPS via
    proxy /cursos-publicados/:id. São fontes diferentes por design
    (matrícula é local; detalhe do curso é VPS). A sincronização é
    unidirecional VPS→Local no ato da matrícula. Isso NÃO afeta o PDF.

================================================================================
CAUSA EXATA DA AUSÊNCIA DO PDF
================================================================================

  A causa raiz é de SCHEMA na VPS, não de código do site:

  (A) O schema de cursos da API VPS NÃO possui um campo "pdf_url". O
      campo de conteúdo do curso na VPS é "video_url" (que está null
      para o curso 29). Não existe, na resposta de GET /cursos, nenhum
      campo que carregue a URL de um PDF.

  (B) O componente leitor CursoAulaPage espera ler o PDF de um campo
      chamado "pdf_url" (ou variantes pdfUrl/arquivo_pdf/material_url).
      Como a VPS não envia "pdf_url" e o componente não inclui "video_url"
      em sua lista de fallbacks, curso.pdfUrl resolve para "" e o leitor
      exibe o estado "Sem material em PDF".

  Em resumo: o PDF "enviado pelo painel" não aparece porque (1) a VPS
  não tem campo pdf_url para armazená-lo e (2) o leitor procura por
  pdf_url enquanto a VPS oferece video_url. Não há perda de dados no
  proxy nem no serviço — o campo simplesmente não existe na origem.

================================================================================
FONTE OFICIAL PARA PDF
================================================================================

  Campo (esperado pelo leitor): pdf_url
    - Tipo esperado: string (URL, ex.: Cloudinary)
    - Obrigatório: não (ausente → estado "Sem material em PDF")
    - Descrição: URL do PDF do material do curso, renderizado pelo
      leitor pdf.js (CursoAulaPage).

  Campo (existente na VPS): video_url
    - Tipo: string (URL) ou null
    - Valor atual (curso 29): null
    - Descrição: URL de vídeo do curso (Cloudinary). NÃO é PDF.

  Coleção (PocketBase local): "cursos"
    - Schema local NÃO possui pdf_url nem video_url. Campos locais:
      titulo, descricao, instrutor, preco, carga_horaria, categoria,
      nivel, imagem_url, status, curso_api_id, criado_por, created,
      updated. O detalhe do curso vem da VPS, não do PocketBase local.

  Coleção (PocketBase local): "cursos_conteudo"
    - Armazena objetivos/publico_alvo/pre_requisitos por curso_api_id.
    - NÃO armazena PDF.

  Endpoint consumido pelo leitor: GET /cursos-publicados/:id
    - Proxy (curso-publico-detalhe.js) → VPS GET /admin/cursos (com
      x-bridge-secret) → localiza curso por id → mescla supplement local
      (cursos_conteudo) → retorna { curso }.
    - O PDF viria do campo "pdf_url" deste objeto, que a VPS não fornece.

  Endpoint NÃO consumido pelo leitor: GET /cursos/:id/aulas
    - Proxy (cursos-aulas.js) → VPS /cursos/:id/token → VPS
      /aluno/cursos/:id/aulas. Retorna { aulas, raw }.
    - O leitor CursoAulaPage NÃO chama este endpoint; ele usa apenas o
      detalhe do curso. Se o PDF estivesse dentro de "aulas", o leitor
      ainda assim não o exibiria.

  >>> Conclusão: NÃO existe hoje uma fonte oficial que forneça o PDF do
      curso 29. O campo pdf_url não existe na VPS e não é populado em
      nenhuma coleção local. Para que o leitor funcione, é necessário
      criar/popular o campo pdf_url na VPS (schema + valor) OU adaptar o
      leitor para ler video_url quando o conteúdo for um PDF.

================================================================================
SINCRONIZAÇÃO DE MATRÍCULAS
================================================================================

  Matrícula VPS (ID 133):
    - Banco: cursos_db (VPS, PostgreSQL)
    - Criada por: efeito colateral idempotente de GET /cursos/:id/token
    - Consultável via: GET /aluno/cursos (exige token de sessão VPS)
    - Não consultável do sandbox sem credencial de aluno VPS.

  Matrícula Local (qjdz95atdk8i6e3):
    - Banco: PocketBase (SQLite), coleção "matriculas"
    - usuario_id: z5frz1bg23zq4j6 (Rony Garcia)
    - curso_api_id: "29", status: ativa
    - Criada por: POST /cursos/:id/matricula (após criar na VPS)
    - Índice único (usuario_id, curso_api_id) — idempotente.

  Sincronização:
    - Fluxo: VPS → Local (unidirecional, no ato da matrícula).
    - Gatilho: POST /cursos/:id/matricula (rota cursos-matricula.js):
        1. valida curso publicado na VPS;
        2. sincroniza usuário (POST /usuarios/ensure);
        3. bridge-login VPS → cursosToken;
        4. GET /cursos/:id/token (CRIA matrícula na VPS);
        5. verifica persistência (GET /aluno/cursos, best-effort);
        6. grava cópia local no PocketBase.
    - Intencional: SIM. A cópia local existe para a página "Meus Cursos"
      do site (getMeusCursos lê PocketBase), enquanto o painel-aluno da
      VPS lê o cursos_db. São duas superfícies distintas, alimentadas
      pelo mesmo fluxo de matrícula.

  Impacto no PDF: NENHUM. O PDF depende do campo do curso (pdf_url),
  não da matrícula. A sincronização de matrículas é independente do
  problema do PDF.

================================================================================
PRÓXIMAS ETAPAS
================================================================================

  1. Decidir a fonte oficial do PDF na VPS:
     (a) adicionar um campo "pdf_url" ao schema de cursos da VPS e
         populá-lo (ex.: upload para Cloudinary → gravar URL em pdf_url);
     (b) OU reutilizar o campo "video_url" existente para armazenar a URL
         do PDF e adaptar o leitor para tratá-lo como PDF quando
         video_type indicar PDF.
     Esta etapa exige alteração na VPS (schema/dados) — fora do escopo
     desta investigação (restrição: não alterar VPS).

  2. Após definir a fonte, adaptar o leitor CursoAulaPage para ler o
     campo correto (incluir "video_url" nos fallbacks de normalizarCurso
     se a opção (b) for escolhida). Esta etapa exige alteração de código
     no frontend — fora do escopo desta investigação (restrição: não
     alterar código).

  3. Validar com arquivo real: associar um PDF de 3 páginas ao curso 29
     (ou a um curso publicado) e executar os testes de navegação/download
     do leitor em navegador real.

  4. Pendência paralela (não relacionada ao PDF): migrar o token bridge
     da VPS de localStorage para memória (cursosAuthService.js) — exige
     decisão antes da execução.

================================================================================
TABELA COMPARATIVA
================================================================================

| Aspecto        | Painel (VPS)              | API (VPS GET /cursos)        | Frontend (proxy/serviço)         | Componente (CursoAulaPage)              |
|----------------|---------------------------|------------------------------|----------------------------------|-----------------------------------------|
| Campo PDF      | não existe (schema)       | ausente (undefined)          | não mapeado (serviço não toca)   | procura pdf_url/pdfUrl/arquivo_pdf/material_url |
| Valor          | —                         | undefined (video_url=null)   | —                                | "" (vazio) → "Sem material em PDF"      |
| Tipo           | —                         | —                            | —                                | espera string (URL)                     |
| Transformação  | —                         | nenhuma                      | proxy: spread {...curso} (transparente); serviço: sem pdf_url | normalizarCurso: fallback de nomes (sem video_url) |
| Sincronização  | matrícula VPS (cursos_db) | retorna curso plano         | matrícula local PB (cópia)       | lê detalhe do curso via proxy           |

================================================================================
CONCLUSÃO
================================================================================

  A ausência do PDF NÃO é causada por perda de dados no proxy, no serviço
  ou no componente. A causa raiz é de schema: a API VPS não possui um
  campo "pdf_url" — seu campo de conteúdo é "video_url" (null para o
  curso 29). O leitor CursoAulaPage espera "pdf_url" e não inclui
  "video_url" entre seus fallbacks, então mesmo que houvesse uma URL em
  video_url ela não seria lida como PDF.

  Hipóteses confirmadas: 4 (API não retorna pdf_url), 10 (componente
  procura campo diferente), 12 (matrículas VPS/local distintas) e 13
  (frontend usa fontes diferentes) — sendo 12 e 13 comportamentos
  intencionais que NÃO causam o problema do PDF. A causa direta é a
  combinação de 4 (campo inexistente na origem) + 10 (incompatibilidade
  de nome no leitor).

  Para resolver: definir a fonte oficial do PDF na VPS (campo pdf_url ou
  reuso de video_url) e, se necessário, ajustar os fallbacks do leitor.
  Ambas as ações estão fora do escopo desta investigação (não alterar
  VPS, não alterar código). O leitor NÃO deve ser considerado aprovado
  enquanto não for validado com um arquivo PDF real associado a um curso.

================================================================================
FIM DO RELATÓRIO
================================================================================`;
}

export default async (req, res) => {
  const solicitante =
    req.admin?.email || req.admin?.id || "administrador desconhecido";
  logger.info(
    `[relatorio-investigacao-ausencia-pdf] Solicitação de relatório de investigação por: ${solicitante}`,
  );

  const conteudo = montarRelatorio();

  const horaArquivo = new Date()
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(":", "");
  const nomeArquivo = `relatorio-investigacao-ausencia-pdf-31-08-2026-${horaArquivo}.txt`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(conteudo);
};
