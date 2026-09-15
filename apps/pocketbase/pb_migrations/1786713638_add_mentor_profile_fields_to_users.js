// apps/pocketbase/pb_migrations/1786713638_add_mentor_profile_fields_to_users.js
/// <reference path="../pb_data/types.d.ts" />

// Etapa 2 do fluxo de mentor: adiciona os campos do perfil complementar
// do mentor na coleção `users`. Esses campos são preenchidos após o aceite
// do termo de responsabilidade, no formulário complementar de perfil.
//   mentor_areas              — json array com as áreas de competência
//   mentor_cursos_publicados  — json array com os cursos publicados
//   mentor_biografia          — text, mini-biografia do mentor (máx 500)
//   mentor_status             — text, "pendente" | "aprovado" | "rejeitado"
//   mentor_data_solicitacao   — datetime, momento do envio do formulário
// Não altera regras de acesso existentes nem concede permissões.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users');

    // mentor_areas — áreas de competência/temas selecionadas (json array).
    if (!collection.fields.getByName('mentor_areas')) {
      collection.fields.add(new JSONField({ name: 'mentor_areas' }));
    }

    // mentor_cursos_publicados — lista de cursos com tipo, plataforma,
    // titulo, link e descricao (json array).
    if (!collection.fields.getByName('mentor_cursos_publicados')) {
      collection.fields.add(new JSONField({ name: 'mentor_cursos_publicados' }));
    }

    // mentor_biografia — mini-biografia do mentor (text, máximo 500).
    if (!collection.fields.getByName('mentor_biografia')) {
      collection.fields.add(new TextField({ name: 'mentor_biografia', max: 500 }));
    }

    // mentor_status — estado da solicitação de mentor para análise
    // administrativa. Não concede permissões automaticamente.
    if (!collection.fields.getByName('mentor_status')) {
      collection.fields.add(
        new SelectField({
          name: 'mentor_status',
          maxSelect: 1,
          values: ['pendente', 'aprovado', 'rejeitado'],
        }),
      );
    }

    // mentor_data_solicitacao — quando o usuário enviou o formulário.
    if (!collection.fields.getByName('mentor_data_solicitacao')) {
      collection.fields.add(new DateField({ name: 'mentor_data_solicitacao' }));
    }

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('users');
    ['mentor_areas', 'mentor_cursos_publicados', 'mentor_biografia', 'mentor_status', 'mentor_data_solicitacao'].forEach(
      (nome) => {
        try {
          collection.fields.removeByName(nome);
        } catch (_) {}
      },
    );
    app.save(collection);
  },
);
