/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const igrejas = app.findCollectionByNameOrId("igrejas");

    // papel — user role within the church system
    if (!users.fields.getByName("papel")) {
      users.fields.add(
        new SelectField({
          name: "papel",
          maxSelect: 1,
          values: ["pastor", "secretario", "membro", "admin"],
        }),
      );
    }

    // igreja_id — link to the user's church
    if (!users.fields.getByName("igreja_id")) {
      users.fields.add(
        new RelationField({
          name: "igreja_id",
          maxSelect: 1,
          collectionId: igrejas.id,
          cascadeDelete: false,
        }),
      );
    }

    // status_aprovacao — church-level approval status
    if (!users.fields.getByName("status_aprovacao")) {
      users.fields.add(
        new SelectField({
          name: "status_aprovacao",
          maxSelect: 1,
          values: ["pendente", "aprovado", "recusado", "solicitar_informacoes"],
        }),
      );
    }

    // motivo_recusa — rejection / info-request reason visible to the user
    if (!users.fields.getByName("motivo_recusa")) {
      users.fields.add(
        new TextField({
          name: "motivo_recusa",
          max: 1000,
        }),
      );
    }

    // Extend access rules: pastor/secretario can list/view/update users in
    // their own church (in addition to self and general admins).
    const churchRepRule =
      "id = @request.auth.id || @request.auth.collectionName = 'admins' || ((@request.auth.papel = 'pastor' || @request.auth.papel = 'secretario') && igreja_id = @request.auth.igreja_id)";
    users.listRule = churchRepRule;
    users.viewRule = churchRepRule;
    users.updateRule = churchRepRule;

    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    try { users.fields.removeByName("papel"); } catch (_) {}
    try { users.fields.removeByName("igreja_id"); } catch (_) {}
    try { users.fields.removeByName("status_aprovacao"); } catch (_) {}
    try { users.fields.removeByName("motivo_recusa"); } catch (_) {}
    const original = "id = @request.auth.id || @request.auth.collectionName = 'admins'";
    users.listRule = original;
    users.viewRule = original;
    users.updateRule = original;
    app.save(users);
  },
);
