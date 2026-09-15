
function firstId(raw) {
  return Array.isArray(raw) ? raw[0] || "" : raw || "";
}

function isAuthAdmin(auth) {
  if (!auth) return false;
  try { if (auth.collection().name === "admins") return true; } catch (_) {}
  try { if (auth.collectionName === "admins") return true; } catch (_) {}
  return false;
}

function repPodeAprovar(app, authId, igrejaId) {
  if (!authId || !igrejaId) return false;
  try {
    const vinculos = app.findRecordsByFilter(
      "vinculos_usuario_igreja",
      "usuario_id = '" + authId + "' && igreja_id = '" + igrejaId + "'",
      "created",
      10,
    );
    return vinculos.some(function (v) {
      return v.get("status") === "ativo" &&
        v.get("pode_aprovar_membros") === true &&
        (v.get("papel") === "pastor" || v.get("papel") === "secretario");
    });
  } catch (_) {
    return false;
  }
}

function registrarHistorico(app, vinculoId, usuarioId, igrejaId, tipo, anterior, novo, motivo, responsavelNome) {
  try {
    const historico = app.findCollectionByNameOrId("historico_vinculos");
    const h = new Record(historico);
    h.set("vinculo_id", vinculoId);
    h.set("usuario_id", usuarioId);
    h.set("igreja_id", igrejaId);
    h.set("responsavel_nome", responsavelNome || "");
    h.set("tipo_acao", tipo);
    h.set("papel_anterior", (anterior && anterior.papel) || "");
    h.set("papel_novo", (novo && novo.papel) || "");
    h.set("status_anterior", (anterior && anterior.status) || "");
    h.set("status_novo", (novo && novo.status) || "");
    h.set("pode_aprovar_anterior", !!(anterior && anterior.pode_aprovar_membros));
    h.set("pode_aprovar_novo", !!(novo && novo.pode_aprovar_membros));
    h.set("motivo", motivo || "");
    h.set("data_acao", new Date().toISOString().split("T")[0]);
    app.save(h);
  } catch (err) {
    app.logger().error("registrarHistorico failed", "err", String(err));
  }
}

// Zera as referências `vinculo_id` em `historico_vinculos` antes de excluir
// um vínculo. Preserva a trilha de auditoria (usuario_id, igreja_id, tipo_acao,
// papel/status anteriores e novos, motivo, responsável, data) — apenas o link
// direto para o vínculo removido é apagado, evitando o erro de "required
// reference" na exclusão.
//
// A anulação de TODOS os registros ocorre em uma ÚNICA transação
// (app.runInTransaction): ou todos os vinculo_id são zerados, ou nenhum —
// evita estado inconsistente (parte do histórico linkado, parte não) se uma
// gravação falhar no meio do loop. A deleção do vínculo em si prossegue via
// e.next() no hook onRecordDeleteRequest; é segura porque vinculo_id é
// opcional (nullable) e não há cascades apontando para vinculos_usuario_igreja.
function desvincularHistorico(app, vinculoId) {
  if (!vinculoId) return;
  try {
    app.runInTransaction((txApp) => {
      const registros = txApp.findRecordsByFilter(
        "historico_vinculos",
        "vinculo_id = '" + vinculoId + "'",
        "created",
        1000,
      );
      for (var i = 0; i < registros.length; i++) {
        registros[i].set("vinculo_id", "");
        txApp.save(registros[i]);
      }
    });
  } catch (err) {
    app.logger().error("desvincularHistorico failed", "vinculoId", vinculoId, "err", String(err));
  }
}

// =====================================================================
// P1.1 — Auditoria de TODOS os pontos de escrita das coleções users e
// vinculos_usuario_igreja. Nenhum caminho de escrita pode ficar sem
// validação (validarAcaoAdmin).
//
// users:
//   W1. REST onRecordUpdateRequest          → admin_validacoes.pb.js   (validado)
//   W2. Programático sincronizarUsuario()   → vinculos_utils.js        (validado)
//   W3. Cadastro público (auto-vínculo)     → não altera papel/status de aprovação
//
// vinculos_usuario_igreja:
//   W4. REST onRecordCreateRequest          → vinculos_flow.pb.js §2   (força membro/pendente)
//   W5. REST onRecordUpdateRequest          → admin_validacoes.pb.js + vinculos_flow.pb.js §4 (validado)
//   W6. Programático auto-vínculo (create)  → vinculos_flow.pb.js §1   (cria pendente/membro)
//   W7. Programático onRecordAfterCreateSuccess §3b → apenas histórico
// =====================================================================

// Validação reutilizável para ações administrativas sobre users e
// vinculos_usuario_igreja. Deve ser chamada em TODOS os caminhos de escrita
// (W1, W2, W4, W5) — tanto REST (onRecordUpdateRequest) quanto saves
// programáticos (app.save) — para evitar bypass das regras de
// auto-aprovação / auto-promoção / auto-rebaixamento.
//
// opts:
//   authId            — id do autor da ação (vazio em saves programáticos sem auth)
//   recordId          — id do registro alvo
//   field             — nome do campo validado (p/ mensagem)
//   oldValue          — valor anterior
//   newValue          — valor novo
//   allowedValues     — lista de valores permitidos para o novo estado
//   requireFromStatus — valor obrigatório do estado anterior (ex.: "pendente")
//   selfActionMsg     — mensagem de erro para auto-ação
function validarAcaoAdmin(opts) {
  var authId = (opts && opts.authId) || "";
  var recordId = (opts && opts.recordId) || "";
  var field = (opts && opts.field) || "";
  var oldValue = (opts && opts.oldValue) || "";
  var newValue = (opts && opts.newValue) || "";
  var allowedValues = opts && opts.allowedValues;
  var requireFromStatus = (opts && opts.requireFromStatus) || "";
  var selfActionMsg = (opts && opts.selfActionMsg) ||
    "Você não pode realizar esta ação sobre o seu próprio registro.";

  // 1. Auto-ação: o admin não pode agir sobre o próprio registro
  //    (apenas quando há authId — saves programáticos sem auth pulam).
  if (authId && recordId && authId === recordId) {
    throw new BadRequestError(selfActionMsg);
  }
  // 2. Valor permitido para o novo estado.
  if (allowedValues && allowedValues.indexOf(newValue) === -1) {
    throw new BadRequestError(
      "Valor inválido para " + field + ". Permitidos: " + allowedValues.join(", ") + ".",
    );
  }
  // 3. Transição de status: só pode mudar do estado exigido (ex.: "pendente").
  if (requireFromStatus && oldValue !== requireFromStatus) {
    throw new BadRequestError(
      "Apenas registros com status '" + requireFromStatus +
      "' podem ser alterados neste campo.",
    );
  }
}

// Sincroniza o usuário vinculado para refletir o status do vínculo.
// Usado tanto na criação quanto na atualização do vínculo.
function sincronizarUsuario(app, vinculo) {
  const status = vinculo.get("status");
  const usuarioId = firstId(vinculo.get("usuario_id"));
  const igrejaId = firstId(vinculo.get("igreja_id"));
  if (!usuarioId) return;
  try {
    const user = app.findRecordById("users", usuarioId);
    if (status === "ativo") {
      // W2: validação antes do save programático (P1.1) — garante que o
      // papel atribuído pela sincronização está entre os valores permitidos
      // e nunca é "admin" (promoção a admin só via painel administrativo).
      var novoPapel = vinculo.get("papel") || "membro";
      validarAcaoAdmin({
        collection: "users",
        field: "papel",
        newValue: novoPapel,
        allowedValues: ["pastor", "secretario", "presidente", "membro"],
      });
      user.set("status_aprovacao", "aprovado");
      user.set("status_cadastro", "aprovado");
      user.set("motivo_recusa", "");
      user.set("igreja_id", igrejaId);
      user.set("papel", novoPapel);
      app.save(user);
    } else if (status === "recusado") {
      user.set("status_aprovacao", "recusado");
      user.set("status_cadastro", "reprovado");
      user.set("motivo_recusa", vinculo.get("motivo_recusa") || "");
      app.save(user);
    } else if (status === "suspenso" || status === "encerrado") {
      user.set("status_aprovacao", "recusado");
      user.set("status_cadastro", "reprovado");
      app.save(user);
    }
  } catch (err) {
    app.logger().error("sincronizarUsuario failed", "err", String(err));
  }
}


module.exports = { firstId, isAuthAdmin, repPodeAprovar, registrarHistorico, sincronizarUsuario, desvincularHistorico, validarAcaoAdmin };
