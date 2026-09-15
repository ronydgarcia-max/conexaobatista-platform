// Utilitários de CPF: máscara (000.000.000-00) e validação módulo 11.
// Validação 100% local — não usa API externa.

// Máscara de CPF: 000.000.000-00
export function formatarCpf(value) {
  const d = (value || '').replace(/\D/g, '').slice(0, 11);
  if (d.length > 9) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
  if (d.length > 6) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
  if (d.length > 3) return d.slice(0, 3) + '.' + d.slice(3);
  return d;
}

// Validação de CPF (módulo 11, padrão brasileiro).
// Retorna true para CPF válido, false caso contrário.
export function validarCpf(cpf) {
  const numeros = (cpf || '').replace(/\D/g, '');
  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false; // todos os dígitos iguais

  // Primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(numeros[i], 10) * (10 - i);
  let resto = soma % 11;
  const d1 = resto < 2 ? 0 : 11 - resto;
  if (parseInt(numeros[9], 10) !== d1) return false;

  // Segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(numeros[i], 10) * (11 - i);
  resto = soma % 11;
  const d2 = resto < 2 ? 0 : 11 - resto;
  if (parseInt(numeros[10], 10) !== d2) return false;

  return true;
}
