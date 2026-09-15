// SSO para a área do Mentor — gera uma credencial assinada (JWT) de curta duração
// para o ambiente real do mentor.
//
// Variáveis de ambiente (apps/api/.env):
//   MENTOR_JWT_SECRET   → segredo DEDICADO para assinar o JWT do Mentor
//                         (NÃO reutiliza CURSOS_API_BRIDGE_SECRET, que fica
//                         reservado para o SSO existente da plataforma de cursos)
//   MENTOR_REAL_URL     → URL real do ambiente mentor (ex.: https://mentor.dominio.com)
//   MENTOR_ENV          → "demo" | "production" (padrão: production)
//
// Comportamento (fail-closed em produção):
//   - MENTOR_ENV=demo (explícito) → retorna env=demo (painel demonstrativo).
//   - MENTOR_ENV=production + MENTOR_REAL_URL válida (HTTPS, não privada) +
//     MENTOR_JWT_SECRET configurado → gera JWT e retorna URL + token.
//   - MENTOR_ENV=production + MENTOR_REAL_URL vazia → 503 + log (NÃO cai em demo).
//   - MENTOR_ENV=production + MENTOR_REAL_URL inválida (HTTP/IP privado/file) →
//     500 + log de auditoria (proteção SSRF).
//   - MENTOR_JWT_SECRET ausente → 500 + log.
//
// Rota protegida por authMiddleware (exige sessão PocketBase válida):
//   GET /cursos/mentor-acesso

import dns from 'node:dns/promises';
import logger from '../utils/logger.js';

const MENTOR_REAL_URL = (process.env.MENTOR_REAL_URL || '').trim().replace(/\/+$/, '');
const MENTOR_PAINEL_SSO_URL = (process.env.MENTOR_PAINEL_SSO_URL || '')
  .trim()
  .replace(/\/+$/, '');
const MENTOR_ENV = (process.env.MENTOR_ENV || 'production').toLowerCase().trim();
const CURSOS_API_URL = (process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br')
  .trim()
  .replace(/\/+$/, '');
const BRIDGE_SECRET = process.env.CURSOS_API_BRIDGE_SECRET;

// ----- Validação de destino (proteção SSRF / TLS / DNS rebinding) -----
// Rejeita esquemas não-HTTPS, file://, localhost e faixas de IP privadas.
// P2.1 — Além de validar o hostname literal, resolve o DNS do hostname e
// valida CADA IP resolvido contra as listas de bloqueio, mitigando DNS
// rebinding (um domínio que resolve para um IP público na validação e um
// IP privado na conexão real).
//
// Limitação documentada (IP pinning): o servidor Express NÃO abre conexão
// com MENTOR_REAL_URL — ele apenas valida a URL e devolve ao frontend, que
// faz o POST do formulário no navegador. Portanto o IP pinning puro (conectar
// ao IP validado em vez do hostname) não é aplicável neste fluxo, pois a
// conexão sai do navegador e exige o hostname (SNI/virtual host). A resolução
// DNS aqui protege a etapa de validação; uma janela TOCTOU mínima permanece
// entre a validação e a conexão do navegador, mitigada pelo TTL curto do JWT
// (10 min) e pela exigência de HTTPS.

// Verifica se um IP (v4 ou v6 string) pertence a faixas proibidas.
function ipEhProibido(ip) {
  // IPv4
  const ipv4 = String(ip).match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    const octetosOk = ipv4.slice(1).every((o) => Number(o) >= 0 && Number(o) <= 255);
    if (!octetosOk) return { proibido: true, motivo: 'IPv4 malformado' };
    if (a === 10) return { proibido: true, motivo: 'IP privado (10.x) não permitido' };
    if (a === 127) return { proibido: true, motivo: 'IP loopback (127.x) não permitido' };
    if (a === 0) return { proibido: true, motivo: 'IP reservado (0.x) não permitido' };
    if (a === 169 && b === 254) return { proibido: true, motivo: 'IP link-local (169.254.x) não permitido' };
    if (a === 172 && b >= 16 && b <= 31) return { proibido: true, motivo: 'IP privado (172.16-31.x) não permitido' };
    if (a === 192 && b === 168) return { proibido: true, motivo: 'IP privado (192.168.x) não permitido' };
    if (a >= 224) return { proibido: true, motivo: 'IP reservado/multicast não permitido' };
    return { proibido: false };
  }
  // IPv6
  const v6 = String(ip).toLowerCase();
  if (
    v6 === '::1' || v6 === '::' ||
    v6.startsWith('fe80') || v6.startsWith('fc') || v6.startsWith('fd')
  ) {
    return { proibido: true, motivo: 'IPv6 privado/loopback/link-local não permitido' };
  }
  return { proibido: false };
}

// Resolve o hostname com timeout de 5 segundos.
async function resolverDnsComTimeout(hostname) {
  return Promise.race([
    dns.lookup(hostname, { all: true }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout de resolução DNS (5s)')), 5000),
    ),
  ]);
}

async function destinoEhSeguro(rawUrl) {
  if (!rawUrl) return { ok: false, motivo: 'URL vazia' };

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (_) {
    return { ok: false, motivo: 'URL malformada' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, motivo: `esquema não permitido: ${parsed.protocol}` };
  }

  const host = parsed.hostname.toLowerCase();

  // Nomes de host explícitos a rejeitar.
  if (host === 'localhost' || host === '::1' || host.endsWith('.localhost')) {
    return { ok: false, motivo: 'host local não permitido' };
  }

  // IP literal entre colchetes (IPv6) ou IPv4 direto — valida direto.
  const ipLiteral = host.startsWith('[') && host.endsWith(']')
    ? host.slice(1, -1)
    : host;
  const ehIpv4Literal = /^(\d{1,3}\.){3}\d{1,3}$/.test(ipLiteral);
  const ehIpv6Literal = host.startsWith('[') && host.endsWith(']');

  if (ehIpv4Literal || ehIpv6Literal) {
    const r = ipEhProibido(ipLiteral);
    if (r.proibido) return { ok: false, motivo: r.motivo };
    return { ok: true };
  }

  // P2.1 — DNS rebinding: resolve o hostname e valida CADA IP resolvido.
  // Rejeita se QUALQUER IP resolvido for proibido.
  let resolvidos;
  try {
    resolvidos = await resolverDnsComTimeout(host);
  } catch (e) {
    return {
      ok: false,
      motivo: `falha/timeout na resolução DNS: ${String(e?.message || e)}`,
    };
  }
  if (!resolvidos || resolvidos.length === 0) {
    return { ok: false, motivo: 'nenhum IP resolvido para o hostname' };
  }
  for (const entry of resolvidos) {
    const r = ipEhProibido(entry.address);
    if (r.proibido) {
      return {
        ok: false,
        motivo: `IP resolvido proibido (${entry.address}): ${r.motivo}`,
      };
    }
  }

  return { ok: true };
}

export default async (req, res) => {
  const user = req.user;
  if (!user?.id) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  // ----- Log de verificação de variáveis de ambiente (sem expor segredos) -----
  // Registra qual MENTOR_ENV e qual MENTOR_REAL_URL foram lidos, qual ambiente
  // foi utilizado e qual URL foi usada no redirecionamento. NÃO expõe tokens,
  // JWTs ou credenciais (MENTOR_JWT_SECRET nunca é logado).
  logger.info(
    `[mentor-sso] Variáveis lidas — MENTOR_ENV="${MENTOR_ENV}" MENTOR_REAL_URL="${MENTOR_REAL_URL || '(vazio)'}" BRIDGE_SECRET=${BRIDGE_SECRET ? 'configurado' : 'ausente'} — usuário ${user.id} (${user.email || 'sem email'})`,
  );

  // 1. Verifica aprovação da conta.
  const statusAprovacao = user.status_aprovacao || '';
  if (statusAprovacao !== 'aprovado') {
    return res.status(403).json({
      error:
        'Sua conta ainda não foi aprovada. Aguarde a aprovação da sua igreja para acessar a área do mentor.',
      status_aprovacao: statusAprovacao,
    });
  }

  // 2. Ambiente demonstrativo — apenas quando MENTOR_ENV=demo explícito.
  if (MENTOR_ENV === 'demo') {
    logger.info(
      `[mentor-sso] Ambiente utilizado: demo (demonstrativo) — URL utilizada: nenhuma (painel demo) — usuário ${user.id}`,
    );
    return res.json({
      env: 'demo',
      configured: !!MENTOR_REAL_URL,
      url: null,
      token: null,
      motivo: 'demo',
    });
  }

  // 3. Ambiente de produção — fail-closed: URL ausente NÃO cai em demo.
  if (!MENTOR_REAL_URL) {
    logger.error(
      `[mentor-sso] FAIL-CLOSED: MENTOR_ENV=production mas MENTOR_REAL_URL ausente — usuário ${user.id} (${user.email || 'sem email'}) bloqueado`,
    );
    return res.status(503).json({
      error:
        'Ambiente de Mentor não configurado. Contate o administrador.',
      codigo: 'MENTOR_NAO_CONFIGURADO',
    });
  }

  // 4. Validação de TLS / SSRF do destino (com resolução DNS anti-rebinding).
  const validacao = await destinoEhSeguro(MENTOR_REAL_URL);
  if (!validacao.ok) {
    logger.error(
      `[mentor-sso] Destino rejeitado por validação de segurança: ${validacao.motivo} — MENTOR_REAL_URL="${MENTOR_REAL_URL}" — usuário ${user.id} (${user.email || 'sem email'})`,
    );
    return res.status(500).json({
      error:
        'Destino do ambiente do mentor rejeitado por validação de segurança. Contate o administrador.',
      codigo: 'MENTOR_DESTINO_INVALIDO',
    });
  }

  // 5. Segredo de bridge obrigatório (para ensure + bridge-login na VPS).
  if (!BRIDGE_SECRET) {
    logger.error(
      '[mentor-sso] CURSOS_API_BRIDGE_SECRET ausente — não é possível autenticar na VPS',
    );
    return res.status(500).json({
      error: 'Integração de cursos não configurada. Contate o administrador.',
      codigo: 'BRIDGE_SECRET_AUSENTE',
    });
  }

  // 6. Sincroniza o usuário na VPS (best-effort).
  try {
    await fetch(`${CURSOS_API_URL}/usuarios/ensure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bridge-secret': BRIDGE_SECRET,
      },
      body: JSON.stringify({
        pocketbase_id: user.id,
        email: user.email || '',
        nome: user.name || user.email || '',
      }),
    });
  } catch (_) {}

  // 7. Bridge-login — token VPS-issued (o painel do mentor é servido pela
  //    VPS e só valida tokens emitidos por ela; tokens assinados com
  //    MENTOR_JWT_SECRET eram rejeitados com 401).
  const role = user.mentor_status === 'aprovado' ? 'mentor' : 'aluno';
  const blRes = await fetch(`${CURSOS_API_URL}/auth/bridge-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bridge-secret': BRIDGE_SECRET,
    },
    body: JSON.stringify({
      pocketbase_id: user.id,
      email: user.email || '',
      nome: user.name || user.email || '',   // 👈 CORREÇÃO: envia o nome
      mentor_status: user.mentor_status || null, // 👈 CORREÇÃO: envia o status do mentor
    }),
  });
  const blText = await blRes.text();
  let blData = {};
  try {
    blData = blText ? JSON.parse(blText) : {};
  } catch (_) {
    blData = { message: blText };
  }
  if (!blRes.ok || !blData.token) {
    const msg =
      blData?.error ||
      blData?.message ||
      'Não foi possível autenticar na plataforma de cursos. Tente novamente.';
    logger.error(
      `[mentor-sso] bridge-login falhou (${blRes.status}) para usuário ${user.id} — ${msg}`,
    );
    return res.status(502).json({ error: msg });
  }

  const token = blData.token;
  let expiresAt = blData.expiresAt || blData.expires_at || '';
  if (!expiresAt) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], 'base64').toString('utf8'),
        );
        if (payload?.exp) {
          expiresAt = new Date(payload.exp * 1000).toISOString();
        }
      }
    } catch (_) {}
  }

  logger.info(
    `[mentor-sso] Credencial VPS gerada para usuário ${user.id} (${user.email || 'sem email'}) role=${role} destino=${MENTOR_PAINEL_SSO_URL || MENTOR_REAL_URL}`,
  );

  const redirectUrl = MENTOR_PAINEL_SSO_URL
    ? `${MENTOR_PAINEL_SSO_URL}?token=${encodeURIComponent(token)}`
    : `${MENTOR_REAL_URL}?token=${encodeURIComponent(token)}`;

  return res.json({
    env: 'production',
    configured: true,
    url: MENTOR_REAL_URL,
    redirectUrl,
    token,
    expiresAt,
    role,
  });
};
