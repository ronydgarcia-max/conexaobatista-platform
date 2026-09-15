/// <reference path="../pb_data/types.d.ts" />

// Coleção `cursos` — superfície de autoria administrativa de cursos no PocketBase.
// Os registros criados/atualizados/excluídos aqui são sincronizados (best-effort)
// com a API de cursos externa via hook `cursos_sso.pb.js` (POST/PUT/DELETE /cursos
// com o header x-bridge-secret). O campo `curso_api_id` guarda o id retornado pela
// API externa após a sincronização.
//
// Regras: acesso exclusivo de administradores (admins).

migrate(
  (app) => {
    const admins = app.findCollectionByNameOrId("admins");

    const collection = new Collection({
      type: "base",
      name: "cursos",
      listRule: "@request.auth.collectionName = 'admins'",
      viewRule: "@request.auth.collectionName = 'admins'",
      createRule: "@request.auth.collectionName = 'admins'",
      updateRule: "@request.auth.collectionName = 'admins'",
      deleteRule: "@request.auth.collectionName = 'admins'",
      fields: [
        { name: "titulo", type: "text", required: true, max: 200 },
        { name: "descricao", type: "text", max: 2000 },
        { name: "instrutor", type: "text", max: 120 },
        { name: "preco", type: "number", min: 0 },
        { name: "carga_horaria", type: "text", max: 60 },
        { name: "categoria", type: "text", max: 80 },
        {
          name: "nivel",
          type: "select",
          maxSelect: 1,
          values: ["Iniciante", "Intermediário", "Avançado"],
        },
        { name: "imagem_url", type: "text", max: 500 },
        {
          name: "status",
          type: "select",
          maxSelect: 1,
          values: ["rascunho", "publicado", "arquivado"],
        },
        { name: "curso_api_id", type: "text", max: 100 },
        {
          name: "criado_por",
          type: "relation",
          maxSelect: 1,
          collectionId: admins.id,
          cascadeDelete: false,
        },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });

    app.save(collection);
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("cursos");
      app.delete(collection);
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
