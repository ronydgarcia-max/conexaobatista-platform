/// <reference path="../pb_data/types.d.ts" />

// Torne o cadastro de igrejas independente de um usuário responsável:
//  - usuario_id deixa de ser obrigatório (igreja pode existir sem usuário)
//  - cascadeDelete false (não apagar a igreja se o usuário for removido)
//  - createRule permite que admins criem igrejas sem usuario_id
//  - listRule/viewRule permitem leitura pública de igrejas aprovadas
//    (para o usuário escolher a igreja no cadastro)
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("empresas");

    const usuarioField = collection.fields.getByName("usuario_id");
    if (usuarioField) {
      usuarioField.required = false;
      usuarioField.cascadeDelete = false;
    }

    collection.createRule =
      "@request.auth.id != '' && (@request.auth.collectionName = 'admins' || @request.auth.id = @request.body.usuario_id)";

    const readRule =
      "(@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')) || (tipo = 'igreja' && status_aprovacao = 'aprovado')";
    collection.listRule = readRule;
    collection.viewRule = readRule;

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("empresas");

    const usuarioField = collection.fields.getByName("usuario_id");
    if (usuarioField) {
      usuarioField.required = true;
      usuarioField.cascadeDelete = true;
    }

    collection.createRule =
      "@request.auth.id != '' && @request.auth.id = @request.body.usuario_id";
    const original =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')";
    collection.listRule = original;
    collection.viewRule = original;

    app.save(collection);
  },
);
