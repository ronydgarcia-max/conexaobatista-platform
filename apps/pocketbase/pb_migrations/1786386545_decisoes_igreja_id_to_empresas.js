/// <reference path="../pb_data/types.d.ts" />

// Repontua o campo igreja_id da auditoria `decisoes_aprovacao_igreja` para a
// coleção `empresas` (tipo = 'igreja'). Remove, persiste, e recria apontando
// para `empresas` (o PocketBase não permite trocar a coleção de uma relação
// em um único save).
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("decisoes_aprovacao_igreja");
    const empresas = app.findCollectionByNameOrId("empresas");

    try {
      collection.fields.removeByName("igreja_id");
    } catch (_) {}
    app.save(collection);

    collection.fields.add(
      new RelationField({
        name: "igreja_id",
        required: true,
        maxSelect: 1,
        collectionId: empresas.id,
        cascadeDelete: false,
      }),
    );
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("decisoes_aprovacao_igreja");
    let igrejas;
    try {
      igrejas = app.findCollectionByNameOrId("igrejas");
    } catch (_) {
      return;
    }
    try {
      collection.fields.removeByName("igreja_id");
    } catch (_) {}
    app.save(collection);
    collection.fields.add(
      new RelationField({
        name: "igreja_id",
        required: true,
        maxSelect: 1,
        collectionId: igrejas.id,
        cascadeDelete: false,
      }),
    );
    app.save(collection);
  },
);
