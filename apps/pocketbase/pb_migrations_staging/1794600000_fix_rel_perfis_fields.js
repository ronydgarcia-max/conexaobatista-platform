/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("rel_perfis");
  const users = app.findCollectionByNameOrId("users");

  const owner = collection.fields.getByName("owner");
  owner.collectionId = users.id;
  owner.required = true;
  owner.maxSelect = 1;
  owner.cascadeDelete = true;

  const preferencias = collection.fields.getByName("preferencias");
  preferencias.maxSelect = 5;
  preferencias.values = ["amizade", "namoro", "casamento", "networking", "estudo"];

  const visibilidade = collection.fields.getByName("visibilidade");
  visibilidade.maxSelect = 1;
  visibilidade.values = ["publico", "privado"];

  return app.save(collection);
}, (app) => {
  // A reversão mantém a coleção e os registros, pois esta migração apenas corrige opções.
});
