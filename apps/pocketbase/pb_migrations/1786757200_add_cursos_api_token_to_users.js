/// <reference path="../pb_data/types.d.ts" />

// Adiciona campos para armazenar o JWT da API de cursos (SSO via bridge-login)
// no registro do usuário: cursos_api_token (text) e cursos_api_token_expires (date).
// Esses campos são preenchidos pelo hook de pós-login e pela rota Express de bridge-login.

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("users");

    // cursos_api_token — JWT retornado pela API de cursos (bridge-login)
    if (!collection.fields.getByName("cursos_api_token")) {
      collection.fields.add(
        new TextField({
          name: "cursos_api_token",
          max: 2000,
        }),
      );
    }

    // cursos_api_token_expires — data de expiração do token
    if (!collection.fields.getByName("cursos_api_token_expires")) {
      collection.fields.add(
        new DateField({
          name: "cursos_api_token_expires",
        }),
      );
    }

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("users");
    try { collection.fields.removeByName("cursos_api_token"); } catch (_) {}
    try { collection.fields.removeByName("cursos_api_token_expires"); } catch (_) {}
    app.save(collection);
  },
);
