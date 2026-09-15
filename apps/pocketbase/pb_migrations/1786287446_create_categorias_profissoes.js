/// <reference path="../pb_data/types.d.ts" />

// Cria as coleções `categorias_profissionais` e `profissoes` para gestão
// administrativa das categorias e profissões dos profissionais liberais.
// Leitura pública (dados de referência); escrita restrita a administradores.

migrate(
  (app) => {
    // ---- categorias_profissionais ----
    let categorias;
    try {
      categorias = app.findCollectionByNameOrId('categorias_profissionais');
    } catch (_) {
      categorias = new Collection({
        type: 'base',
        name: 'categorias_profissionais',
        // Dados de referência: leitura pública, escrita só admin.
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.collectionName = 'admins'",
        updateRule: "@request.auth.collectionName = 'admins'",
        deleteRule: "@request.auth.collectionName = 'admins'",
        fields: [
          { name: 'nome', type: 'text', required: true, max: 120 },
          { name: 'descricao', type: 'text', max: 500 },
          { name: 'ativo', type: 'bool' },
          { name: 'data_criacao', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'data_atualizacao', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_categorias_profissionais_ativo ON categorias_profissionais (ativo)',
        ],
      });
      app.save(categorias);
    }

    // ---- profissoes ----
    let profissoes;
    try {
      profissoes = app.findCollectionByNameOrId('profissoes');
    } catch (_) {
      profissoes = new Collection({
        type: 'base',
        name: 'profissoes',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.collectionName = 'admins'",
        updateRule: "@request.auth.collectionName = 'admins'",
        deleteRule: "@request.auth.collectionName = 'admins'",
        fields: [
          { name: 'nome', type: 'text', required: true, max: 120 },
          {
            name: 'categoria_id',
            type: 'relation',
            required: true,
            maxSelect: 1,
            collectionId: categorias.id,
            cascadeDelete: false,
          },
          { name: 'descricao', type: 'text', max: 500 },
          { name: 'ativo', type: 'bool' },
          { name: 'data_criacao', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'data_atualizacao', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_profissoes_categoria ON profissoes (categoria_id)',
          'CREATE INDEX idx_profissoes_ativo ON profissoes (ativo)',
        ],
      });
      app.save(profissoes);
    }
  },
  (app) => {
    try {
      const prof = app.findCollectionByNameOrId('profissoes');
      app.delete(prof);
    } catch (e) {
      if (!e.message.includes('no rows in result set')) throw e;
    }
    try {
      const cat = app.findCollectionByNameOrId('categorias_profissionais');
      app.delete(cat);
    } catch (e) {
      if (!e.message.includes('no rows in result set')) throw e;
    }
  },
);
