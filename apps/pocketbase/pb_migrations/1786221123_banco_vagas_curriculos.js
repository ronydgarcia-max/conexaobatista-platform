/// <reference path="../pb_data/types.d.ts" />

// Banco de Vagas e Currículos — estrutura de dados vinculada ao usuário
// existente (users) via `usuario_id`. Não altera cadastro atual, painel
// administrativo existente ou páginas públicas.
//
// Coleções criadas:
//   curriculos                 — coleção principal (1 por usuário)
//   curriculo_experiencias     — várias por currículo
//   curriculo_formacoes        — várias por currículo
//   curriculo_habilidades      — várias por currículo
//   curriculo_idiomas          — várias por currículo
//   curriculo_certificacoes    — várias por currículo
//
// Regras de acesso: dono do currículo (usuario_id) + administradores
// (collectionName = 'admins'). Campos sensíveis (CPF, data de nascimento,
// endereço, pretensão salarial, arquivo) são protegidos por regras e a UI
// administrativa os oculta da exibição.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // ── curriculos (coleção principal) ──────────────────────────────────────
    let curriculos;
    try {
      curriculos = app.findCollectionByNameOrId("curriculos");
    } catch (_) {
      curriculos = new Collection({
        type: "base",
        name: "curriculos",
        // Dono (usuario_id) ou administrador.
        listRule:
          "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
        viewRule:
          "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
        createRule:
          "@request.auth.id != '' && @request.auth.id = @request.body.usuario_id",
        updateRule:
          "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
        deleteRule:
          "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
        fields: [
          {
            name: "usuario_id",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          { name: "nome_completo", type: "text", max: 180 },
          { name: "cpf", type: "text", max: 20 }, // sensível
          { name: "data_nascimento", type: "date" }, // sensível
          { name: "email", type: "email" },
          { name: "telefone", type: "text", max: 40 },
          { name: "linkedin_url", type: "url" },
          { name: "portfolio_url", type: "url" },
          { name: "cep", type: "text", max: 12 }, // sensível (endereço)
          { name: "logradouro", type: "text", max: 160 }, // sensível (endereço)
          { name: "cidade", type: "text", max: 80 },
          { name: "estado", type: "text", max: 2 },
          { name: "pais", type: "text", max: 60 },
          { name: "resumo_profissional", type: "text", max: 2000 },
          { name: "objetivo", type: "text", max: 1000 },
          { name: "pretensao_salarial", type: "text", max: 60 }, // sensível
          {
            name: "tipo_contrato",
            type: "select",
            maxSelect: 1,
            values: ["clt", "pj", "estagio", "freelancer", "temporario", "outro"],
          },
          { name: "disponibilidade_viagem", type: "bool" },
          { name: "disponibilidade_mudanca", type: "bool" },
          {
            name: "regime_trabalho",
            type: "select",
            maxSelect: 1,
            values: ["presencial", "hibrido", "remoto", "indiferente"],
          },
          // data_cadastro / data_atualizacao como autodate (satisfaz o
          // requisito de autodate em coleções base e ordenação por data).
          { name: "data_cadastro", type: "autodate", onCreate: true, onUpdate: false },
          { name: "data_atualizacao", type: "autodate", onCreate: true, onUpdate: true },
          {
            name: "status",
            type: "select",
            maxSelect: 1,
            values: ["rascunho", "publicado", "pausado", "excluido"],
          },
          { name: "fonte_origem", type: "text", max: 60 },
          { name: "arquivo_curriculo_url", type: "text", max: 500 }, // sensível
          { name: "lgpd_consentimento", type: "bool" },
          { name: "data_consentimento", type: "date" },
          { name: "hash_arquivo", type: "text", max: 120 }, // sensível
          {
            name: "visibilidade_perfil",
            type: "select",
            maxSelect: 1,
            values: ["publico", "membros", "privado"],
          },
          { name: "data_exclusao_solicitada", type: "date" },
        ],
        indexes: [
          "CREATE UNIQUE INDEX idx_curriculos_usuario_id ON curriculos (usuario_id)",
        ],
      });
      app.save(curriculos);
    }

    // Resolve o id da coleção curriculos para usar nas relações.
    curriculos = app.findCollectionByNameOrId("curriculos");

    // Regras padrão para as coleções relacionadas: dono do currículo
    // (via traversal curriculo_id.usuario_id) ou administrador.
    const relatedRules = {
      listRule:
        "@request.auth.id != '' && (curriculo_id.usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
      viewRule:
        "@request.auth.id != '' && (curriculo_id.usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (curriculo_id.usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
      deleteRule:
        "@request.auth.id != '' && (curriculo_id.usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
    };

    const relField = () => ({
      name: "curriculo_id",
      type: "relation",
      required: true,
      maxSelect: 1,
      collectionId: curriculos.id,
      cascadeDelete: true,
    });

    const autodateFields = () => [
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ];

    // ── curriculo_experiencias ──────────────────────────────────────────────
    let experiencias;
    try {
      experiencias = app.findCollectionByNameOrId("curriculo_experiencias");
    } catch (_) {
      experiencias = new Collection({
        type: "base",
        name: "curriculo_experiencias",
        ...relatedRules,
        fields: [
          relField(),
          { name: "empresa", type: "text", max: 160 },
          { name: "cargo", type: "text", max: 120 },
          { name: "data_inicio", type: "date" },
          { name: "data_fim", type: "date" },
          { name: "emprego_atual", type: "bool" },
          { name: "descricao", type: "text", max: 2000 },
          {
            name: "modalidade",
            type: "select",
            maxSelect: 1,
            values: ["presencial", "hibrido", "remoto"],
          },
          ...autodateFields(),
        ],
      });
      app.save(experiencias);
    }

    // ── curriculo_formacoes ─────────────────────────────────────────────────
    let formacoes;
    try {
      formacoes = app.findCollectionByNameOrId("curriculo_formacoes");
    } catch (_) {
      formacoes = new Collection({
        type: "base",
        name: "curriculo_formacoes",
        ...relatedRules,
        fields: [
          relField(),
          { name: "instituicao", type: "text", max: 160 },
          { name: "curso", type: "text", max: 160 },
          {
            name: "grau",
            type: "select",
            maxSelect: 1,
            values: ["ensino_fundamental", "ensino_medio", "tecnico", "superior", "pos_graduacao", "mestrado", "doutorado"],
          },
          { name: "data_inicio", type: "date" },
          { name: "data_conclusao", type: "date" },
          {
            name: "status",
            type: "select",
            maxSelect: 1,
            values: ["cursando", "concluido", "trancado", "abandonado"],
          },
          ...autodateFields(),
        ],
      });
      app.save(formacoes);
    }

    // ── curriculo_habilidades ───────────────────────────────────────────────
    let habilidades;
    try {
      habilidades = app.findCollectionByNameOrId("curriculo_habilidades");
    } catch (_) {
      habilidades = new Collection({
        type: "base",
        name: "curriculo_habilidades",
        ...relatedRules,
        fields: [
          relField(),
          { name: "nome", type: "text", max: 120 },
          {
            name: "nivel",
            type: "select",
            maxSelect: 1,
            values: ["iniciante", "intermediario", "avancado", "especialista"],
          },
          ...autodateFields(),
        ],
      });
      app.save(habilidades);
    }

    // ── curriculo_idiomas ───────────────────────────────────────────────────
    let idiomas;
    try {
      idiomas = app.findCollectionByNameOrId("curriculo_idiomas");
    } catch (_) {
      idiomas = new Collection({
        type: "base",
        name: "curriculo_idiomas",
        ...relatedRules,
        fields: [
          relField(),
          { name: "idioma", type: "text", max: 80 },
          {
            name: "nivel",
            type: "select",
            maxSelect: 1,
            values: ["basico", "intermediario", "avancado", "fluente", "nativo"],
          },
          ...autodateFields(),
        ],
      });
      app.save(idiomas);
    }

    // ── curriculo_certificacoes ─────────────────────────────────────────────
    let certificacoes;
    try {
      certificacoes = app.findCollectionByNameOrId("curriculo_certificacoes");
    } catch (_) {
      certificacoes = new Collection({
        type: "base",
        name: "curriculo_certificacoes",
        ...relatedRules,
        fields: [
          relField(),
          { name: "curso", type: "text", max: 160 },
          { name: "instituicao", type: "text", max: 160 },
          { name: "data_conclusao", type: "date" },
          { name: "url", type: "url" },
          ...autodateFields(),
        ],
      });
      app.save(certificacoes);
    }
  },
  (app) => {
    for (const name of [
      "curriculo_certificacoes",
      "curriculo_idiomas",
      "curriculo_habilidades",
      "curriculo_formacoes",
      "curriculo_experiencias",
      "curriculos",
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {}
    }
  },
);
