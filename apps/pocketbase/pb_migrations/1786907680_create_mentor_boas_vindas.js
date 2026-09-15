// apps/pocketbase/pb_migrations/1786907680_create_mentor_boas_vindas.js
/// <reference path="../pb_data/types.d.ts" />

// Coleção para armazenar a imagem de boas-vindas da área do mentor.
// A página pública (/curso/boas-vindas) lê o registro mais recente; apenas
// administradores podem criar/atualizar/deletar. A leitura é pública ("")
// para que a URL do arquivo funcione em tags <img> (o PocketBase aplica a
// viewRule também no acesso direto a /api/files/...).
migrate(
  (app) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId("mentor_boas_vindas");
    } catch (_) {
      const admins = app.findCollectionByNameOrId("admins");
      collection = new Collection({
        type: "base",
        name: "mentor_boas_vindas",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.collectionName = 'admins'",
        updateRule: "@request.auth.collectionName = 'admins'",
        deleteRule: "@request.auth.collectionName = 'admins'",
        fields: [
          {
            name: "imagem",
            type: "file",
            required: true,
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ["image/jpeg", "image/png", "image/webp"],
            thumbs: ["400x300", "800x600", "1200x900"],
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
      const collection = app.findCollectionByNameOrId("mentor_boas_vindas");
      app.delete(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) {
        console.log("Collection mentor_boas_vindas não encontrada, pulando revert");
        return;
      }
      throw e;
    }
  },
);
