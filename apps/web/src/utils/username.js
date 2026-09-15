// Shared username validation rules (mirrors the server-side field pattern:
// ^[a-zA-Z][a-zA-Z0-9_]{2,19}$ — 3-20 chars, must start with a letter, only
// letters, digits and underscore, no spaces or special characters).

export const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

export const USERNAME_RULES = [
  'De 3 a 20 caracteres.',
  'Deve começar com uma letra.',
  'Apenas letras, números e underline (_).',
  'Sem espaços ou caracteres especiais.',
];

export function validateUsernameFormat(value) {
  const v = (value || '').trim();
  if (!v) return 'Informe um nome de usuário.';
  if (v.length < 3) return 'Mínimo de 3 caracteres.';
  if (v.length > 20) return 'Máximo de 20 caracteres.';
  if (/[0-9]/.test(v.charAt(0))) return 'Não pode começar com número.';
  if (!USERNAME_REGEX.test(v)) return 'Use apenas letras, números e underline (_).';
  return '';
}

// Checks availability against the public PocketBase endpoint.
// Returns { available: boolean, reason: string } or throws on network error.
export async function checkUsernameAvailability(value) {
  const v = (value || '').trim();
  if (!v) return { available: false, reason: 'vazio' };
  const res = await fetch(
    `/hcgi/platform/api/check-username?username=${encodeURIComponent(v)}`,
    { method: 'GET' },
  );
  if (!res.ok) throw new Error('Falha ao verificar disponibilidade.');
  return res.json();
}
