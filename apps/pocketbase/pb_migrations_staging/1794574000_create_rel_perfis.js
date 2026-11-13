/// <reference path="../pb_data/types.d.ts" />

migrate((db) => {
  const dao = new Dao(db);
  let relPerfis;

  try {
    relPerfis = dao.findCollectionByNameOrId("rel_perfis");
  } catch (_) {
    relPerfis = null;
  }

  if (relPerfis) {
    return;
  }

  const users = dao.findCollectionByNameOrId("users");

  relPerfis = new Collection({
    type: "base",
    name: "rel_perfis",
    listRule: "@request.auth.id != '' && (visibilidade != 'privado' || owner = @request.auth.id)",
    viewRule: "@request.auth.id != '' && (visibilidade != 'privado' || owner = @request.auth.id)",
    createRule: "@request.auth.id != '' && owner = @request.auth.id",
    updateRule: "@request.auth.id != '' && owner = @request.auth.id",
    deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
    fields: [
      {
        name: "owner",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: users.id,
        cascadeDelete: true,
      },
      {
        name: "preferencias",
        type: "select",
        maxSelect: 5,
        values: ["amizade", "namoro", "casamento", "networking", "estudo"],
      },
      {
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false,
      },
      {
        name: "updated",
        type: "autodate",
        onCreate: true,
        onUpdate: true,
      },
    ],
  });

  return dao.saveCollection(relPerfis);
}, (db) => {
  const dao = new Dao(db);

  try {
    const relPerfis = dao.findCollectionByNameOrId("rel_perfis");
    return dao.deleteCollection(relPerfis);
  } catch (_) {
    // A coleção pode não existir se a migração não tiver sido aplicada.
  }
});
