// apps/pocketbase/pb_migrations/1786712880_add_mentor_fields_to_users.js
/// <reference path="../pb_data/types.d.ts" />

// Etapa 1 do fluxo de mentor: adiciona os campos que registram a intenção
// do usuário em se candidatar como mentor e a data de aceitação do termo
// de responsabilidade. Não altera regras de acesso existentes.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users');

    // mentor_solicitado (booleano) — se o usuário solicitou ser mentor.
    // Não obrigatório: usuários que não marcarem a opção permanecem com false.
    if (!collection.fields.getByName('mentor_solicitado')) {
      collection.fields.add(new BoolField({ name: 'mentor_solicitado' }));
    }

    // mentor_data_aceite_termo (data/hora) — momento da aceitação do termo.
    // Não obrigatório: vazio para quem não solicitou ser mentor.
    if (!collection.fields.getByName('mentor_data_aceite_termo')) {
      collection.fields.add(new DateField({ name: 'mentor_data_aceite_termo' }));
    }

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('users');
    try {
      collection.fields.removeByName('mentor_solicitado');
    } catch (_) {}
    try {
      collection.fields.removeByName('mentor_data_aceite_termo');
    } catch (_) {}
    app.save(collection);
  },
);
