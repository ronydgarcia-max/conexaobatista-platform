/// <reference path="../pb_data/types.d.ts" />

// Sugestões de categorias/profissões:
//  1. On create (por usuário comum): força status="pendente", status_email
//     ="nao_enviado", email_enviado=false e carimba data_sugestao.
//  2. Rota customizada POST /api/sugestoes-profissoes/:id/enviar-email
//     (apenas administradores) — envia ao usuário o resultado da análise
//     (aceita/recusada + motivo) usando o mailer embutido do PocketBase,
//     e registra data + status do envio na própria sugestão.

onRecordCreateRequest((e) => {
  if (e.hasSuperuserAuth()) {
    e.next();
    return;
  }
  // Garante que uma sugestão nova sempre nasça pendente, independentemente
  // do que o cliente enviou.
  e.record.set("status", "pendente");
  e.record.set("status_email", "nao_enviado");
  e.record.set("email_enviado", false);
  try {
    e.record.set("data_sugestao", new Date().toISOString());
  } catch (_) {}
  e.next();
}, "sugestoes_profissoes");

// Rota de envio de e-mail ao usuário sobre o resultado da sugestão.
routerAdd("POST", "/sugestoes-profissoes/:id/enviar-email", (e) => {
  const auth = e.requestInfo().auth;
  let isAdmin = false;
  if (auth) {
    try {
      isAdmin = auth.collection().name === "admins";
    } catch (_) {}
    if (!isAdmin) {
      try {
        isAdmin = auth.collectionName === "admins";
      } catch (_) {}
    }
  }
  if (!e.hasSuperuserAuth() && !isAdmin) {
    return e.json(403, { error: "Apenas administradores podem enviar e-mails." });
  }

  const id = e.requestInfo().routeParam("id");
  let sugestao;
  try {
    sugestao = $app.findRecordById("sugestoes_profissoes", id);
  } catch (_) {
    return e.json(404, { error: "Sugestão não encontrada." });
  }

  const status = sugestao.get("status");
  if (status !== "aceita" && status !== "recusada") {
    return e.json(400, {
      error: "A sugestão ainda não foi analisada (aceita/recusada).",
    });
  }

  // E-mail do usuário que fez a sugestão.
  let userEmail = "";
  try {
    const usuarioId = sugestao.get("usuario_id");
    if (usuarioId) {
      const usuario = $app.findRecordById("users", usuarioId);
      userEmail = usuario.get("email") || "";
    }
  } catch (_) {}
  if (!userEmail) {
    sugestao.set("status_email", "erro");
    sugestao.set("email_enviado", false);
    $app.save(sugestao);
    return e.json(400, { error: "Usuário sem e-mail cadastrado." });
  }

  const nome = sugestao.get("nome") || "";
  const tipo = sugestao.get("tipo") === "categoria" ? "categoria" : "profissão";
  const motivo = sugestao.get("motivo_recusa") || "";
  const appUrl = $app.settings().meta.appUrl || "";

  let assunto = "";
  let html = "";

  if (status === "aceita") {
    assunto = "Sua sugestão foi aceita — Conexão Batista";
    html =
      '<div style="font-family:Open Sans,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">' +
      "<h2 style=\"color:#1E3A8A;font-family:Montserrat,sans-serif\">Sua sugestão foi aceita!</h2>" +
      "<p>Olá,</p>" +
      "<p>Agradecemos sua contribuição. Sua sugestão de " + tipo +
      " <strong>" + nome + "</strong> foi <strong>aceita</strong> e adicionada ao catálogo do Conexão Batista.</p>" +
      "<p>Ela já está disponível para seleção no cadastro de serviços profissionais.</p>" +
      '<p style="margin-top:24px;font-size:12px;color:#6b7280">Conexão Batista · ' + appUrl + "</p>" +
      "</div>";
  } else {
    assunto = "Atualização sobre sua sugestão — Conexão Batista";
    html =
      '<div style="font-family:Open Sans,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">' +
      "<h2 style=\"color:#1E3A8A;font-family:Montserrat,sans-serif\">Sua sugestão foi recusada</h2>" +
      "<p>Olá,</p>" +
      "<p>Agradecemos sua contribuição. Desta vez, sua sugestão de " + tipo +
      " <strong>" + nome + "</strong> foi <strong>recusada</strong>.</p>" +
      (motivo
        ? "<p><strong>Motivo:</strong> " + motivo + "</p>"
        : "") +
      "<p>Você pode enviar uma nova sugestão a qualquer momento pelo portal.</p>" +
      '<p style="margin-top:24px;font-size:12px;color:#6b7280">Conexão Batista · ' + appUrl + "</p>" +
      "</div>";
  }

  const message = new MailerMessage({
    from: { name: "Conexão Batista" },
    to: [{ address: userEmail }],
    subject: assunto,
    html: html,
  });

  try {
    $app.newMailClient().send(message);
    sugestao.set("email_enviado", true);
    sugestao.set("status_email", "enviado");
    try {
      sugestao.set("data_email_enviado", new Date().toISOString());
    } catch (_) {}
    $app.save(sugestao);
    return e.json(200, { ok: true, status: "enviado" });
  } catch (err) {
    $app
      .logger()
      .error(
        "envio email sugestao falhou",
        "sugestao",
        id,
        "err",
        String(err),
      );
    sugestao.set("email_enviado", false);
    sugestao.set("status_email", "erro");
    $app.save(sugestao);
    return e.json(500, { error: "Não foi possível enviar o e-mail agora." });
  }
});
