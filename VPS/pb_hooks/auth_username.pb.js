/// <reference path="../pb_data/types.d.ts" />

// Auth helpers for username + email login and username availability checks.

// POST /api/auth/resolve-login
// Body: { identifier, password }
// If identifier is an email, returns it unchanged. If it is a username,
// resolves it to the user's email after verifying the password, so the
// client can then call authWithPassword(email, password). Returns a generic
// error when the username does not exist or the password is wrong, so
// usernames cannot be enumerated.
routerAdd("POST", "/api/auth/resolve-login", (e) => {
  const body = e.requestInfo().body || {};
  const identifier = (body.identifier || "").trim();
  const password = body.password || "";

  if (!identifier || !password) {
    return e.json(400, { error: "Identificador e senha são obrigatórios." });
  }

  // 1. Verifica a coleção `admins` (área administrativa separada).
  //    Contas admin usam username ou email; se encontrada e a senha bater,
  //    sinaliza `isAdmin` para o frontend redirecionar ao /adm/login.
  let adminRec = null;
  try {
    if (identifier.includes("@")) {
      adminRec = $app.findFirstRecordByFilter(
        "admins",
        "email = {:e}",
        { e: identifier.toLowerCase() },
      );
    } else {
      adminRec = $app.findFirstRecordByFilter(
        "admins",
        "username:lower = {:u}",
        { u: identifier.toLowerCase() },
      );
    }
  } catch (_) {}

  if (adminRec) {
    let validAdmin = false;
    try { validAdmin = adminRec.validatePassword(password); } catch (_) {}
    if (!validAdmin) {
      return e.json(401, { error: "Credenciais inválidas." });
    }
    return e.json(200, {
      email: adminRec.get("email") || "",
      isAdmin: true,
      username: adminRec.get("username") || "",
    });
  }

  // 2. Coleção `users` (membros/pastores/secretários).
  let email = identifier;

  if (!identifier.includes("@")) {
    // Username login — resolve case-insensitively using the `:lower`
    // field modifier (PocketBase filter expressions do NOT support calling
    // LOWER() as a function; `field:lower = value` is the correct form).
    let rec = null;
    try {
      rec = $app.findFirstRecordByFilter(
        "users",
        "username:lower = {:u}",
        { u: identifier.toLowerCase() },
      );
    } catch (err) {
      $app.logger().error("resolve-login: lookup failed", "identifier", identifier, "err", String(err));
    }

    if (!rec) {
      return e.json(401, { error: "Credenciais inválidas." });
    }

    // Verify the password before revealing the email.
    let valid = false;
    try { valid = rec.validatePassword(password); } catch (_) {}
    if (!valid) {
      return e.json(401, { error: "Credenciais inválidas." });
    }

    email = rec.get("email") || "";
    if (!email) {
      return e.json(401, { error: "Credenciais inválidas." });
    }
  }

  return e.json(200, { email: email });
});

// GET /api/check-username?username=xxx
// Public endpoint used by the signup and username-change forms for real-time
// availability validation. Only reveals whether a username is already taken.
routerAdd("GET", "/api/check-username", (e) => {
  const raw = (e.requestInfo().query["username"] || e.requestInfo().query.username || "").trim();
  if (!raw) {
    return e.json(200, { available: false, reason: "vazio" });
  }

  const re = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
  if (!re.test(raw)) {
    return e.json(200, { available: false, reason: "formato" });
  }

  let taken = false;
  try {
    const rec = $app.findFirstRecordByFilter(
      "users",
      "username:lower = {:u}",
      { u: raw.toLowerCase() },
    );
    taken = !!rec;
  } catch (err) {
    $app.logger().error("check-username: lookup failed", "username", raw, "err", String(err));
    taken = false;
  }

  return e.json(200, { available: !taken, reason: taken ? "indisponivel" : "ok" });
});

// Brand the built-in email-change confirmation email so the user receives a
// clear link to confirm the new address.
onMailerRecordEmailChangeSend((e) => {
  const appUrl = $app.settings().meta.appUrl;
  const link = `${appUrl}/_/#/auth/confirm-email-change/${e.meta.token}`;

  e.message.from.name = "Conexão Batista";
  e.message.subject = "Confirme seu novo e-mail";
  e.message.html = `
    <h1>Confirmação de alteração de e-mail</h1>
    <p>Recebemos uma solicitação para alterar o e-mail da sua conta Conexão Batista.</p>
    <p>Para confirmar o novo endereço <strong>${e.meta.newEmail}</strong>, clique no link abaixo (válido por 30 minutos):</p>
    <p><a href="${link}">Confirmar novo e-mail</a></p>
    <p>Se você não solicitou essa alteração, ignore este e-mail — seu e-mail atual não será alterado.</p>
  `;

  e.next();
}, "users");
