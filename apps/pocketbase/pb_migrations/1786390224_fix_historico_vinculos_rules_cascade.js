/// <reference path="../pb_data/types.d.ts" />

// Corrige permissões e cascade da coleção `historico_vinculos`:
//  - deleteRule: era `null` (apenas superusers), o que causava erro 403 quando
//    administradores tentavam excluir registros de histórico via painel admin.
//    Agora permite que administradores excluam (mantendo usuários comuns bloqueados).
//  - updateRule: permanece `null` (histórico é imutável).
//  - vinculo_id: removido `cascadeDelete` para que o histórico de auditoria
//    sobreviva à exclusão do vínculo (preserva a trilha de "remoção").
migrate(
  (app) => {
    const historico = app.findCollectionByNameOrId("historico_vinculos");

    // Permite que admins excluam registros de histórico (limpeza / gestão).
    historico.deleteRule = "@request.auth.collectionName = 'admins'";

    // Remove o cascade delete do campo vinculo_id para preservar a auditoria
    // mesmo após a exclusão do vínculo correspondente.
    const vinculoField = historico.fields.getByName("vinculo_id");
    if (vinculoField) {
      vinculoField.cascadeDelete = false;
    }

    app.save(historico);
  },
  (app) => {
    try {
      const historico = app.findCollectionByNameOrId("historico_vinculos");
      historico.deleteRule = null;
      const vinculoField = historico.fields.getByName("vinculo_id");
      if (vinculoField) {
        vinculoField.cascadeDelete = true;
      }
      app.save(historico);
    } catch (e) {
      if (!e.message.includes("no rows in result set")) throw e;
    }
  },
);
