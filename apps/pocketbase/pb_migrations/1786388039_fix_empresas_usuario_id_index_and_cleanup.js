/// <reference path="../pb_data/types.d.ts" />

// Correções do Cadastro de Igrejas (sem criar coleção separada):
//
// 1) O índice único `idx_empresas_usuario_id` impedia a criação de mais de uma
//    igreja (tipo = 'igreja') sem usuário vinculado, pois todas compartilhavam
//    o mesmo usuario_id vazio. Transforma o índice em PARCIAL: a unicidade só
//    vale quando usuario_id está preenchido. Assim, empresas continuam com
//    1:1 usuário↔empresa, e igrejas independentes (sem usuário) coexistem.
//
// 2) Remove o registro fictício de igreja plantado durante os testes pela
//    migration 1786386544 ("Igreja Batista Central de São Paulo") e desvincula
//    os usuários demo associados (igreja_id zerado, papel volta a 'membro').
//    Cadastros reais não são tocados.
migrate(
  (app) => {
    const empresas = app.findCollectionByNameOrId("empresas");

    // 1) Índice parcial: unicidade de usuario_id apenas quando preenchido.
    const idxName = "idx_empresas_usuario_id";
    let changed = false;
    empresas.indexes = (empresas.indexes || []).map((idx) => {
      if (typeof idx === "string" && idx.includes(idxName)) {
        changed = true;
        return "CREATE UNIQUE INDEX `idx_empresas_usuario_id` ON `empresas` (`usuario_id`) WHERE `usuario_id` != ''";
      }
      return idx;
    });
    if (changed) app.save(empresas);

    // 2) Remove a igreja fictícia de teste e desvincula usuários demo.
    let demoChurches = [];
    try {
      demoChurches = app.findRecordsByFilter(
        "empresas",
        "razao_social = 'Igreja Batista Central de São Paulo' && tipo = 'igreja'",
      );
    } catch (e) {
      if (!e.message.includes("no rows in result set")) throw e;
    }

    for (const ch of demoChurches) {
      // Desvincula usuários ligados a esta igreja (igreja_id tem cascadeDelete
      // false, então precisamos limpar manualmente para não deixar referência
      // pendente).
      let linked = [];
      try {
        linked = app.findRecordsByFilter(
          "users",
          "igreja_id = {:id}",
          "",
          200,
          0,
          { id: ch.id },
        );
      } catch (e) {
        if (!e.message.includes("no rows in result set")) throw e;
      }
      for (const u of linked) {
        u.set("igreja_id", "");
        u.set("papel", "membro");
        app.save(u);
      }

      // Limpa decisões de aprovação vinculadas (cascadeDelete true, mas
      // removemos explicitamente por segurança).
      let decisoes = [];
      try {
        decisoes = app.findRecordsByFilter(
          "decisoes_aprovacao_igreja",
          "igreja_id = {:id}",
          "",
          500,
          0,
          { id: ch.id },
        );
      } catch (e) {
        if (!e.message.includes("no rows in result set")) throw e;
      }
      for (const d of decisoes) {
        app.delete(d);
      }

      app.delete(ch);
    }
  },
  (app) => {
    // Reverte o índice para a forma anterior (único, não parcial).
    try {
      const empresas = app.findCollectionByNameOrId("empresas");
      let changed = false;
      empresas.indexes = (empresas.indexes || []).map((idx) => {
        if (typeof idx === "string" && idx.includes("idx_empresas_usuario_id")) {
          changed = true;
          return "CREATE UNIQUE INDEX `idx_empresas_usuario_id` ON `empresas` (`usuario_id`)";
        }
        return idx;
      });
      if (changed) app.save(empresas);
    } catch (e) {
      if (!e.message.includes("no rows in result set")) throw e;
    }
  },
);
