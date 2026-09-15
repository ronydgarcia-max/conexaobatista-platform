// Cria duas coleções locais para contornar limitações da API VPS de cursos.
//
// 1. cursos_conteudo — complemento dos campos objetivos / publico_alvo /
//    pre_requisitos que NÃO existem no banco da API VPS. Leitura pública
//    (o proxy público de detalhe mescla esses campos no resultado). Escrita
//    restrita a admins. Seed do curso 29 incluído.
//
// 2. matriculas — matrículas locais dos alunos. A API VPS NÃO possui endpoint
//    de matrícula, então a matrícula é registrada no PocketBase. Índice único
//    (usuario_id, curso_api_id) impede duplicatas. Leitura/escrita pelo
//    próprio usuário autenticado + admins.
/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // ===== 1. cursos_conteudo =====
    let conteudo;
    try {
      conteudo = app.findCollectionByNameOrId("cursos_conteudo");
    } catch (_) {
      conteudo = new Collection({
        type: "base",
        name: "cursos_conteudo",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.collectionName = 'admins'",
        updateRule: "@request.auth.collectionName = 'admins'",
        deleteRule: "@request.auth.collectionName = 'admins'",
        fields: [
          { name: "curso_api_id", type: "text", required: true, max: 20, min: 0 },
          { name: "objetivos", type: "text", max: 2000, min: 0 },
          { name: "publico_alvo", type: "text", max: 2000, min: 0 },
          { name: "pre_requisitos", type: "text", max: 2000, min: 0 },
          { name: "created", type: "autodate", onCreate: true },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE UNIQUE INDEX idx_cursos_conteudo_curso_api_id ON cursos_conteudo (curso_api_id)",
        ],
      });
      app.save(conteudo);
    }

    // Seed: conteúdo complementar do curso 29 (Liderança e Administração Eclesiástica).
    try {
      const existente = app.findRecordsByFilter(
        "cursos_conteudo",
        "curso_api_id = '29'",
      );
      if (!existente || existente.length === 0) {
        const rec = new Record(conteudo);
        rec.set("curso_api_id", "29");
        rec.set(
          "objetivos",
          "Capacitar o secretário da igreja com conhecimentos técnicos e espirituais para gerenciar documentos e procedimentos administrativos de forma eficiente e em conformidade com a lei.",
        );
        rec.set(
          "publico_alvo",
          "Secretários de igrejas, líderes administrativos, pastores e membros interessados em aprender sobre administração eclesiástica e documentação legal.",
        );
        rec.set(
          "pre_requisitos",
          "Nenhum pré-requisito. Recomenda-se conhecimento básico de informática.",
        );
        app.save(rec);
      }
    } catch (e) {
      console.log("[migracao] Seed cursos_conteudo 29 pulado:", e?.message || e);
    }

    // ===== 2. matriculas =====
    try {
      app.findCollectionByNameOrId("matriculas");
    } catch (_) {
      const matriculas = new Collection({
        type: "base",
        name: "matriculas",
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
          { name: "curso_api_id", type: "text", required: true, max: 20, min: 0 },
          { name: "curso_titulo", type: "text", max: 200, min: 0 },
          { name: "curso_imagem", type: "text", max: 500, min: 0 },
          { name: "curso_mentor", type: "text", max: 120, min: 0 },
          { name: "curso_preco", type: "number", min: 0 },
          {
            name: "status",
            type: "select",
            maxSelect: 1,
            values: ["ativa", "concluida", "cancelada"],
          },
          { name: "created", type: "autodate", onCreate: true },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE UNIQUE INDEX idx_matriculas_usuario_curso ON matriculas (usuario_id, curso_api_id)",
        ],
      });
      app.save(matriculas);
    }
  },
  (app) => {
    for (const name of ["matriculas", "cursos_conteudo"]) {
      try {
        const c = app.findCollectionByNameOrId(name);
        app.delete(c);
      } catch (e) {
        if (e.message.includes("no rows in result set")) continue;
        throw e;
      }
    }
  },
);
