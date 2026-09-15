/// <reference path="../pb_data/types.d.ts" />

// Adiciona o papel "presidente" às opções do campo `papel` (select) nas
// coleções `vinculos_usuario_igreja` e `users`, para suportar a aprovação de
// representantes (Pastor, Secretário, Presidente) no painel administrativo.

migrate(
  (app) => {
    // --- vinculos_usuario_igreja ---
    const vinculos = app.findCollectionByNameOrId("vinculos_usuario_igreja");
    const vField = vinculos.fields.getByName("papel");
    vField.values = ["pastor", "secretario", "presidente", "membro"];
    app.save(vinculos);

    // --- users ---
    const users = app.findCollectionByNameOrId("users");
    const uField = users.fields.getByName("papel");
    uField.values = ["pastor", "secretario", "presidente", "membro", "admin"];
    app.save(users);
  },
  (app) => {
    const vinculos = app.findCollectionByNameOrId("vinculos_usuario_igreja");
    const vField = vinculos.fields.getByName("papel");
    vField.values = ["pastor", "secretario", "membro"];
    app.save(vinculos);

    const users = app.findCollectionByNameOrId("users");
    const uField = users.fields.getByName("papel");
    uField.values = ["pastor", "secretario", "membro", "admin"];
    app.save(users);
  },
);
