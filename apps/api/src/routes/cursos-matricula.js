// POST /cursos/:id/matricula — matrícula na VPS + registro local.
//
// CAUSA RAIZ CORRIGIDA (30/08/2026): a matrícula NÃO aparecia em "Meus
// Cursos" do painel-aluno da VPS porque a VPS cria a matrícula COMO EFEITO
// COLATERAL do endpoint GET /cursos/:id/token (o endpoint de token de
// acesso ao curso). A versão anterior registrava a matrícula APENAS no
// PocketBase local e nunca chamava GET /cursos/:id/token na VPS — logo a
// tabela `matriculas` da VPS ficava vazia e GET /aluno/cursos retornava [].
//
// Probe confirmado (30/08/2026):
//   - POST /cursos/:id/matricula        → 404 "Cannot POST" (NÃO existe)
//   - POST /usuarios/:id/cursos/:cursoId → 404 "Cannot POST" (NÃO existe)
//   - GET  /cursos/:id/token            → 200 + { token, matricula } (CRIA a
//     matrícula idempotentemente; chamadas repetidas devolvem o mesmo id)
//   - Após o token, GET /aluno/cursos   → lista o curso ✅
//
// Fluxo corrigido:
//   1. Valida que o curso existe e está publicado (VPS /admin/cursos);
//   2. Sincroniza o usuário na VPS (POST /usuarios/ensure);
//   3. Autentica o usuário na VPS (POST /auth/bridge-login) → cursosToken
//      (OBRIGATÓRIO — sem ele não é possível criar a matrícula na VPS);
//   4. CRIA A MATRÍCULA NA VPS chamando GET /cursos/:id/token com o
//      cursosToken (efeito colateral idempotente). OBRIGATÓRIO — é isto que
//      faz o curso aparecer em "Meus Cursos" do painel-aluno;
//   5. Verifica a persistência lendo GET /aluno/cursos (best-effort, log);
//   6. Registra a matrícula LOCAL no PocketBase (idempotente — índice único
//      usuario_id + curso_api_id impede duplicatas) para a página local
//      "Meus Cursos" (/curso/meus-cursos).
//
// Rota protegida por authMiddleware (exige sessão PocketBase válida).

import pocketbaseClient from "../utils/pocketbaseClient.js";
import logger from "../utils/logger.js";

const CURSOS_API_URL = (
  process.env.CURSOS_API_URL || "https://api.conexaobatista.com.br"
).replace(/\/+$/, "");
const ADMIN_API_URL = (
  process.env.CURSOS_ADMIN_API_URL || CURSOS_API_URL
).replace(/\/+$/, "");
const BRIDGE_SECRET = process.env.CURSOS_API_BRIDGE_SECRET;

export default async (req, res) => {
  const user = req.user;
  if (!user?.id) {
    return res.status(401).json({ error: "Não autenticado." });
  }
  const { id: cursoId } = req.params;
  if (!cursoId) {
    return res.status(422).json({ error: "ID do curso é obrigatório." });
  }
  if (!BRIDGE_SECRET) {
    throw new Error(
      "CURSOS_API_BRIDGE_SECRET não configurado em apps/api/.env",
    );
  }

  const stamp = () => new Date().toISOString();
  logger.info(
    `[matricula][${stamp()}] Início — usuário=${user.id} curso=${cursoId}`,
  );

  // 1. Valida curso publicado na VPS e obtém metadados.
  let curso = null;
  try {
    const upstream = await fetch(`${ADMIN_API_URL}/admin/cursos`, {
      headers: { "x-bridge-secret": BRIDGE_SECRET },
    });
    if (upstream.ok) {
      const text = await upstream.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (_) {}
      const lista = Array.isArray(data) ? data : data?.cursos || [];
      curso = lista.find(
        (c) =>
          c && String(c.id) === String(cursoId) && c.status === "publicado",
      );
    }
  } catch (_) {}
  if (!curso) {
    logger.info(
      `[matricula][${stamp()}] Curso ${cursoId} não encontrado/não publicado`,
    );
    return res
      .status(404)
      .json({ error: "Curso não encontrado ou não publicado." });
  }
  logger.info(
    `[matricula][${stamp()}] Curso validado: ${curso.id} "${curso.titulo || ""}"`,
  );

  // 2. Sincroniza usuário na VPS (best-effort — o bridge-login também faz).
  try {
    await fetch(`${CURSOS_API_URL}/usuarios/ensure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bridge-secret": BRIDGE_SECRET,
      },
      body: JSON.stringify({
        pocketbase_id: user.id,
        email: user.email,
        nome: user.name || user.email,
      }),
    });
    logger.info(`[matricula][${stamp()}] Usuário sincronizado (ensure)`);
  } catch (_) {
    logger.info(`[matricula][${stamp()}] ensure best-effort falhou (segue)`);
  }

  // 3. Bridge-login na VPS — OBRIGATÓRIO. Sem o cursosToken não é possível
  //    criar a matrícula na VPS (passo 4). Persiste o token no PocketBase.
  let cursosToken = "";
  try {
    const bl = await fetch(`${CURSOS_API_URL}/auth/bridge-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bridge-secret": BRIDGE_SECRET,
      },
      body: JSON.stringify({ pocketbase_id: user.id, email: user.email }),
    });
    if (!bl.ok) {
      throw new Error(
        `bridge-login failed: ${bl.status} ${bl.statusText}`,
      );
    }
    const blText = await bl.text();
    let blData = null;
    try {
      blData = blText ? JSON.parse(blText) : {};
    } catch (_) {
      blData = {};
    }
    cursosToken = blData.token || "";
    if (!cursosToken) {
      throw new Error("bridge-login não retornou token.");
    }
    let expiresAt = blData.expiresAt || blData.expires_at || "";
    if (!expiresAt) {
      try {
        const parts = cursosToken.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64").toString("utf8"),
          );
          if (payload?.exp) {
            expiresAt = new Date(payload.exp * 1000).toISOString();
          }
        }
      } catch (_) {}
    }
    try {
      await pocketbaseClient.collection("users").update(user.id, {
        cursos_api_token: cursosToken,
        cursos_api_token_expires: expiresAt || "",
      });
    } catch (_) {}
    logger.info(`[matricula][${stamp()}] Bridge-login OK (token obtido)`);
  } catch (e) {
    logger.error(
      `[matricula][${stamp()}] Bridge-login falhou — usuário=${user.id}: ${e?.message || e}`,
    );
    throw new Error(
      "Não foi possível autenticar na plataforma de cursos. Tente novamente em instantes.",
    );
  }

  // 4. CRIA A MATRÍCULA NA VPS — OBRIGATÓRIO. A VPS cria a matrícula como
  //    efeito colateral do endpoint GET /cursos/:id/token (idempotente).
  //    É isto que faz o curso aparecer em "Meus Cursos" do painel-aluno.
  let vpsMatricula = null;
  let vpsCursoToken = "";
  try {
    const tk = await fetch(
      `${CURSOS_API_URL}/cursos/${encodeURIComponent(String(curso.id))}/token`,
      { headers: { Authorization: `Bearer ${cursosToken}` } },
    );
    if (!tk.ok) {
      throw new Error(
        `cursos/${curso.id}/token failed: ${tk.status} ${tk.statusText}`,
      );
    }
    const tkText = await tk.text();
    let tkData = null;
    try {
      tkData = tkText ? JSON.parse(tkText) : {};
    } catch (_) {
      tkData = {};
    }
    vpsCursoToken = tkData.token || "";
    vpsMatricula = tkData.matricula || null;
    if (!vpsMatricula) {
      throw new Error("token endpoint não retornou objeto matricula.");
    }
    logger.info(
      `[matricula][${stamp()}] Matrícula criada na VPS — id=${vpsMatricula.id} usuario_id=${vpsMatricula.usuario_id} curso_id=${vpsMatricula.curso_id} status=${vpsMatricula.status}`,
    );
  } catch (e) {
    logger.error(
      `[matricula][${stamp()}] Falha ao criar matrícula na VPS — usuário=${user.id} curso=${curso.id}: ${e?.message || e}`,
    );
    throw new Error(
      "Não foi possível registrar sua matrícula na plataforma de cursos. Tente novamente.",
    );
  }

  // 5. Verificação de persistência (best-effort) — confirma que o curso
  //    agora aparece em /aluno/cursos na VPS. Não bloqueia o fluxo.
  try {
    const ver = await fetch(`${CURSOS_API_URL}/aluno/cursos`, {
      headers: { Authorization: `Bearer ${cursosToken}` },
    });
    if (ver.ok) {
      const verText = await ver.text();
      let verData = null;
      try {
        verData = verText ? JSON.parse(verText) : [];
      } catch (_) {
        verData = [];
      }
      const arr = Array.isArray(verData) ? verData : verData?.cursos || [];
      const presente = arr.some(
        (c) => c && String(c.id) === String(curso.id),
      );
      logger.info(
        `[matricula][${stamp()}] Verificação /aluno/cursos — curso ${curso.id} ${presente ? "presente ✅" : "AUSENTE ⚠️"} (${arr.length} cursos listados)`,
      );
    } else {
      logger.info(
        `[matricula][${stamp()}] Verificação /aluno/cursos não-OK: ${ver.status} ${ver.statusText}`,
      );
    }
  } catch (e) {
    logger.info(
      `[matricula][${stamp()}] Verificação best-effort indisponível: ${e?.message || e}`,
    );
  }

  // 6. Matrícula local idempotente (backup para a página local "Meus Cursos").
  const filtro = `usuario_id = "${user.id}" && curso_api_id = "${String(curso.id)}"`;
  let matricula = null;
  let jaMatriculado = false;
  try {
    const existente = await pocketbaseClient
      .collection("matriculas")
      .getFullList({ filter: filtro });
    if (existente && existente.length > 0) {
      matricula = existente[0];
      jaMatriculado = true;
    }
  } catch (_) {}

  if (!matricula) {
    try {
      matricula = await pocketbaseClient.collection("matriculas").create({
        usuario_id: user.id,
        curso_api_id: String(curso.id),
        curso_titulo: curso.titulo || "",
        curso_imagem: curso.imagem_url || "",
        curso_mentor: curso.mentor_nome || curso.instrutor || "",
        curso_preco: Number(curso.preco) || 0,
        status: "ativa",
      });
    } catch (e) {
      // Race condition (índice único) — tenta ler novamente.
      try {
        const existente = await pocketbaseClient
          .collection("matriculas")
          .getFullList({ filter: filtro });
        if (existente && existente.length > 0) {
          matricula = existente[0];
          jaMatriculado = true;
        }
      } catch (_) {}
      if (!matricula) {
        logger.error(
          `[matricula][${stamp()}] Matrícula local falhou (VPS já ok): ${e?.message || e}`,
        );
        // A matrícula na VPS já foi criada (passo 4); o registro local é
        // apenas backup. Não bloqueia — retorna sucesso com a matrícula VPS.
      }
    }
  }

  logger.info(
    `[matricula][${stamp()}] Fim — usuário=${user.id} curso=${curso.id} vps_matricula_id=${vpsMatricula?.id} local=${jaMatriculado ? "existente" : matricula ? "nova" : "indisponível"}`,
  );

  return res.status(200).json({
    sucesso: true,
    mensagem: jaMatriculado
      ? "Você já está matriculado neste curso."
      : "Matrícula realizada com sucesso!",
    matricula,
    ja_matriculado: jaMatriculado,
    vps_matricula: vpsMatricula,
    cursos_token: cursosToken || undefined,
  });
};
