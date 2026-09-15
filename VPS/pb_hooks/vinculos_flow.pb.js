/// <reference path="../pb_data/types.d.ts" />

// Fluxo de vínculos usuário↔igreja:
//  1. Ao criar um usuário (cadastro público) com igreja_id, cria automaticamente
//     um vínculo pendente (papel=membro, pode_aprovar=false) + histórico.
//  2. Ao criar um vínculo por usuário comum (retry), força pendente/membro/false.
//  3. Ao excluir um vínculo por usuário comum, permite apenas recusado/suspenso/encerrado.
//  4. Ao atualizar um vínculo por representante, valida permissão e auto-aprovação,
//     sincroniza o status do usuário (status_aprovacao/status_cadastro) e registra
//     histórico da decisão.

// ---------- 1. Auto-vínculo no cadastro de usuário ----------
onRecordAfterCreateSuccess((e) => {
  const { firstId, isAuthAdmin, repPodeAprovar, registrarHistorico, sincronizarUsuario } = require(`${__hooks}/vinculos_utils.js`);
  const igrejaId = firstId(e.record.get("igreja_id"));
  if (!igrejaId) {
    e.next();
    return;
  }

  // Evita duplicar se já existe vínculo (ex.: admin criou manualmente).
  try {
    const existentes = $app.findRecordsByFilter(
      "vinculos_usuario_igreja",
      "usuario_id = '" + e.record.id + "' && igreja_id = '" + igrejaId + "'",
      "created",
      1,
    );
    if (existentes.length > 0) {
      e.next();
      return;
    }
  } catch (_) {}

  try {
    const vinculos = $app.findCollectionByNameOrId("vinculos_usuario_igreja");
    const rec = new Record(vinculos);
    rec.set("usuario_id", e.record.id);
    rec.set("igreja_id", igrejaId);
    rec.set("papel", "membro");
    rec.set("status", "pendente");
    rec.set("pode_aprovar_membros", false);
    rec.set("responsavel_nome", e.record.get("name") || "Cadastro");
    rec.set("motivo_alteracao", "Solicitação criada no cadastro");
    $app.save(rec);

    registrarHistorico(
      $app,
      rec.id,
      e.record.id,
      igrejaId,
      "criacao",
      null,
      { papel: "membro", status: "pendente", pode_aprovar_membros: false },
      "Solicitação criada no cadastro",
      e.record.get("name") || "Cadastro",
    );
  } catch (err) {
    $app.logger().error("auto-vinculo create failed", "err", String(err));
  }

  e.next();
}, "users");

// ---------- 2. Criar vínculo por usuário comum: força pendente/membro/false ----------
onRecordCreateRequest((e) => {
  const { firstId, isAuthAdmin, repPodeAprovar, registrarHistorico, sincronizarUsuario } = require(`${__hooks}/vinculos_utils.js`);
  if (e.hasSuperuserAuth() || isAuthAdmin(e.requestInfo().auth)) {
    e.next();
    return;
  }
  // Usuário comum só pode criar vínculo para si mesmo (a regra já garante),
  // e sempre como membro pendente sem permissão de aprovação.
  e.record.set("papel", "membro");
  e.record.set("status", "pendente");
  e.record.set("pode_aprovar_membros", false);
  e.record.set("motivo_recusa", "");
  e.next();
}, "vinculos_usuario_igreja");

// ---------- 3. Excluir vínculo: zera histórico, valida status ----------
onRecordDeleteRequest((e) => {
  const { firstId, isAuthAdmin, repPodeAprovar, registrarHistorico, sincronizarUsuario, desvincularHistorico } = require(`${__hooks}/vinculos_utils.js`);
  if (e.hasSuperuserAuth() || isAuthAdmin(e.requestInfo().auth)) {
    // Admin/superuser: apenas zera as referências de histórico antes de excluir.
    desvincularHistorico($app, e.record.id);
    e.next();
    return;
  }
  const stored = $app.findRecordById("vinculos_usuario_igreja", e.record.id);
  const status = stored.get("status") || "";
  if (status !== "recusado" && status !== "suspenso" && status !== "encerrado") {
    throw new BadRequestError(
      "Você só pode remover vínculos recusados, suspensos ou encerrados.",
    );
  }
  desvincularHistorico($app, e.record.id);
  e.next();
}, "vinculos_usuario_igreja");

// ---------- 3b. Criar vínculo (retry/usuário/admin): sincroniza + histórico ----------
// RecordEvent (onRecordAfterCreateSuccess) não carrega requestInfo nem
// hasSuperuserAuth — esses só existem em RecordRequestEvent. Por isso a
// sincronização e o histórico são feitos aqui com base apenas no registro
// salvo, sem depender do contexto da requisição.
onRecordAfterCreateSuccess((e) => {
  const { firstId, isAuthAdmin, repPodeAprovar, registrarHistorico, sincronizarUsuario } = require(`${__hooks}/vinculos_utils.js`);
  // Sincroniza o usuário quando o vínculo é criado já ativo (ex.: admin
  // promove direto a pastor/secretário). Para status pendente, nada a fazer.
  sincronizarUsuario($app, e.record);

  registrarHistorico(
    $app,
    e.record.id,
    firstId(e.record.get("usuario_id")),
    firstId(e.record.get("igreja_id")),
    "criacao",
    null,
    {
      papel: e.record.get("papel"),
      status: e.record.get("status"),
      pode_aprovar_membros: e.record.get("pode_aprovar_membros"),
    },
    e.record.get("motivo_alteracao") || "Nova solicitação de vínculo",
    e.record.get("responsavel_nome") || "Criação de vínculo",
  );
  e.next();
}, "vinculos_usuario_igreja");

// ---------- 4. Atualizar vínculo por representante: valida, sincroniza usuário, histórica ----------
onRecordUpdateRequest((e) => {
  const { firstId, isAuthAdmin, repPodeAprovar, registrarHistorico, sincronizarUsuario, validarAcaoAdmin } = require(`${__hooks}/vinculos_utils.js`);
  if (e.hasSuperuserAuth() || isAuthAdmin(e.requestInfo().auth)) {
    // Admin: registra histórico quando papel/status/permissão mudam.
    try {
      const stored = $app.findRecordById("vinculos_usuario_igreja", e.record.id);
      const oldStatus = stored.get("status") || "";
      const newStatus = e.record.get("status") || "";
      const mudou =
        stored.get("papel") !== e.record.get("papel") ||
        oldStatus !== newStatus ||
        stored.get("pode_aprovar_membros") !== e.record.get("pode_aprovar_membros");
      if (mudou) {
        const auth = e.requestInfo().auth;
        // W5 (caminho admin): validação reutilizável antes de prosseguir —
        // auto-aprovação, transição de status e valor permitido (P1.1).
        // Reforça a validação já feita em admin_validacoes.pb.js.
        if (oldStatus !== newStatus) {
          validarAcaoAdmin({
            authId: auth.id,
            recordId: firstId(stored.get("usuario_id")),
            field: "status",
            oldValue: oldStatus,
            newValue: newStatus,
            allowedValues: ["ativo", "recusado"],
            requireFromStatus: "pendente",
            selfActionMsg: "Você não pode aprovar o seu próprio vínculo de representante.",
          });
        }
        const respNome = (auth && (auth.get("name") || auth.get("username"))) || "Administrador";
        registrarHistorico(
          $app,
          e.record.id,
          firstId(stored.get("usuario_id")),
          firstId(stored.get("igreja_id")),
          "edicao",
          { papel: stored.get("papel"), status: stored.get("status"), pode_aprovar_membros: stored.get("pode_aprovar_membros") },
          { papel: e.record.get("papel"), status: e.record.get("status"), pode_aprovar_membros: e.record.get("pode_aprovar_membros") },
          e.record.get("motivo_alteracao") || e.record.get("motivo_recusa") || "",
          respNome,
        );
      }
    } catch (_) {}
    e.next();
    return;
  }

  const auth = e.requestInfo().auth;
  const stored = $app.findRecordById("vinculos_usuario_igreja", e.record.id);
  const igrejaId = firstId(stored.get("igreja_id"));
  const usuarioId = firstId(stored.get("usuario_id"));
  const oldStatus = stored.get("status");
  const newStatus = e.record.get("status");
  const changingStatus = oldStatus !== newStatus;

  // Auto-aprovação
  if (changingStatus && auth.id === usuarioId) {
    throw new BadRequestError("Você não pode aprovar o seu próprio vínculo.");
  }

  // Permissão do representante
  if (!repPodeAprovar($app, auth.id, igrejaId)) {
    throw new BadRequestError(
      "Seu vínculo com esta igreja não permite aprovar membros.",
    );
  }

  // Representante só pode alterar status e motivo_recusa; trava os demais campos.
  e.record.set("papel", stored.get("papel"));
  e.record.set("pode_aprovar_membros", stored.get("pode_aprovar_membros"));
  e.record.set("responsavel_nome", stored.get("responsavel_nome"));
  e.record.set("motivo_alteracao", stored.get("motivo_alteracao"));
  e.record.set("usuario_id", stored.get("usuario_id"));
  e.record.set("igreja_id", stored.get("igreja_id"));

  // Recusa exige motivo
  if (newStatus === "recusado" && !e.record.get("motivo_recusa")) {
    throw new BadRequestError("Informe o motivo da recusa.");
  }

  e.next();

  // --- histórico da decisão (sincronização do usuário é feita no
  //     onRecordAfterUpdateSuccess, que cobre admin e representante) ---
  if (!changingStatus) return;

  const respNome = (auth && (auth.get("name") || auth.get("username"))) || "Representante";
  registrarHistorico(
    $app,
    e.record.id,
    usuarioId,
    igrejaId,
    "edicao",
    { papel: stored.get("papel"), status: oldStatus, pode_aprovar_membros: stored.get("pode_aprovar_membros") },
    { papel: e.record.get("papel"), status: newStatus, pode_aprovar_membros: e.record.get("pode_aprovar_membros") },
    e.record.get("motivo_recusa") || e.record.get("motivo_alteracao") || "",
    respNome,
  );
}, "vinculos_usuario_igreja");

// ---------- 5. Sincroniza o usuário quando o status do vínculo muda ----------
// Fires após qualquer atualização bem-sucedida do vínculo (admin ou representante).
// Mantém users.status_aprovacao / status_cadastro / motivo_recusa / igreja_id
// alinhados ao vínculo, para que o acesso ao portal reflita o vínculo ativo.
onRecordAfterUpdateSuccess((e) => {
  const { firstId, isAuthAdmin, repPodeAprovar, registrarHistorico, sincronizarUsuario } = require(`${__hooks}/vinculos_utils.js`);
  sincronizarUsuario($app, e.record);
  e.next();
}, "vinculos_usuario_igreja");
