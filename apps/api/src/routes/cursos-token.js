import jwt from 'jsonwebtoken';

const CURSOS_API_BRIDGE_SECRET = process.env.CURSOS_API_BRIDGE_SECRET;

export default async (req, res) => {
  if (!CURSOS_API_BRIDGE_SECRET) {
    throw new Error('CURSOS_API_BRIDGE_SECRET is not set in apps/api/.env');
  }

  const user = req.user;   // ← corrigido: era "req.auth"
  if (!user?.id) {
    throw new Error('User is not authenticated');
  }

  // Deriva o papel na plataforma de cursos:
  // só é mentor se a solicitação foi APROVADA; caso contrário, aluno.
  const role = user.mentor_status === 'aprovado' ? 'mentor' : 'aluno';

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      nome: user.name,   // ⚠️ PocketBase usa "name" por padrão (confirmado no hook)
      role,              // "mentor" ou "aluno"
    },
    CURSOS_API_BRIDGE_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, role });
};
