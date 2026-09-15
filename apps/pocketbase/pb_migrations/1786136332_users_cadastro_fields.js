/// <reference path="../pb_data/types.d.ts" />

// Adds the cadastro (registration) fields to the existing `users` auth
// collection: whatsapp, sexo, cidade, status_cadastro, data_envio and the
// two document-acceptance audit flags (aceitou_consentimento, aceitou_termos).
// status_cadastro is enforced to "aguardando_aprovacao" on create by the
// users_cadastro.pb.js hook, so it is intentionally NOT required here.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    if (!users.fields.getByName("whatsapp")) {
      users.fields.add(new TextField({ name: "whatsapp", max: 20 }));
    }

    if (!users.fields.getByName("sexo")) {
      users.fields.add(
        new SelectField({
          name: "sexo",
          maxSelect: 1,
          values: ["masculino", "feminino", "outro"],
        }),
      );
    }

    if (!users.fields.getByName("cidade")) {
      users.fields.add(new TextField({ name: "cidade", max: 80 }));
    }

    if (!users.fields.getByName("status_cadastro")) {
      users.fields.add(
        new SelectField({
          name: "status_cadastro",
          maxSelect: 1,
          values: ["aguardando_aprovacao", "aprovado", "reprovado"],
        }),
      );
    }

    if (!users.fields.getByName("data_envio")) {
      users.fields.add(new DateField({ name: "data_envio" }));
    }

    if (!users.fields.getByName("aceitou_consentimento")) {
      users.fields.add(new BoolField({ name: "aceitou_consentimento" }));
    }

    if (!users.fields.getByName("aceitou_termos")) {
      users.fields.add(new BoolField({ name: "aceitou_termos" }));
    }

    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    for (const name of [
      "whatsapp",
      "sexo",
      "cidade",
      "status_cadastro",
      "data_envio",
      "aceitou_consentimento",
      "aceitou_termos",
    ]) {
      try {
        users.fields.removeByName(name);
      } catch (_) {}
    }
    app.save(users);
  },
);
