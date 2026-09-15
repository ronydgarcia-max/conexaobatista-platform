// GET /cursos/:id/aulas/:aulaId/pdf — proxy autenticado do PDF de uma aula.
//
// CORREÇÃO (31/08/2026 — leitor PDF não carrega arquivo autenticado):
// A versão anterior do frontend carregava o PDF diretamente da URL pública
// `material_pdf_url` (Cloudinary/VPS) no navegador via pdf.js. Isso falhava
// por CORS cross-origin ou quando a URL exigia autenticação, exibindo erro
// mesmo com o PDF disponível.
//
// Fluxo seguro (este endpoint):
//   1. authMiddleware valida a sessão PocketBase do aluno (header Authorization).
//   2. O token de sessão da VPS (bridge-login) vem no header `x-cursos-token`.
//   3. O backend chama /aluno/cursos/:id/aulas na VPS com o token de sessão
//      — a VPS só devolve aulas para alunos matriculados (valida matrícula em
//      PostgreSQL). Isso é a validação de matrícula.
//   4. O backend localiza a aula pelo `aulaId` e extrai `material_pdf_url`.
//   5. O backend busca os bytes do PDF server-side (sem CORS, sem expor a URL
//      ao navegador) e devolve o arquivo com Content-Type application/pdf.
//   6. O frontend carrega o blob no leitor pdf.js (mesma origem → sem CORS).
//
// Tratamento de erros:
//   - Sem token / sessão PocketBase inválida → 401 (frontend redireciona ao login).
//   - Aula não encontrada ou sem material_pdf_url → 404 ("Material indisponível").
//   - Não matriculado (VPS 403) → 403 ("Acesso negado").
//   - Falha ao buscar o arquivo → 502 ("Erro ao carregar PDF").
//
// Rota protegida por authMiddleware (exige sessão PocketBase válida).
// Tokens permanecem no backend (nunca expostos ao navegador).

const CURSOS_API_URL = (
  process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br'
).replace(/\/+$/, '');

// Extrai o campo canônico do PDF de uma aula: `material_pdf_url`.
function materialPdfDaAula(aula) {
  if (!aula) return '';
  const url = aula.material_pdf_url;
  return typeof url === 'string' ? url.trim() : '';
}

export default async (req, res) => {
  const { id: cursoId, aulaId } = req.params;
  if (!cursoId || !aulaId) {
    return res
      .status(422)
      .json({ error: 'ID do curso e da aula são obrigatórios.' });
  }

  // Token de SESSÃO do aluno na VPS (bridge-login).
  const cursosToken = req.headers['x-cursos-token'];
  if (!cursosToken) {
    return res
      .status(401)
      .json({ error: 'Token de cursos ausente. Renove sua sessão.' });
  }

  // 1. Busca a lista de aulas na VPS (valida matrícula — só matriculados
  //    recebem a lista com material_pdf_url).
  let aulasRes;
  try {
    aulasRes = await fetch(
      `${CURSOS_API_URL}/aluno/cursos/${encodeURIComponent(cursoId)}/aulas`,
      { headers: { Authorization: `Bearer ${cursosToken}` } },
    );
  } catch (e) {
    return res.status(502).json({
      error:
        'Serviço de cursos indisponível no momento. Tente novamente em instantes.',
    });
  }

  if (aulasRes.status === 401 || aulasRes.status === 403) {
    // Sessão VPS expirada OU aluno não matriculado.
    if (aulasRes.status === 403) {
      return res.status(403).json({
        error: 'Acesso negado. Você não está matriculado neste curso.',
      });
    }
    return res.status(401).json({
      error: 'Sua sessão na plataforma de cursos expirou. Renovando acesso…',
    });
  }
  if (!aulasRes.ok) {
    return res.status(502).json({
      error: 'Não foi possível carregar as aulas deste curso.',
    });
  }

  // 2. Normaliza a resposta e localiza a aula pelo ID.
  let aulasData = null;
  try {
    const txt = await aulasRes.text();
    aulasData = txt ? JSON.parse(txt) : null;
  } catch (_) {
    aulasData = null;
  }

  let aulas = [];
  if (Array.isArray(aulasData)) aulas = aulasData;
  else if (Array.isArray(aulasData?.aulas)) aulas = aulasData.aulas;
  else if (Array.isArray(aulasData?.modulos)) aulas = aulasData.modulos;
  else if (Array.isArray(aulasData?.data)) aulas = aulasData.data;

  const aula = aulas.find((a) => String(a?.id) === String(aulaId)
    || String(a?.aula_id) === String(aulaId));
  if (!aula) {
    return res.status(404).json({ error: 'Aula não encontrada.' });
  }

  const pdfUrl = materialPdfDaAula(aula);
  if (!pdfUrl) {
    // Aula existe mas o mentor não publicou PDF.
    return res.status(404).json({ error: 'Material indisponível para esta aula.' });
  }

  // 3. Busca os bytes do PDF server-side (sem CORS, sem expor a URL).
  let pdfRes;
  try {
    pdfRes = await fetch(pdfUrl);
  } catch (e) {
    return res.status(502).json({
      error: 'Erro ao carregar o PDF. Tente novamente em instantes.',
    });
  }

  if (!pdfRes.ok) {
    return res.status(502).json({
      error: 'Erro ao carregar o PDF. Tente novamente em instantes.',
    });
  }

  // 4. Devolve o PDF como blob (application/pdf) — mesma origem no navegador.
  const contentType = pdfRes.headers.get('content-type') || 'application/pdf';
  const arrayBuffer = await pdfRes.arrayBuffer();
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', String(arrayBuffer.byteLength));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(Buffer.from(arrayBuffer));
};
