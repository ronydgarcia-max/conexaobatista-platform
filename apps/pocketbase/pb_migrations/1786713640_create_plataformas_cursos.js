// apps/pocketbase/pb_migrations/1786713640_create_plataformas_cursos.js
/// <reference path="../pb_data/types.d.ts" />

// Catálogo de plataformas de cursos para o formulário de perfil do mentor.
// Leitura pública (formulário de cadastro anônimo) e escrita restrita a
// admins. Semeia a categoria "Brasileiras" com as 13 plataformas iniciais.
// Novas categorias/plataformas podem ser adicionadas via admin sem alterar
// o código do formulário (o dropdown é montado dinamicamente por categoria).
migrate(
  (app) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId('plataformas_cursos');
    } catch (_) {
      collection = new Collection({
        type: 'base',
        name: 'plataformas_cursos',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.collectionName = 'admins'",
        updateRule: "@request.auth.collectionName = 'admins'",
        deleteRule: "@request.auth.collectionName = 'admins'",
        fields: [
          { name: 'nome', type: 'text', required: true, max: 120 },
          { name: 'categoria', type: 'text', required: true, max: 80 },
          { name: 'url_base', type: 'text', max: 200 },
          { name: 'ativo', type: 'bool' },
          { name: 'data_criacao', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'data_atualizacao', type: 'autodate', onCreate: true, onUpdate: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_plataformas_cursos_categoria ON plataformas_cursos (categoria)'],
      });
      app.save(collection);
    }

    // Semeia as plataformas iniciais (apenas se não houver registros).
    let existentes = 0;
    try {
      existentes = $app.db().newQuery('SELECT count(*) as c FROM plataformas_cursos').one().c;
    } catch (_) {}

    if (!existentes) {
      const plataformas = [
        { nome: 'Alura', url_base: 'alura.com.br' },
        { nome: 'Hotmart', url_base: 'hotmart.com' },
        { nome: 'Kiwify', url_base: 'kiwify.com' },
        { nome: 'Rocketseat', url_base: 'rocketseat.com.br' },
        { nome: 'EBAC', url_base: 'ebaconline.com.br' },
        { nome: 'Descomplica', url_base: 'descomplica.com.br' },
        { nome: 'Curso em Vídeo (Guanabara)', url_base: 'cursoemvideo.com' },
        { nome: 'FGV Online', url_base: 'fgv.br' },
        { nome: 'Fundação Bradesco (Escola Virtual)', url_base: 'ev.org.br' },
        { nome: 'Veduca', url_base: 'veduca.org' },
        { nome: 'Cursos Livres SENAI/EAD', url_base: 'ead.senai.br' },
        { nome: 'Hashtag Treinamentos', url_base: 'hashtagtreinamentos.com' },
        { nome: 'Tera', url_base: 'tera.com.br' },
      ];
      plataformas.forEach((p) => {
        const rec = new Record(collection);
        rec.set('nome', p.nome);
        rec.set('categoria', 'Brasileiras');
        rec.set('url_base', p.url_base);
        rec.set('ativo', true);
        app.save(rec);
      });
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('plataformas_cursos');
      app.delete(collection);
    } catch (e) {
      if (e.message.includes('no rows in result set')) {
        console.log('Coleção plataformas_cursos não encontrada, ignorando revert.');
        return;
      }
      throw e;
    }
  },
);
