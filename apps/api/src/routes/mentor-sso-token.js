// Geração de credencial SSO (JWT) para o botão "Acessar painel do mentor".
//
// Diferente de /cursos/mentor-acesso (que monta um POST oculto para a VPS de
// cursos), este endpoint devolve apenas o token assinado + a URL de destino.
// O frontend então redireciona via GET com o token na query string:
//   https://api.conexaobatista.com.br/sso?token=TOKEN_GERADO
//
// Variáveis de ambiente (apps/api/.env):
//   MENTOR_JWT_SECRET       → segredo DEDICADO (HS256) para assinar o JWT.
//   MENTOR_PAINEL_SSO_URL   → URL base do painel do mentor (HTTPS, não privada).
//
// Payload do JWT (claims):
//   pocketbase_id, email, nome, role="mentor", destino="mentor"
// TTL: 600 segundos (10 minutos). Algoritmo: HS256.
//
// Rota protegida por authMiddleware (exige sessão PocketBase válida na
// coleção `users`):
//   GET /mentor-sso-token

import dns from 'node:dns/promises';
import logger from '../utils/logger.js';

const MENTOR_PAINEL_SSO_URL = (process.env.MENTOR_PAINEL_SSO_URL || '')
  .trim()
  .replace(/\/+$/, '');
const CURSOS_API_URL = (process.env.CURSOS_API_URL || 'https://api.conexaobatista.com.br')
  .trim()
  .replace(/\/+$/, '');
const BRIDGE_SECRET = process.env.CURSOS_API_BRIDGE_SECRET;

// ----- Validação de destino (proteção SSRF / TLS / DNS rebinding) -----
function ipEhProibido(ip) {
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
  const v6 = String(ip).toLowerCase();
  if (
    v6 === '::1' || v6 === '::' ||
    v6.startsWith('fe80') || v6.startsWith('fc') || v6.startsWith('fd')
  ) {
    return { proibido: true, motivo: 'IPv6 privado/loopback/link-local não permitido' };
  }
  return { proibido: false };
}

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
  if (host === 'localhost' || host === '::1' || host.endsWith('.localhost')) {
    return { ok: false, motivo: 'host local não permitido' };
  }
  const ipLiteral = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
  const ehIpv4Literal = /^(\d{1,3}\.){3}\d{1,3}$/.test(ipLiteral);
  const ehIpv6Literal = host.startsWith('[') && host.endsWith(']');
  if (ehIpv4Literal || ehIpv6Literal) {
    const r = ipEhProibido(ipLiteral);
    if (r.proibido) return { ok: false, motivo: r.motivo };
    return { ok: true };
  }
  let resolvidos;
  try {
    resolvidos = await resolverDnsComTimeout(host);
  } catch (e) {
    return { ok: false, motivo: `falha/timeout na resolução DNS: ${String(e?.message || e)}` };
  }
  if (!resolvidos || resolvidos.length === 0) {
    return { ok: false, motivo: 'nenhum IP resolvido para o hostname' };
  }
  for (const entry of resolvidos) {
    const r = ipEhProibido(entry.address);
    if (r.proibido) {
      return { ok: false, motivo: `IP resolvido proibido (${entry.address}): ${r.motivo}` };
    }
  }
  return { ok: true };
}

export default async (req, res) => {
  const user = req.user;
  if (!user?.id) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }

  logger.info(
    `[mentor-sso-token] Solicitação por usuário ${user.id} (${user.email || 'sem email'}) — MENTOR_PAINEL_SSO_URL="${MENTOR_PAINEL_SSO_URL || '(vazio)'}" BRIDGE_SECRET=${BRIDGE_SECRET ? 'configurado' : 'ausente'}`,
  );

  // 1. Verifica aprovação da conta e status de mentor.
  const statusAprovacao = user.status_aprovacao || '';
  const mentorStatus = user.mentor_status || '';
  if (statusAprovacao !== 'aprovado') {
    return res.status(403).json({
      error:
        'Sua conta ainda não foi aprovada. Aguarde a aprovação da sua igreja para acessar o painel do mentor.',
      status_aprovacao: statusAprovacao,
    });
  }
  if (mentorStatus !== 'aprovado') {
    return res.status(403).json({
      error:
        'Sua solicitação como mentor ainda não foi aprovada. Aguarde a aprovação do administrador.',
      mentor_status: mentorStatus,
    });
  }

  // 2. URL de destino obrigatória (fail-closed).
  if (!MENTOR_PAINEL_SSO_URL) {
    logger.error(
      `[mentor-sso-token] FAIL-CLOSED: MENTOR_PAINEL_SSO_URL ausente — usuário ${user.id} bloqueado`,
    );
    return res.status(503).json({
      error: 'Painel do mentor não configurado. Contate o administrador.',
      codigo: 'MENTOR_PAINEL_NAO_CONFIGURADO',
    });
  }

  // 3. Validação de TLS / SSRF do destino.
  const validacao = await destinoEhSeguro(MENTOR_PAINEL_SSO_URL);
  if (!validacao.ok) {
    logger.error(
      `[mentor-sso-token] Destino rejeitado: ${validacao.motivo} — MENTOR_PAINEL_SSO_URL="${MENTOR_PAINEL_SSO_URL}" — usuário ${user.id}`,
    );
    return res.status(500).json({
      error:
        'Destino do painel do mentor rejeitado por validação de segurança. Contate o administrador.',
      codigo: 'MENTOR_PAINEL_DESTINO_INVALIDO',
    });
  }

  // 4. Segredo de bridge obrigatório (para ensure + bridge-login na VPS).
  if (!BRIDGE_SECRET) {
    logger.error(
      '[mentor-sso-token] CURSOS_API_BRIDGE_SECRET ausente — não é possível autenticar na VPS',
    );
    return res.status(500).json({
      error: 'Integração de cursos não configurada. Contate o administrador.',
      codigo: 'BRIDGE_SECRET_AUSENTE',
    });
  }

  // 5. Sincroniza o usuário na VPS (best-effort) — a VPS exige que o
  //    usuário exista no seu banco antes do bridge-login.
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

  // 6. Bridge-login — obtém um token emitido pela própria VPS (assinado com
  //    o JWT_SECRET da VPS). O painel do mentor é servido pela VPS e só
  //    valida tokens emitidos por ela; tokens assinados com MENTOR_JWT_SECRET
  //    (lado Hostinger) eram rejeitados com 401. Usar o token VPS-issued
  //    alinha o SSO do mentor ao mesmo mecanismo que funciona para alunos.
  const blRes = await fetch(`${CURSOS_API_URL}/auth/bridge-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bridge-secret': BRIDGE_SECRET,
    },
    body: JSON.stringify({ pocketbase_id: user.id, email: user.email || '' }),
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
      `[mentor-sso-token] bridge-login falhou (${blRes.status}) para usuário ${user.id} — ${msg}`,
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

  // 7. URL de redirecionamento final (GET com token VPS-issued na query).
  const redirectUrl = `${MENTOR_PAINEL_SSO_URL}?token=${encodeURIComponent(token)}`;

  logger.info(
    `[mentor-sso-token] Credencial VPS gerada para usuário ${user.id} (${user.email || 'sem email'}) role=mentor destino=${MENTOR_PAINEL_SSO_URL}`,
  );

  return res.json({
    token,
    url: MENTOR_PAINEL_SSO_URL,
    redirectUrl,
    expiresAt,
    role: 'mentor',
  });
};
