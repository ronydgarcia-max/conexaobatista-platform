// GET /cursos/:id/prova — proxy ponta a ponta para a prova de um curso.
//
// MELHORIA (31/08/2026 — prova integrada como etapa final do curso):
// Consulta a VPS em busca de uma prova cadastrada para o curso e devolve
// { existe, prova, status } para o frontend. O frontend usa isso para:
//   - exibir a prova como item adicional na sidebar (Pendente/Concluída);
//   - substituir o botão "Próxima" por "Fazer prova" na última aula.
//
// Fluxo seguro (este endpoint):
//   1. authMiddleware valida a sessão PocketBase do aluno (Authorization).
//   2. O token de SESSÃO da VPS (bridge-login) vem no header `x-cursos-token`.
//   3. O backend chama /aluno/cursos/:id/prova na VPS com esse token.
//   4. Se a VPS devolver uma prova (200 + dados): retorna { existe: true,
//      prova, status }.
//   5. Se a VPS devolver 404 ou um corpo vazio (sem prova cadastrada):
//      retorna { existe: false, prova: null, status: 'sem_prova' } — o
//      frontend mantém o botão "Próxima" normal e não exibe a prova na
//      sidebar. Nenhum dado é simulado.
//   6. Sessão VPS expirada (401): devolve 401 para o frontend renovar.
//
// Rota protegida por authMiddleware (exige sessão PocketBase válida).
// Tokens permanecem no backend (nunca expostos ao navegador). VPS intacta
// (apenas leitura via proxy).

const CURSOS_API_URL = (
  process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br'
).replace(/\/+$/, '');

// Tenta ler o corpo JSON da resposta de forma segura.
async function lerJson(res) {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) { return text || null; }
}

// Normaliza o estado da prova a partir da resposta da VPS. Aceita nomes
// comuns (status, concluida, completed, nota, aprovado) e devolve um
// rótulo estável: 'pendente' | 'concluida' | 'sem_prova'.
function estadoDaProva(prova) {
  if (!prova || typeof prova !== 'object') return 'pendente';
  const status = prova.status || prova.estado || prova.situacao;
  if (typeof status === 'string') {
    const s = status.toLowerCase();
    if (['concluida', 'concluido', 'completed', 'aprovado', 'feito', 'finalizado'].includes(s)) {
      return 'concluida';
    }
    if (['pendente', 'em_andamento', 'incompleta', 'aberto', 'ativo'].includes(s)) {
      return 'pendente';
    }
  }
  if (prova.concluida === true || prova.completed === true) return 'concluida';
  // Se há nota registrada, considera concluída.
  const nota = prova.nota ?? prova.score ?? prova.grade;
  if (nota !== null && nota !== undefined && String(nota) !== '') return 'concluida';
  return 'pendente';
}

export default async (req, res) => {
  const { id: cursoId } = req.params;
  if (!cursoId) {
    return res.status(422).json({ error: 'ID do curso é obrigatório.' });
  }

  // Token de SESSÃO do aluno na VPS (bridge-login).
  const cursosToken = req.headers['x-cursos-token'];
  if (!cursosToken) {
    return res
      .status(401)
      .json({ error: 'Token de cursos ausente. Renove sua sessão.' });
  }

  // Chamada à VPS em busca da prova do curso.
  let provaRes;
  try {
    provaRes = await fetch(
      `${CURSOS_API_URL}/aluno/cursos/${encodeURIComponent(cursoId)}/prova`,
      { headers: { Authorization: `Bearer ${cursosToken}` } },
    );
  } catch (e) {
    // Falha de rede/serviço — sinaliza ausência sem simular dados.
    return res.status(200).json({
      existe: false,
      prova: null,
      status: 'sem_prova',
      curso_id: String(cursoId),
    });
  }

  // Sessão VPS expirada — o frontend renova via bridge-login e tenta de novo.
  if (provaRes.status === 401) {
    return res.status(401).json({
      error: 'Sua sessão na plataforma de cursos expirou. Renovando acesso…',
    });
  }

  // 404 ou 403 (sem prova cadastrada / não matriculado) → sem prova.
  // Não há dado para simular; o frontend segue o fluxo normal (Próxima).
  if (provaRes.status === 404 || provaRes.status === 403) {
    return res.status(200).json({
      existe: false,
      prova: null,
      status: 'sem_prova',
      curso_id: String(cursoId),
    });
  }

  if (!provaRes.ok) {
    // Outros erros — trata como ausência para não bloquear a navegação.
    return res.status(200).json({
      existe: false,
      prova: null,
      status: 'sem_prova',
      curso_id: String(cursoId),
    });
  }

  const data = await lerJson(provaRes);

  // Normaliza: a VPS pode devolver { prova: {...} }, {...} ou { provas: [...] }.
  let prova = null;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    prova = data.prova || data.data || data;
  } else if (Array.isArray(data)) {
    prova = data[0] || null;
  }

  // Corpo vazio ou sem prova real → sem prova.
  if (!prova || (typeof prova === 'object' && Object.keys(prova).length === 0)) {
    return res.status(200).json({
      existe: false,
      prova: null,
      status: 'sem_prova',
      curso_id: String(cursoId),
    });
  }

  // Garante um id estável para a rota /curso/:id/prova/:provaId.
  const provaId = prova.id || prova.prova_id || prova.provaId || String(cursoId);

  return res.status(200).json({
    existe: true,
    prova: { ...prova, id: provaId },
    status: estadoDaProva(prova),
    curso_id: String(cursoId),
  });
};
