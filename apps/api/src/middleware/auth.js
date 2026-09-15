import { validateAuthToken } from '../utils/authToken.js';

/**
 * Middleware de autenticação para a coleção `users` do PocketBase.
 *
 * Valida o token Bearer decodificando o JWT e lendo o próprio registro do
 * usuário via GET — SEM chamar /auth-refresh. O auth-refresh rotaciona o
 * `tokenKey` do registro, invalidando o token do frontend a cada chamada
 * (a causa do erro 401 recorrente). O GET valida assinatura + exp + tokenKey
 * sem rotacionar, mantendo o token do frontend válido. Rejeita explicitamente
 * tokens de outras coleções (ex.: `admins`).
 */
export default async function authMiddleware(req, res, next) {
  const reject = () => res.status(401).json({ error: 'Unauthorized' });
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return reject();
  const token = header.slice('Bearer '.length).trim();
  const record = await validateAuthToken(token, 'users');
  if (!record) return reject();
  req.user = record;   // ← guarda o registro COMPLETO (email, name, mentor_status...)
  return next();
}
