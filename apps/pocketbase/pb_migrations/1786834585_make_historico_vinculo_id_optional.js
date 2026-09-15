/// <reference path="../pb_data/types.d.ts" />

// Permite excluir vínculos que já possuem histórico de auditoria.
// Antes: `historico_vinculos.vinculo_id` era `required: true` com
// `cascadeDelete: false`, o que bloqueava a exclusão de qualquer vínculo
// referenciado por um registro de histórico (erro 400 "required reference").
// Agora: o campo continua sem cascadeDelete (auditoria preservada), mas é
// opcional. O hook de exclusão em `vinculos_flow.pb.js` zera as referências
// antes de remover o vínculo, mantendo usuario_id/igreja_id/tipo_acao/etc.
migrate(
  (app) => {
    const historico = app.findCollectionByNameOrId("historico_vinculos");
    const vinculoField = historico.fields.getByName("vinculo_id");
    if (vinculoField) {
      vinculoField.required = false;
    }
    app.save(historico);
  },
  (app) => {
    try {
      const historico = app.findCollectionByNameOrId("historico_vinculos");
      const vinculoField = historico.fields.getByName("vinculo_id");
      if (vinculoField) {
        vinculoField.required = true;
      }
      app.save(historico);
    } catch (e) {
      if (!e.message.includes("no rows in result set")) throw e;
    }
  },
);
