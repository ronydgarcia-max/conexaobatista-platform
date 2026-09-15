/// <reference path="../pb_data/types.d.ts" />

// Adiciona o campo `profissoes_ids` (array de relações, até 5) à coleção
// `servicos_profissionais`, vinculando serviços a profissões cadastradas.
// Mantém o campo `profissao` (texto livre) para compatibilidade.

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('servicos_profissionais');
    const profissoes = app.findCollectionByNameOrId('profissoes');

    if (collection.fields.getByName('profissoes_ids')) return;

    collection.fields.add(
      new RelationField({
        name: 'profissoes_ids',
        required: false,
        maxSelect: 5,
        minSelect: 0,
        collectionId: profissoes.id,
        cascadeDelete: false,
      }),
    );
    app.save(collection);
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('servicos_profissionais');
      collection.fields.removeByName('profissoes_ids');
      app.save(collection);
    } catch (e) {
      if (!e.message.includes('no rows in result set')) throw e;
    }
  },
);
