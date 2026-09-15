/// <reference path="../pb_data/types.d.ts" />

// Coleção `acoes_servicos_profissionais`: registra todas as ações
// administrativas (aprovar, não aprovar, suspender) sobre cadastros de
// serviços profissionais. Acesso restrito a administradores autenticados.

migrate(
  (app) => {
    const servicos = app.findCollectionByNameOrId("servicos_profissionais");
    const admins = app.findCollectionByNameOrId("admins");

    let collection;
    try {
      collection = app.findCollectionByNameOrId("acoes_servicos_profissionais");
    } catch (_) {
      collection = new Collection({
        type: "base",
        name: "acoes_servicos_profissionais",
        // Apenas administradores autenticados podem listar/visualizar.
        listRule: "@request.auth.collectionName = 'admins'",
        viewRule: "@request.auth.collectionName = 'admins'",
        // Apenas administradores podem criar registros de ação.
        createRule: "@request.auth.collectionName = 'admins'",
        // Registros de auditoria não podem ser editados/excluídos via API.
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: "servico_id",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: servicos.id,
            cascadeDelete: true,
          },
          {
            name: "usuario_admin_id",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: admins.id,
          },
          { name: "data_acao", type: "date", required: true },
          { name: "status_anterior", type: "text", max: 60 },
          { name: "status_novo", type: "text", required: true, max: 60 },
          { name: "justificativa", type: "text", max: 1000 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX idx_acoes_servicos_servico ON acoes_servicos_profissionais (servico_id)",
          "CREATE INDEX idx_acoes_servicos_admin ON acoes_servicos_profissionais (usuario_admin_id)",
        ],
      });
      app.save(collection);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("acoes_servicos_profissionais");
      app.delete(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) {
        console.log("Collection not found, skipping revert");
        return;
      }
      throw e;
    }
  },
);
