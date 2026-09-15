/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    let collection;
    try {
      collection = app.findCollectionByNameOrId("igrejas");
    } catch (_) {
      collection = new Collection({
        type: "base",
        name: "igrejas",
        // Publicly readable so users can pick a church during signup.
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.collectionName = 'admins'",
        updateRule: "@request.auth.collectionName = 'admins'",
        deleteRule: "@request.auth.collectionName = 'admins'",
        fields: [
          { name: "nome", type: "text", required: true, max: 200 },
          { name: "cidade", type: "text", max: 80 },
          { name: "estado", type: "text", max: 2 },
          { name: "telefone", type: "text", max: 40 },
          { name: "email", type: "email" },
          { name: "ativo", type: "bool" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(collection);
    }

    // Seed a few demo churches if the collection is empty.
    let hasRecords = false;
    try {
      const existing = app.findRecordsByFilter("igrejas", "id != ''", "created", 1, 0);
      hasRecords = existing.length > 0;
    } catch (_) {}

    if (!hasRecords) {
      const seeds = [
        { nome: "Igreja Batista Central de São Paulo", cidade: "São Paulo", estado: "SP", telefone: "(11) 3333-1111", email: "contato@ibcsp.org.br" },
        { nome: "Igreja Batista do Pinheiros", cidade: "São Paulo", estado: "SP", telefone: "(11) 3333-2222", email: "contato@ibpinheiros.org.br" },
        { nome: "Igreja Batista de Belém", cidade: "Belém", estado: "PA", telefone: "(91) 3333-3333", email: "contato@ibbelem.org.br" },
      ];
      for (const s of seeds) {
        const rec = new Record(collection);
        rec.set("nome", s.nome);
        rec.set("cidade", s.cidade);
        rec.set("estado", s.estado);
        rec.set("telefone", s.telefone);
        rec.set("email", s.email);
        rec.set("ativo", true);
        app.save(rec);
      }
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("igrejas");
      app.delete(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) return;
      throw e;
    }
  },
);
