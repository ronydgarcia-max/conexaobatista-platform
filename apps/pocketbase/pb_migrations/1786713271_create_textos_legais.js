// apps/pocketbase/pb_migrations/1786713271_create_textos_legais.js
/// <reference path="../pb_data/types.d.ts" />

// Gerenciamento administrativo do termo de mentor: cria a coleção
// `textos_legais` para armazenar textos legais editáveis pela administração.
// O registro com tipo = "mentor_termo" alimenta o modal de aceite do fluxo
// de cadastro. Leitura pública (para o modal anônimo do cadastro) e
// escrita restrita a administradores. Não altera outras coleções ou permissões.
migrate(
  (app) => {
    const admins = app.findCollectionByNameOrId('admins');

    let collection;
    try {
      collection = app.findCollectionByNameOrId('textos_legais');
    } catch (_) {
      collection = new Collection({
        type: 'base',
        name: 'textos_legais',
        // Leitura pública: o modal de aceite do cadastro (usuário anônimo)
        // precisa ler o termo do mentor. Escrita apenas para administradores.
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.collectionName = 'admins'",
        updateRule: "@request.auth.collectionName = 'admins'",
        deleteRule: "@request.auth.collectionName = 'admins'",
        fields: [
          // tipo — identificador do texto legal (ex.: "mentor_termo").
          { name: 'tipo', type: 'text', required: true, max: 60 },
          // titulo — título exibido no modal/área administrativa.
          { name: 'titulo', type: 'text', required: true, max: 200 },
          // conteudo — conteúdo do texto legal (suporta quebras de linha).
          { name: 'conteudo', type: 'text', required: true },
          // data_atualizacao — momento da última atualização.
          { name: 'data_atualizacao', type: 'autodate', onCreate: true, onUpdate: true },
          // atualizado_por — administrador responsável pela última alteração.
          {
            name: 'atualizado_por',
            type: 'relation',
            maxSelect: 1,
            minSelect: 0,
            collectionId: admins.id,
            cascadeDelete: false,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_textos_legais_tipo ON textos_legais (tipo)',
        ],
      });
      app.save(collection);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('textos_legais');
      app.delete(collection);
    } catch (e) {
      if (e.message.includes('no rows in result set')) {
        console.log('Coleção textos_legais não encontrada, ignorando revert.');
        return;
      }
      throw e;
    }
  },
);
