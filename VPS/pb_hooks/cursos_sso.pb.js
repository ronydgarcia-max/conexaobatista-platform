/// <reference path="../pb_data/types.d.ts" />

// SSO entre PocketBase e a API de cursos externa (http://69.62.124.240:3333).
//
// 1. Hook pós-login (users): após autenticação bem-sucedida por senha, chama o
//    endpoint /auth/bridge-login da API de cursos enviando pocketbase_id + email
//    (com o header x-bridge-secret) e persiste o JWT retornado no registro do
//    usuário (cursos_api_token + cursos_api_token_expires).
//
// 2. Hooks de sincronização de cursos (cursos): quando um admin cria/atualiza/
//    exclui um curso no PocketBase, replica a operação na API de cursos externa
//    (POST/PUT/DELETE /cursos) usando o header x-bridge-secret.
//
// OBS.: O PocketBase só consegue ler CURSOS_API_BRIDGE_SECRET e CURSOS_API_URL se
// essas variáveis estiverem presentes no seu ambiente de processo. Quando não
// estiverem, os hooks registram um aviso e seguem sem abortar o fluxo principal
// (a aquisição confiável do token pelo frontend é feita via Express, que lê
// apps/api/.env). Estes hooks são best-effort.

// IMPORTANTE: cada callback de hook roda em um escopo JSVM isolado — variáveis
// de nível superior NÃO são visíveis dentro deles (ReferenceError). Por isso o
// env é lido dentro de cada handler através destas funções locais.

// ---------- 1. Pós-login: bridge-login + persistência do token ----------
// onRecordAuthRequest dispara após autenticação bem-sucedida (senha, OTP, OAuth2,
// refresh) e antes da resposta — e.record já é o usuário autenticado.
onRecordAuthRequest((e) => {
  const CURSOS_API_URL = ($os.getenv("CURSOS_API_URL") || "https://api.conexaobatista.com.br").replace(/\/+$/, "");
  const CURSOS_API_BRIDGE_SECRET = $os.getenv("CURSOS_API_BRIDGE_SECRET") || "";
  if (!CURSOS_API_BRIDGE_SECRET) {
    $app.logger().warn("cursos_sso: CURSOS_API_BRIDGE_SECRET ausente no env do PocketBase — pulando bridge-login pós-login");
    e.next();
    return;
  }

  const rec = e.record;
  if (!rec) { e.next(); return; }

  const userId = rec.id;
  const email = rec.get("email") || "";

  try {
    const res = $http.send({
      url: CURSOS_API_URL + "/auth/bridge-login",
      method: "POST",
      body: JSON.stringify({ pocketbase_id: userId, email: email }),
      headers: {
        "Content-Type": "application/json",
        "x-bridge-secret": CURSOS_API_BRIDGE_SECRET,
      },
      timeout: 10,
    });

    if (res.statusCode !== 200) {
      $app.logger().error("cursos_sso: bridge-login falhou", "status", res.statusCode, "body", String(res.body || ""));
      e.next();
      return;
    }

    let data = null;
    try { data = JSON.parse(res.body || "{}"); } catch (_) { data = {}; }

    const token = data.token || "";
    if (!token) {
      $app.logger().error("cursos_sso: bridge-login sem token no corpo", "body", String(res.body || ""));
      e.next();
      return;
    }

    // Persiste token + expiração conservadora (7 dias) no registro do usuário.
    e.record.set("cursos_api_token", token);
    try {
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      e.record.set("cursos_api_token_expires", expires);
    } catch (_) {}
    $app.save(e.record);
  } catch (err) {
    $app.logger().error("cursos_sso: erro no bridge-login pós-login", "err", String(err));
  }


  e.next();
}, "users");

// ---------- 2. Sincronização de cursos (admin) ----------
// Criar curso → POST /cursos
onRecordAfterCreateSuccess((e) => {
  const CURSOS_API_URL = ($os.getenv("CURSOS_API_URL") || "https://api.conexaobatista.com.br").replace(/\/+$/, "");
  const CURSOS_API_BRIDGE_SECRET = $os.getenv("CURSOS_API_BRIDGE_SECRET") || "";
  if (!CURSOS_API_BRIDGE_SECRET) { e.next(); return; }
  try {
    const res = $http.send({
      url: CURSOS_API_URL + "/cursos",
      method: "POST",
      body: JSON.stringify({
        titulo: e.record.get("titulo") || "",
        descricao: e.record.get("descricao") || "",
        instrutor: e.record.get("instrutor") || "",
        preco: e.record.get("preco") || 0,
        carga_horaria: e.record.get("carga_horaria") || "",
        categoria: e.record.get("categoria") || "",
        nivel: e.record.get("nivel") || "",
        imagem_url: e.record.get("imagem_url") || "",
        status: e.record.get("status") || "rascunho",
        pocketbase_id: e.record.id,
      }),
      headers: { "Content-Type": "application/json", "x-bridge-secret": CURSOS_API_BRIDGE_SECRET },
      timeout: 15,
    });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      let data = null;
      try { data = JSON.parse(res.body || "{}"); } catch (_) { data = {}; }
      const apiId = data.id || data.curso_id || data._id || "";
      if (apiId) {
        e.record.set("curso_api_id", String(apiId));
        $app.save(e.record);
      }
    } else {
      $app.logger().error("cursos_sso: sync create falhou", "status", res.statusCode, "body", String(res.body || ""));
    }
  } catch (err) {
    $app.logger().error("cursos_sso: erro sync create", "err", String(err));
  }
  e.next();
}, "cursos");

// Atualizar curso → PUT /cursos/:id
onRecordAfterUpdateSuccess((e) => {
  const CURSOS_API_URL = ($os.getenv("CURSOS_API_URL") || "https://api.conexaobatista.com.br").replace(/\/+$/, "");
  const CURSOS_API_BRIDGE_SECRET = $os.getenv("CURSOS_API_BRIDGE_SECRET") || "";
  if (!CURSOS_API_BRIDGE_SECRET) { e.next(); return; }
  const apiId = e.record.get("curso_api_id") || "";
  if (!apiId) { e.next(); return; }
  try {
    const res = $http.send({
      url: CURSOS_API_URL + "/cursos/" + apiId,
      method: "PUT",
      body: JSON.stringify({
        titulo: e.record.get("titulo") || "",
        descricao: e.record.get("descricao") || "",
        instrutor: e.record.get("instrutor") || "",
        preco: e.record.get("preco") || 0,
        carga_horaria: e.record.get("carga_horaria") || "",
        categoria: e.record.get("categoria") || "",
        nivel: e.record.get("nivel") || "",
        imagem_url: e.record.get("imagem_url") || "",
        status: e.record.get("status") || "rascunho",
        pocketbase_id: e.record.id,
      }),
      headers: { "Content-Type": "application/json", "x-bridge-secret": CURSOS_API_BRIDGE_SECRET },
      timeout: 15,
    });
    if (res.statusCode < 200 || res.statusCode >= 300) {
      $app.logger().error("cursos_sso: sync update falhou", "status", res.statusCode, "body", String(res.body || ""));
    }
  } catch (err) {
    $app.logger().error("cursos_sso: erro sync update", "err", String(err));
  }
  e.next();
}, "cursos");

// Excluir curso → DELETE /cursos/:id
onRecordAfterDeleteSuccess((e) => {
  const CURSOS_API_URL = ($os.getenv("CURSOS_API_URL") || "https://api.conexaobatista.com.br").replace(/\/+$/, "");
  const CURSOS_API_BRIDGE_SECRET = $os.getenv("CURSOS_API_BRIDGE_SECRET") || "";
  if (!CURSOS_API_BRIDGE_SECRET) { e.next(); return; }
  const apiId = e.record.get("curso_api_id") || "";
  if (!apiId) { e.next(); return; }
  try {
    const res = $http.send({
      url: CURSOS_API_URL + "/cursos/" + apiId,
      method: "DELETE",
      headers: { "x-bridge-secret": CURSOS_API_BRIDGE_SECRET },
      timeout: 15,
    });
    if (res.statusCode < 200 || res.statusCode >= 300) {
      $app.logger().error("cursos_sso: sync delete falhou", "status", res.statusCode, "body", String(res.body || ""));
    }
  } catch (err) {
    $app.logger().error("cursos_sso: erro sync delete", "err", String(err));
  }
  e.next();
}, "cursos");
