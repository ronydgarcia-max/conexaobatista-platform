// Proxy de sincronização de usuário entre o PocketBase e a API externa de
// cursos (VPS — projeto cursos-api).
//
// A API externa mantém seu próprio cadastro de usuários. Antes de permitir a
// matrícula/acesso a um curso, ela exige que o usuário exista no seu banco —
// caso contrário retorna "Usuário não encontrado. Chame /usuarios/ensure
// primeiro.". Este endpoint sincroniza o usuário autenticado do PocketBase
// com a API externa, enviando pocketbase_id, email e nome.
//
// Rota protegida por authMiddleware (exige sessão PocketBase válida):
//   POST /cursos/usuarios-ensure

const CURSOS_API_URL = (
  process.env.CURSOS_API_URL || "https://api.conexaobatista.com.br"
).replace(/\/+$/, "");
const CURSOS_API_BRIDGE_SECRET = process.env.CURSOS_API_BRIDGE_SECRET;

export default async (req, res) => {
  if (!CURSOS_API_BRIDGE_SECRET) {
    throw new Error("CURSOS_API_BRIDGE_SECRET não configurado em apps/api/.env");
  }

  const user = req.user;
  if (!user?.id) {
    return res.status(401).json({ error: "Não autenticado." });
  }

  const payload = {
    pocketbase_id: user.id,
    email: user.email,
    nome: user.name || user.email,
  };

  const upstream = await fetch(`${CURSOS_API_URL}/usuarios/ensure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bridge-secret": CURSOS_API_BRIDGE_SECRET,
    },
    body: JSON.stringify(payload),
  });

  const text = await upstream.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = { message: text };
  }

  if (!upstream.ok) {
    const status = upstream.status;
    const message =
      (typeof data === "object" && (data?.error || data?.message)) ||
      "Não foi possível sincronizar o usuário com a plataforma de cursos.";
    return res.status(status).json({ error: message, details: data });
  }

  return res.status(200).json({
    sucesso: true,
    mensagem: "Usuário sincronizado com a plataforma de cursos.",
    usuario: data,
  });
};
