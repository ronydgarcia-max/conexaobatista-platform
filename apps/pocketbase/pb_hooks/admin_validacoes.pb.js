/// <reference path="../pb_data/types.d.ts" />

// Validações server-side dos painéis administrativos (Bloco 2 + P1.1).
//
// Impede auto-aprovação / auto-promoção / auto-rebaixamento e restringe
// transições de status e papel aos valores permitidos. Retorna 403
// (BadRequestError) com mensagem clara quando uma regra for violada.
//
// P1.1 — As validações foram extraídas para a função reutilizável
// `validarAcaoAdmin()` (em vinculos_utils.js), chamada tanto aqui (caminho
// REST onRecordUpdateRequest) quanto antes de saves programáticos
// (sincronizarUsuario), garantindo que NENHUM caminho de escrita das
// coleções users e vinculos_usuario_igreja fique sem validação.
//
// Painéis cobertos:
//   - /adm/aprovacao-tutores        → users.mentor_status (pendente→aprovado/rejeitado)
//   - /adm/promover-administrador   → users.papel (→admin / →membro)
//   - /adm/aprovacao-representantes → vinculos_usuario_igreja.status (pendente→ativo/recusado)

// Constantes de validação. Definidas DENTRO de cada callback porque os
// hooks do PocketBase rodam em escopos JSVM isolados — bindings de nível
// de arquivo (const/let/var no topo do arquivo) ficam undefined dentro do
// callback. (Ver HOOKS.md: "Define every helper and constant inside its
// callback; file-level bindings may be undefined.")

// ---------- users: mentor_status (Tutores) + papel (Promover Admin) ----------
// W1 — caminho REST. A validação central está em validarAcaoAdmin().
onRecordUpdateRequest((e) => {
  // Superuser (migrations/seeds/dashboard) não passa por estas regras.
  if (e.hasSuperuserAuth()) { e.next(); return; }

  const PAPEIS_PERMITIDOS = ["pastor", "secretario", "presidente", "membro", "admin"];
  const MENTOR_STATUS_FINAIS = ["aprovado", "rejeitado"];

  const { isAuthAdmin, firstId, validarAcaoAdmin } = require(`${__hooks}/vinculos_utils.js`);
  const auth = e.requestInfo().auth;
  const stored = $app.findRecordById("users", e.record.id);

  const oldMentorStatus = stored.get("mentor_status") || "";
  const newMentorStatus = e.record.get("mentor_status") || "";
  const oldPapel = stored.get("papel") || "";
  const newPapel = e.record.get("papel") || "";

  const mudouMentor = oldMentorStatus !== newMentorStatus;
  const mudouPapel = oldPapel !== newPapel;

  // Se não muda nem mentor_status nem papel, nada a validar aqui (update
  // comum de perfil passa direto).
  if (!mudouMentor && !mudouPapel) { e.next(); return; }

  // Apenas administradores (coleção admins) podem alterar mentor_status ou
  // papel de outro usuário.
  if (!isAuthAdmin(auth)) {
    throw new BadRequestError("Apenas administradores podem realizar esta ação.");
  }

  // Auto-aprovação / auto-promoção / auto-rebaixamento: o admin não pode
  // agir sobre o próprio registro.
  validarAcaoAdmin({
    authId: auth.id,
    recordId: e.record.id,
    selfActionMsg: "Você não pode aprovar, promover ou rebaixar a si mesmo.",
  });

  // --- Validações de mentor_status (Aprovação de Tutores) ---
  if (mudouMentor) {
    // Status só pode mudar de "pendente" para "aprovado" ou "rejeitado".
    validarAcaoAdmin({
      field: "mentor_status",
      oldValue: oldMentorStatus,
      newValue: newMentorStatus,
      allowedValues: MENTOR_STATUS_FINAIS,
      requireFromStatus: "pendente",
    });
    // Auditoria obrigatória: quem + quando.
    if (!e.record.get("mentor_aprovado_por")) {
      e.record.set("mentor_aprovado_por", auth.id);
    }
    if (!e.record.get("mentor_data_aprovacao")) {
      e.record.set("mentor_data_aprovacao", new Date().toISOString());
    }
  }

  // --- Validações de papel (Promover Administrador) ---
  if (mudouPapel) {
    validarAcaoAdmin({
      field: "papel",
      newValue: newPapel,
      allowedValues: PAPEIS_PERMITIDOS,
    });
    // Promoção: não pode promover quem já é admin.
    if (newPapel === "admin" && oldPapel === "admin") {
      throw new BadRequestError("Este usuário já é administrador.");
    }
    // Remoção: só pode reverter de admin para membro.
    if (oldPapel === "admin" && newPapel !== "membro") {
      throw new BadRequestError("Remoção de administrador só pode reverter o papel para 'membro'.");
    }
    // Auditoria obrigatória: quem + quando.
    if (!e.record.get("admin_promovido_por")) {
      e.record.set("admin_promovido_por", auth.id);
    }
    if (!e.record.get("admin_data_promocao")) {
      e.record.set("admin_data_promocao", new Date().toISOString());
    }
  }

  e.next();
}, "users");

// ---------- vinculos_usuario_igreja: status (Aprovação de Representantes) ----------
// W5 — caminho REST (admin). Complementa o vinculos_flow.pb.js, que valida o
// caminho do representante. Aqui validamos o caminho do ADMIN: transições de
// status permitidas e auto-aprovação. (Carrega antes alfabeticamente, então
// a validação ocorre antes do registro de histórico em vinculos_flow.pb.js.)
onRecordUpdateRequest((e) => {
  if (e.hasSuperuserAuth()) { e.next(); return; }

  const VINCULO_STATUS_FINAIS = ["ativo", "recusado"];

  const { isAuthAdmin, firstId, validarAcaoAdmin } = require(`${__hooks}/vinculos_utils.js`);
  const auth = e.requestInfo().auth;
  // Representante é validado no vinculos_flow.pb.js; aqui só interferimos no
  // caminho do admin.
  if (!isAuthAdmin(auth)) { e.next(); return; }

  const stored = $app.findRecordById("vinculos_usuario_igreja", e.record.id);
  const oldStatus = stored.get("status") || "";
  const newStatus = e.record.get("status") || "";
  if (oldStatus === newStatus) { e.next(); return; }

  const usuarioId = firstId(stored.get("usuario_id"));

  // Auto-aprovação + transição de status + valor permitido (validação central).
  validarAcaoAdmin({
    authId: auth.id,
    recordId: usuarioId,
    field: "status",
    oldValue: oldStatus,
    newValue: newStatus,
    allowedValues: VINCULO_STATUS_FINAIS,
    requireFromStatus: "pendente",
    selfActionMsg: "Você não pode aprovar o seu próprio vínculo de representante.",
  });

  // Recusa exige motivo.
  if (newStatus === "recusado" && !e.record.get("motivo_recusa")) {
    throw new BadRequestError("Informe o motivo da recusa do vínculo.");
  }

  e.next();
}, "vinculos_usuario_igreja");
