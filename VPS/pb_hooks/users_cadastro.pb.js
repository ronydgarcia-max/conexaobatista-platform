/// <reference path="../pb_data/types.d.ts" />

// Cadastro (registration) server-side enforcement for the `users` collection:
//  1. On create (by a regular visitor): require both document acceptances,
//     force status_cadastro to "aguardando_aprovacao" and stamp data_envio.
//  2. On update: only a superuser (church/admin via the dashboard) may change
//     status_cadastro or data_envio. Regular users editing their own profile
//     cannot self-approve.

onRecordCreateRequest((e) => {
  // Superusers (admin dashboard) are exempt from the public-signup rules.
  if (e.hasSuperuserAuth()) {
    e.next();
    return;
  }

  const consent = e.record.getBool("aceitou_consentimento");
  const termos = e.record.getBool("aceitou_termos");

  if (!consent || !termos) {
    throw new BadRequestError(
      "Para concluir o cadastro é necessário abrir, ler e aceitar tanto o Consentimento para uso dos dados quanto os Termos de Uso e Política de Privacidade.",
    );
  }

  // Force pending status + submission date regardless of what the client sent.
  e.record.set("status_cadastro", "aguardando_aprovacao");
  e.record.set("status_aprovacao", "pendente");
  e.record.set("papel", "membro");
  try {
    e.record.set("data_envio", new Date().toISOString());
  } catch (_) {}

  e.next();
}, "users");

onRecordUpdateRequest((e) => {
  // Only superusers OR administrators authenticated against the `admins`
  // collection may change the approval status or submission date freely.
  // Pastors/Secretaries (papel set on the `users` collection) may change
  // ONLY the church-approval fields (status_aprovacao, motivo_recusa,
  // status_cadastro) for users in their own church. Regular users editing
  // their own profile cannot self-approve or change their role/church.
  const auth = e.requestInfo().auth;
  let isAdmin = false;
  let isChurchRep = false;
  let repIgrejaId = "";

  if (auth) {
    try {
      isAdmin = auth.collection().name === "admins";
    } catch (_) {}
    if (!isAdmin) {
      try { isAdmin = auth.collectionName === "admins"; } catch (_) {}
    }

    // Detect pastor/secretario authenticated against the users collection.
    let authColName = "";
    try { authColName = auth.collection().name; } catch (_) {}
    if (!authColName) {
      try { authColName = auth.collectionName; } catch (_) {}
    }
    if (authColName === "users") {
      try {
        const papel = auth.get("papel") || "";
        if (papel === "pastor" || papel === "secretario") {
          isChurchRep = true;
          const rawIgreja = auth.get("igreja_id");
          repIgrejaId = Array.isArray(rawIgreja) ? rawIgreja[0] || "" : rawIgreja || "";
        }
      } catch (_) {}
    }
  }

  // Superusers and general admins — full access.
  if (e.hasSuperuserAuth() || isAdmin) {
    e.next();
    return;
  }

  // Church representatives — may only touch approval fields for their church.
  if (isChurchRep) {
    try {
      const stored = $app.findRecordById("users", e.record.id);
      const rawTarget = stored.get("igreja_id");
      const targetIgreja = Array.isArray(rawTarget) ? rawTarget[0] || "" : rawTarget || "";

      if (targetIgreja !== repIgrejaId) {
        throw new BadRequestError(
          "Você só pode gerenciar membros da sua própria igreja.",
        );
      }

      // --- Validação por vínculo (vinculos_usuario_igreja) ---
      // Impede auto-aprovação e exige vínculo ativo com permissão de aprovação
      // quando o representante está alterando o status de aprovação do membro.
      const newStatus = e.record.get("status_aprovacao");
      const oldStatus = stored.get("status_aprovacao");
      const changingApproval = newStatus !== oldStatus;

      if (changingApproval && auth.id === e.record.id) {
        throw new BadRequestError(
          "Você não pode aprovar o seu próprio vínculo.",
        );
      }

      if (changingApproval) {
        let podeAprovar = false;
        let temVinculo = false;
        try {
          const vinculos = $app.findRecordsByFilter(
            "vinculos_usuario_igreja",
            "usuario_id = '" + auth.id + "' && igreja_id = '" + repIgrejaId + "'",
            "created",
            10,
          );
          temVinculo = vinculos.length > 0;
          podeAprovar = vinculos.some(function (v) {
            return v.get("status") === "ativo" &&
              v.get("pode_aprovar_membros") === true &&
              (v.get("papel") === "pastor" || v.get("papel") === "secretario");
          });
        } catch (_) {}
        // Se existe vínculo, ele deve estar ativo e com permissão de aprovação.
        // Se não existe vínculo (legado), mantém o fallback pelo papel.
        if (temVinculo && !podeAprovar) {
          throw new BadRequestError(
            "Seu vínculo com esta igreja não permite aprovar membros.",
          );
        }
      }

      // Lock every field except the three approval-related ones so a
      // malicious client cannot tamper with name, email, role, etc.
      const lockedFields = [
        "name", "email", "whatsapp", "sexo", "cidade","aceitou_consentimento", "aceitou_termos", "data_envio",
        "papel", "igreja_id", "avatar", "verified", "emailVisibility", "tokenKey",
      ];
      for (const fname of lockedFields) {
        try { e.record.set(fname, stored.get(fname)); } catch (_) {}
      }
    } catch (err) {
      // Re-throw our validation errors; swallow anything else.
      if (err && err.message && (
        err.message.includes("própria igreja") ||
        err.message.includes("próprio vínculo") ||
        err.message.includes("aprovar membros")
      )) {
        throw err;
      }
    }
    e.next();
    return;
  }

  // Regular user editing their own profile — cannot change status, role, or
  // email. The email may only change through the confirmed email-change flow
  // (requestEmailChange + confirmation link), never via a direct update.
  try {
    const stored = $app.findRecordById("users", e.record.id);
    e.record.set("status_cadastro", stored.get("status_cadastro"));
    e.record.set("data_envio", stored.get("data_envio"));
    e.record.set("status_aprovacao", stored.get("status_aprovacao"));
    e.record.set("motivo_recusa", stored.get("motivo_recusa"));
    e.record.set("papel", stored.get("papel"));
    e.record.set("igreja_id", stored.get("igreja_id"));
    e.record.set("email", stored.get("email"));
  } catch (_) {}
  e.next();
}, "users");
