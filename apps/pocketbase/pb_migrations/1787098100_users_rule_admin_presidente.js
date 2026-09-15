/// <reference path="../pb_data/types.d.ts" />

// Complemento da correção 1787098000: a regra de `vinculos_usuario_igreja`
// agora libera o escopo por igreja para pastor/secretario/presidente/admin,
// mas a regra de `users` (usada no expand `usuario_id` da lista de aprovação)
// ainda limitava o escopo por igreja a pastor/secretario. Assim, um
// representante com users.papel='admin' (ex.: promovido a administrador mas
// com vínculo ativo de pastor) conseguia listar os vínculos pendentes dos
// membros da sua igreja, mas o expand do usuário vinha vazio (sem permissão
// de view em `users`) — o membro aparecia na lista, porém com nome/e-mail
// '—'. Esta migração estende o branch por igreja das regras list/view/update
// de `users` para incluir também 'presidente' e 'admin', alinhando com a
// regra de vínculos e com verificarAcessoPainel/repPodeAprovar (que usam o
// vínculo). O escopo continua por igreja (igreja_id = @request.auth.igreja_id):
// um 'admin'/'presidente' só vê usuários da própria igreja.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("users");
    if (!col) {
      app.logger().error(
        "users_rule_admin_presidente: colecao users nao encontrada",
      );
      return;
    }

    const regraIgreja =
      "id = @request.auth.id || @request.auth.collectionName = 'admins' || ((@request.auth.papel = 'pastor' || @request.auth.papel = 'secretario' || @request.auth.papel = 'presidente' || @request.auth.papel = 'admin') && igreja_id = @request.auth.igreja_id)";

    col.listRule = regraIgreja;
    col.viewRule = regraIgreja;
    col.updateRule = regraIgreja;
    app.save(col);

    app.logger().info(
      "users_rule_admin_presidente: regras atualizadas (presidente + admin adicionados ao branch por igreja)",
    );
  },
  (app) => {
    // Down: restaura as regras anteriores (sem presidente/admin).
    const col = app.findCollectionByNameOrId("users");
    if (!col) return;
    const regraIgreja =
      "id = @request.auth.id || @request.auth.collectionName = 'admins' || ((@request.auth.papel = 'pastor' || @request.auth.papel = 'secretario') && igreja_id = @request.auth.igreja_id)";
    col.listRule = regraIgreja;
    col.viewRule = regraIgreja;
    col.updateRule = regraIgreja;
    app.save(col);
  },
);
