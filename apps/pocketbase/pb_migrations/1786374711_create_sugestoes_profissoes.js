/// <reference path="../pb_data/types.d.ts" />

// Coleção de sugestões de novas categorias/profissões enviadas pelos usuários
// para análise administrativa. Inclui rastreamento de envio de e-mail
// (data + status) estruturado para a configuração de envio de e-mails do site.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const categorias = app.findCollectionByNameOrId("categorias_profissionais");

    let collection;
    try {
      collection = app.findCollectionByNameOrId("sugestoes_profissoes");
    } catch (_) {
      collection = new Collection({
        type: "base",
        name: "sugestoes_profissoes",
        // O usuário vê apenas as suas; administradores veem todas.
        listRule:
          "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
        viewRule:
          "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
        // Usuário cria apenas sugestões vinculadas a si mesmo.
        createRule:
          "@request.auth.id != '' && @request.auth.id = @request.body.usuario_id",
        // Apenas administradores alteram o status da sugestão.
        updateRule: "@request.auth.collectionName = 'admins'",
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
            name: "tipo",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["categoria", "profissao"],
          },
          { name: "nome", type: "text", required: true, max: 120 },
          { name: "descricao", type: "text", max: 1000 },
          {
            name: "categoria_relacionada",
            type: "relation",
            maxSelect: 1,
            collectionId: categorias.id,
          },
          { name: "data_sugestao", type: "date" },
          {
            name: "status",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["pendente", "aceita", "recusada"],
          },
          { name: "motivo_recusa", type: "text", max: 1000 },
          { name: "email_enviado", type: "bool" },
          { name: "data_email_enviado", type: "date" },
          {
            name: "status_email",
            type: "select",
            maxSelect: 1,
            values: ["nao_enviado", "enviado", "erro"],
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX idx_sugestoes_profissoes_status ON sugestoes_profissoes (status)",
          "CREATE INDEX idx_sugestoes_profissoes_usuario ON sugestoes_profissoes (usuario_id)",
        ],
      });
      app.save(collection);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("sugestoes_profissoes");
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
