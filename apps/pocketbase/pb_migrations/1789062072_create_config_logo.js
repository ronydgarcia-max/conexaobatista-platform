// apps/pocketbase/pb_migrations/1789062072_create_config_logo.js
/// <reference path="../pb_data/types.d.ts" />

// Coleção para armazenar o logo institucional personalizado do site.
// O cabeçalho público (SiteLayout) lê o registro mais recente; apenas
// administradores podem criar/atualizar/deletar. A leitura é pública ("")
// para que a URL do arquivo funcione em tags <img> (o PocketBase aplica a
// viewRule também no acesso direto a /api/files/...). Quando não há
// registro, o cabeçalho exibe o logo padrão (emblema SVG embutido).
migrate(
  (app) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId("config_logo");
    } catch (_) {
      const admins = app.findCollectionByNameOrId("admins");
      collection = new Collection({
        type: "base",
        name: "config_logo",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.collectionName = 'admins'",
        updateRule: "@request.auth.collectionName = 'admins'",
        deleteRule: "@request.auth.collectionName = 'admins'",
        fields: [
          {
            name: "logo",
            type: "file",
            required: true,
            maxSelect: 1,
            maxSize: 2097152,
            mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
            thumbs: ["200x80", "400x160"],
          },
          {
            name: "atualizado_por",
            type: "relation",
            maxSelect: 1,
            collectionId: admins.id,
            cascadeDelete: false,
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [],
      });
      app.save(collection);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("config_logo");
      app.delete(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) {
        console.log("Collection config_logo não encontrada, pulando revert");
        return;
      }
      throw e;
    }
  },
);
