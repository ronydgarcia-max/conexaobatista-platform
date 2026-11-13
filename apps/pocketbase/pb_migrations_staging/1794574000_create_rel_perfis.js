/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  let relPerfis;

  try {
    relPerfis = app.findCollectionByNameOrId("rel_perfis");
  } catch (_) {
    relPerfis = null;
  }

  if (relPerfis) {
    return;
  }

  const users = app.findCollectionByNameOrId("users");

  relPerfis = new Collection({
    type: "base",
    name: "rel_perfis",
    listRule: "@request.auth.id != '' && (visibilidade != 'privado' || owner = @request.auth.id)",
    viewRule: "@request.auth.id != '' && (visibilidade != 'privado' || owner = @request.auth.id)",
    createRule: "@request.auth.id != '' && owner = @request.auth.id",
    updateRule: "@request.auth.id != '' && owner = @request.auth.id",
    deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
    schema: [
      {
        name: "owner",
        type: "relation",
        required: true,
        options: {
          collectionId: users.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
      },
      {
        name: "preferencias",
        type: "select",
        options: {
          maxSelect: 5,
          values: ["amizade", "namoro", "casamento", "networking", "estudo"],
        },
      },
      {
        name: "visibilidade",
        type: "select",
        options: {
          maxSelect: 1,
          values: ["publico", "privado"],
        },
      },
    ],
  });

  return app.save(relPerfis);
}, (app) => {
  try {
    const relPerfis = app.findCollectionByNameOrId("rel_perfis");
    return app.delete(relPerfis);
  } catch (_) {
    // A coleção pode não existir se a migração não tiver sido aplicada.
  }
});
