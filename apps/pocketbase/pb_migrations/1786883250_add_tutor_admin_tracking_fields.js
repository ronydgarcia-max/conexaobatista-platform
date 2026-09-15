/// <reference path="../pb_data/types.d.ts" />

// Adiciona campos de auditoria para os painéis de aprovação de tutores
// (mentores) e promoção a administrador:
//   - mentor_aprovado_por   : relation → admins (quem decidiu a solicitação)
//   - mentor_data_aprovacao : date (data da decisão)
//   - mentor_motivo_rejeicao: text (motivo da recusa, opcional)
//   - admin_promovido_por   : relation → admins (quem promoveu/removeu)
//   - admin_data_promocao   : date (data da promoção)
//
// Os campos mentor_status / mentor_solicitado / mentor_areas /
// mentor_cursos_publicados / mentor_biografia / mentor_data_solicitacao
// já existem na coleção users (criados em migrações anteriores).

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const admins = app.findCollectionByNameOrId("admins");

    // Evita adicionar duplicatas caso a migração seja re-executada.
    if (!users.fields.getByName("mentor_aprovado_por")) {
      users.fields.add(
        new RelationField({
          name: "mentor_aprovado_por",
          required: false,
          maxSelect: 1,
          minSelect: 0,
          collectionId: admins.id,
          cascadeDelete: false,
        }),
      );
    }
    if (!users.fields.getByName("mentor_data_aprovacao")) {
      users.fields.add(new DateField({ name: "mentor_data_aprovacao" }));
    }
    if (!users.fields.getByName("mentor_motivo_rejeicao")) {
      users.fields.add(
        new TextField({ name: "mentor_motivo_rejeicao", max: 1000 }),
      );
    }
    if (!users.fields.getByName("admin_promovido_por")) {
      users.fields.add(
        new RelationField({
          name: "admin_promovido_por",
          required: false,
          maxSelect: 1,
          minSelect: 0,
          collectionId: admins.id,
          cascadeDelete: false,
        }),
      );
    }
    if (!users.fields.getByName("admin_data_promocao")) {
      users.fields.add(new DateField({ name: "admin_data_promocao" }));
    }

    app.save(users);
  },
  (app) => {
    try {
      const users = app.findCollectionByNameOrId("users");
      ["mentor_aprovado_por", "mentor_data_aprovacao", "mentor_motivo_rejeicao",
        "admin_promovido_por", "admin_data_promocao"].forEach((nome) => {
        try { users.fields.removeByName(nome); } catch (_) {}
      });
      app.save(users);
    } catch (e) {
      if (e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
