/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const igrejas = app.findCollectionByNameOrId("igrejas");

    let collection;
    try {
      collection = app.findCollectionByNameOrId("decisoes_aprovacao_igreja");
    } catch (_) {
      collection = new Collection({
        type: "base",
        name: "decisoes_aprovacao_igreja",
        // The representante who made the decision can see their own log;
        // general admins can see all.
        listRule: "representante_id = @request.auth.id || @request.auth.collectionName = 'admins'",
        viewRule: "representante_id = @request.auth.id || @request.auth.collectionName = 'admins'",
        createRule: "@request.auth.id != '' && @request.auth.id = @request.body.representante_id",
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: "usuario_id",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          {
            name: "igreja_id",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: igrejas.id,
            cascadeDelete: false,
          },
          {
            name: "representante_id",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          { name: "data_acao", type: "date", required: true },
          { name: "hora_acao", type: "text", required: true, max: 10 },
          { name: "status", type: "text", required: true, max: 60 },
          { name: "justificativa", type: "text", max: 1000 },
          { name: "tipo_acao", type: "text", required: true, max: 60 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(collection);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("decisoes_aprovacao_igreja");
      app.delete(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
