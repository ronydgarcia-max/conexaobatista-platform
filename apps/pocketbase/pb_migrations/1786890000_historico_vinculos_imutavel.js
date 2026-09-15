/// <reference path="../pb_data/types.d.ts" />

// Torna o log de auditoria `historico_vinculos` imutável via REST: ninguém
// (nem admins) pode excluir registros de auditoria. updateRule já é null.
// deleteRule passa de "@request.auth.collectionName = 'admins'" para null.
//
// Complementa o Bloco 2.2 (registros de auditoria imutáveis).

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("historico_vinculos");
    col.deleteRule = null; // imutável: ninguém pode excluir via REST
    app.save(col);
  },
  (app) => {
    const col = app.findCollectionByNameOrId("historico_vinculos");
    col.deleteRule = "@request.auth.collectionName = 'admins'";
    app.save(col);
  },
);
