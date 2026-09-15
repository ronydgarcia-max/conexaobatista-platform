// apps/pocketbase/pb_migrations/1786713639_create_areas_mentor.js
/// <reference path="../pb_data/types.d.ts" />

// Catálogo de áreas de competência do mentor. Leitura pública (o formulário
// de cadastro anônimo precisa listar as áreas) e escrita restrita a admins.
// Semeia as 17 áreas iniciais listadas no requisito.
migrate(
  (app) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId('areas_mentor');
    } catch (_) {
      collection = new Collection({
        type: 'base',
        name: 'areas_mentor',
        // Leitura pública para o formulário de cadastro; escrita só admins.
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
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_areas_mentor_ativo ON areas_mentor (ativo)'],
      });
      app.save(collection);
    }

    // Semeia as áreas iniciais (apenas se ainda não houver registros).
    let existentes = 0;
    try {
      existentes = $app.db().newQuery('SELECT count(*) as c FROM areas_mentor').one().c;
    } catch (_) {}

    if (!existentes) {
      const areas = [
        'Teologia',
        'Liderança',
        'Discipulado',
        'Missões',
        'Educação Cristã',
        'Aconselhamento',
        'Administração Eclesiástica',
        'Música/Louvor',
        'Comunicação',
        'Evangelismo',
        'Desenvolvimento Pessoal',
        'Finanças Pessoais',
        'Saúde Mental',
        'Relacionamentos',
        'Empreendedorismo',
        'Tecnologia',
        'Outros',
      ];
      areas.forEach((nome) => {
        const rec = new Record(collection);
        rec.set('nome', nome);
        rec.set('ativo', true);
        app.save(rec);
      });
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('areas_mentor');
      app.delete(collection);
    } catch (e) {
      if (e.message.includes('no rows in result set')) {
        console.log('Coleção areas_mentor não encontrada, ignorando revert.');
        return;
      }
      throw e;
    }
  },
);
