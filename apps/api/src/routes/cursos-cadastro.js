// Proxy de cadastro de alunos para a API de cursos na VPS.
//
// O site Conexão Batista é servido em HTTPS, enquanto a API de cursos roda em
// HTTP (http://69.62.124.240:3333). Chamadas fetch diretas do navegador para um
// endpoint HTTP a partir de uma página HTTPS são bloqueadas como "mixed content".
// Por isso este rota recebe a requisição do frontend (mesma origem, via /hcgi/api)
// e repassa ao backend de cursos no servidor, onde não há restrição de mixed content.
//
// Endpoint público: POST /cursos/usuarios
// Body esperado: { nome, email, senha }
// Body enviado à API: { nome, email, senha, role: "aluno" }

const CURSOS_API_URL = process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br';
const CURSOS_API_BRIDGE_SECRET = process.env.CURSOS_API_BRIDGE_SECRET;

export default async (req, res) => {
  const { nome, email, senha } = req.body || {};

  // Validação básica server-side (campos obrigatórios).
  if (!nome || !email || !senha) {
    return res.status(400).json({
      error: 'Campos obrigatórios: nome, email e senha.',
    });
  }

  try {
    const upstream = await fetch(`${CURSOS_API_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bridge-secret': CURSOS_API_BRIDGE_SECRET,
      },
      body: JSON.stringify({ nome, email, senha, role: 'aluno' }),
    });

    // Tenta interpretar o corpo da resposta como JSON (a API de cursos
    // retorna JSON tanto no sucesso quanto no erro). Se não for JSON, usa texto.
    let data = null;
    const text = await upstream.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = { message: text };
    }

    // Repassa o mesmo status do backend de cursos para o frontend.
    if (!upstream.ok) {
      const mensagem =
        data?.message ||
        data?.error ||
        (upstream.status === 409
          ? 'E-mail já cadastrado na plataforma de cursos.'
          : upstream.status === 400
            ? 'Dados inválidos para o cadastro.'
            : 'Não foi possível concluir o cadastro. Tente novamente.');
      return res.status(upstream.status).json({ error: mensagem, details: data });
    }

    // Sucesso: retorna o payload criado (id, nome, email, role, criado_em).
    return res.status(201).json(data || { ok: true });
  } catch (err) {
    // Erro de rede/conexão com a VPS — não expõe detalhes sensíveis.
    return res.status(502).json({
      error: 'Serviço de cursos indisponível no momento. Tente novamente em instantes.',
    });
  }
};
