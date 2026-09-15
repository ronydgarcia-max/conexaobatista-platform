/// <reference path="../pb_data/types.d.ts" />

// Cria o sistema de "Vínculos com Igrejas":
//  - vinculos_usuario_igreja: relaciona um usuário a uma ou mais igrejas,
//    com papel (pastor/secretario/membro), status (pendente/ativo/suspenso/encerrado)
//    e permissão "pode_aprovar_membros".
//  - historico_vinculos: auditoria de todas as alterações de vínculo.
//  - Migra dados existentes (users com papel + igreja_id) para a nova coleção.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const empresas = app.findCollectionByNameOrId("empresas");

    // ---------- vinculos_usuario_igreja (cria primeiro) ----------
    let vinculos;
    try {
      vinculos = app.findCollectionByNameOrId("vinculos_usuario_igreja");
    } catch (_) {
      vinculos = new Collection({
        type: "base",
        name: "vinculos_usuario_igreja",
        // Admin gerencia tudo; o próprio usuário pode ver seus vínculos.
        listRule:
          "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
        viewRule:
          "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
        createRule: "@request.auth.collectionName = 'admins'",
        updateRule: "@request.auth.collectionName = 'admins'",
        deleteRule: "@request.auth.collectionName = 'admins'",
        fields: [
          {
            name: "usuario_id",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          {
            name: "igreja_id",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: empresas.id,
            cascadeDelete: true,
          },
          {
            name: "papel",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["pastor", "secretario", "membro"],
          },
          {
            name: "status",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["pendente", "ativo", "suspenso", "encerrado"],
          },
          { name: "pode_aprovar_membros", type: "bool" },
          { name: "responsavel_nome", type: "text", max: 160 },
          { name: "motivo_alteracao", type: "text", max: 1000 },
          { name: "data_criacao", type: "autodate", onCreate: true, onUpdate: false },
          { name: "data_alteracao", type: "autodate", onCreate: true, onUpdate: true },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE UNIQUE INDEX idx_vinculos_usuario_igreja ON vinculos_usuario_igreja (usuario_id, igreja_id)",
          "CREATE INDEX idx_vinculos_igreja ON vinculos_usuario_igreja (igreja_id)",
          "CREATE INDEX idx_vinculos_status ON vinculos_usuario_igreja (status)",
        ],
      });
      app.save(vinculos);
    }

    // ---------- historico_vinculos ----------
    let historico;
    try {
      historico = app.findCollectionByNameOrId("historico_vinculos");
    } catch (_) {
      historico = new Collection({
        type: "base",
        name: "historico_vinculos",
        listRule: "@request.auth.collectionName = 'admins'",
        viewRule: "@request.auth.collectionName = 'admins'",
        createRule: "@request.auth.collectionName = 'admins'",
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: "vinculo_id",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: vinculos.id,
            cascadeDelete: true,
          },
          {
            name: "usuario_id",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          {
            name: "igreja_id",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: empresas.id,
            cascadeDelete: true,
          },
          { name: "responsavel_nome", type: "text", max: 160 },
          { name: "tipo_acao", type: "text", required: true, max: 30 },
          { name: "papel_anterior", type: "text", max: 30 },
          { name: "papel_novo", type: "text", max: 30 },
          { name: "status_anterior", type: "text", max: 30 },
          { name: "status_novo", type: "text", max: 30 },
          { name: "pode_aprovar_anterior", type: "bool" },
          { name: "pode_aprovar_novo", type: "bool" },
          { name: "motivo", type: "text", max: 1000 },
          { name: "data_acao", type: "date", required: true },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(historico);
    }

    // ---------- Migração de dados existentes ----------
    // Evita reprocessar se já existem vínculos.
    let jaTemVinculos = false;
    try {
      const existentes = app.findRecordsByFilter(
        "vinculos_usuario_igreja",
        "1=1",
        "created",
        1,
      );
      jaTemVinculos = existentes.length > 0;
    } catch (_) {}

    if (!jaTemVinculos) {
      const allUsers = app.findRecordsByFilter("users", "1=1", "created", 100000);
      for (const u of allUsers) {
        const papel = u.get("papel") || "";
        const igrejaRaw = u.get("igreja_id");
        const igrejaId = Array.isArray(igrejaRaw) ? igrejaRaw[0] || "" : igrejaRaw || "";
        if (!igrejaId) continue;
        if (!["pastor", "secretario", "membro"].includes(papel)) continue;

        const statusInicial =
          papel === "pastor" || papel === "secretario" ? "ativo" : "pendente";
        const podeAprovar = papel === "pastor" || papel === "secretario";

        const rec = new Record(vinculos);
        rec.set("usuario_id", u.id);
        rec.set("igreja_id", igrejaId);
        rec.set("papel", papel);
        rec.set("status", statusInicial);
        rec.set("pode_aprovar_membros", podeAprovar);
        app.save(rec);

        const hist = new Record(historico);
        hist.set("vinculo_id", rec.id);
        hist.set("usuario_id", u.id);
        hist.set("igreja_id", igrejaId);
        hist.set("tipo_acao", "criacao");
        hist.set("papel_novo", papel);
        hist.set("status_novo", statusInicial);
        hist.set("pode_aprovar_novo", podeAprovar);
        hist.set("motivo", "Migração automática de dados existentes");
        hist.set("data_acao", new Date().toISOString().split("T")[0]);
        app.save(hist);
      }
    }
  },
  (app) => {
    try {
      const h = app.findCollectionByNameOrId("historico_vinculos");
      app.delete(h);
    } catch (e) {
      if (!e.message.includes("no rows in result set")) throw e;
    }
    try {
      const v = app.findCollectionByNameOrId("vinculos_usuario_igreja");
      app.delete(v);
    } catch (e) {
      if (!e.message.includes("no rows in result set")) throw e;
    }
  },
);
