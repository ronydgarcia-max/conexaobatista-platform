/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // ── rel_perfis ───────────────────────────────────────────────────────────
    let perfis;
    try {
      perfis = app.findCollectionByNameOrId("rel_perfis");
    } catch (_) {
      perfis = new Collection({
        type: "base",
        name: "rel_perfis",
        listRule: "@request.auth.id != '' && (visibilidade != 'privado' || owner = @request.auth.id)",
        viewRule: "@request.auth.id != '' && (visibilidade != 'privado' || owner = @request.auth.id)",
        createRule: "@request.auth.id != '' && @request.auth.id = @request.body.owner",
        updateRule: "@request.auth.id != '' && owner = @request.auth.id",
        deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
        fields: [
          {
            name: "owner",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          { name: "apelido", type: "text", max: 80 },
          {
            name: "foto",
            type: "file",
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ["image/jpeg", "image/png", "image/webp"],
            thumbs: ["200x200", "400x400"],
          },
          { name: "data_nascimento", type: "date" },
          {
            name: "status_relacionamento",
            type: "select",
            maxSelect: 1,
            values: ["solteiro", "viuvo", "divorciado", "outro"],
          },
          {
            name: "preferencias",
            type: "select",
            maxSelect: 5,
            values: ["amizade", "namoro", "casamento", "networking", "estudo"],
          },
          { name: "bio", type: "text", max: 600 },
          { name: "cidade", type: "text", max: 80 },
          { name: "estado", type: "text", max: 2 },
          {
            name: "visibilidade",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["publico", "membros", "privado"],
          },
          { name: "ativo", type: "bool" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE UNIQUE INDEX idx_rel_perfis_owner ON rel_perfis (owner)",
        ],
      });
      app.save(perfis);
    }

    // ── rel_bloqueios ────────────────────────────────────────────────────────
    let bloqueios;
    try {
      bloqueios = app.findCollectionByNameOrId("rel_bloqueios");
    } catch (_) {
      bloqueios = new Collection({
        type: "base",
        name: "rel_bloqueios",
        listRule: "@request.auth.id != '' && bloqueador = @request.auth.id",
        viewRule: "@request.auth.id != '' && bloqueador = @request.auth.id",
        createRule: "@request.auth.id != '' && @request.auth.id = @request.body.bloqueador",
        updateRule: null,
        deleteRule: "@request.auth.id != '' && bloqueador = @request.auth.id",
        fields: [
          {
            name: "bloqueador",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          {
            name: "bloqueado",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          { name: "bloqueado_apelido", type: "text", max: 80 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(bloqueios);
    }

    // ── rel_denuncias ────────────────────────────────────────────────────────
    let denuncias;
    try {
      denuncias = app.findCollectionByNameOrId("rel_denuncias");
    } catch (_) {
      denuncias = new Collection({
        type: "base",
        name: "rel_denuncias",
        listRule: "@request.auth.id != '' && denunciante = @request.auth.id",
        viewRule: "@request.auth.id != '' && denunciante = @request.auth.id",
        createRule: "@request.auth.id != '' && @request.auth.id = @request.body.denunciante",
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: "denunciante",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          {
            name: "denunciado",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          { name: "denunciado_apelido", type: "text", max: 80 },
          {
            name: "motivo",
            type: "select",
            required: true,
            maxSelect: 1,
            values: [
              "comportamento_inadequado",
              "conteudo_ofensivo",
              "perfil_falso",
              "assedio",
              "outro",
            ],
          },
          { name: "descricao", type: "text", max: 1000 },
          {
            name: "status",
            type: "select",
            maxSelect: 1,
            values: ["pendente", "analisado", "resolvido"],
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(denuncias);
    }

    // ── rel_consentimentos ───────────────────────────────────────────────────
    let consentimentos;
    try {
      consentimentos = app.findCollectionByNameOrId("rel_consentimentos");
    } catch (_) {
      consentimentos = new Collection({
        type: "base",
        name: "rel_consentimentos",
        listRule: "@request.auth.id != '' && owner = @request.auth.id",
        viewRule: "@request.auth.id != '' && owner = @request.auth.id",
        createRule: "@request.auth.id != '' && @request.auth.id = @request.body.owner",
        updateRule: "@request.auth.id != '' && owner = @request.auth.id",
        deleteRule: null,
        fields: [
          {
            name: "owner",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          { name: "aceito_termos", type: "bool" },
          { name: "confirmou_idade", type: "bool" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE UNIQUE INDEX idx_rel_consentimentos_owner ON rel_consentimentos (owner)",
        ],
      });
      app.save(consentimentos);
    }
  },
  (app) => {
    for (const name of ["rel_consentimentos", "rel_denuncias", "rel_bloqueios", "rel_perfis"]) {
      try { app.delete(app.findCollectionByNameOrId(name)); } catch (_) {}
    }
  }
);
