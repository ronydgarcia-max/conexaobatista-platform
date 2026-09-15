/// <reference path="../pb_data/types.d.ts" />

// Ensure the demo church representatives (Pastor Demo / Secretário Demo) have
// an ACTIVE vínculo in `vinculos_usuario_igreja` with pode_aprovar_membros=true.
//
// Root cause of "Acesso restrito" on /igreja/aprovacao-membros:
// IgrejaLayout.verificarAcessoPainel() grants access only when a vínculo exists
// with status='ativo' && pode_aprovar_membros===true && papel in (pastor|secretario).
// The previous repair migration (1786830900) set `papel`, `status_aprovacao` and
// `igreja_id` directly on the `users` record, but never created/activated the
// vínculo row — so the panel access check always returned false.
//
// This migration is idempotent: it creates the vínculo if missing, or promotes
// an existing one to ativo + pode_aprovar_membros=true with the correct papel.

migrate(
  (app) => {
    const vinculosCol = app.findCollectionByNameOrId("vinculos_usuario_igreja");
    const historicoCol = app.findCollectionByNameOrId("historico_vinculos");

    // Resolve a valid church (empresas with tipo='igreja'); create one if none.
    const empresasCol = app.findCollectionByNameOrId("empresas");
    let churchId = "";
    try {
      const churches = app.findRecordsByFilter("empresas", "tipo = 'igreja'", "created", 1, 0);
      if (churches.length > 0) churchId = churches[0].id;
    } catch (_) {}

    if (!churchId) {
      const rec = new Record(empresasCol);
      rec.set("tipo", "igreja");
      rec.set("razao_social", "Igreja Batista Central de São Paulo");
      rec.set("nome_fantasia", "Igreja Batista Central");
      rec.set("cidade", "São Paulo");
      rec.set("estado", "SP");
      rec.set("telefone", "(11) 3333-1111");
      rec.set("email", "contato@ibcsp.org.br");
      rec.set("visibilidade", "publico");
      rec.set("status_aprovacao", "aprovado");
      rec.set("status", "publicado");
      app.save(rec);
      churchId = rec.id;
    }

    const usersCol = app.findCollectionByNameOrId("users");

    const reps = [
      {
        email: "pastor.demo@conexaobatista.com.br",
        password: "PastorDemo123!",
        name: "Pastor Demo",
        username: "pastor_demo",
        whatsapp: "(11) 99999-0001",
        sexo: "masculino",
        cidade: "São Paulo",
        papel: "pastor",
        responsavel: "Pastor Demo",
      },
      {
        email: "secretario.demo@conexaobatista.com.br",
        password: "SecretarioDemo123!",
        name: "Secretário Demo",
        username: "secretario_demo",
        whatsapp: "(11) 99999-0002",
        sexo: "feminino",
        cidade: "São Paulo",
        papel: "secretario",
        responsavel: "Secretário Demo",
      },
    ];

    for (const r of reps) {
      // Find the user by email; create if missing (self-sufficient).
      let user = null;
      try {
        const found = app.findRecordsByFilter("users", "email = {:e}", "", 1, 0, { e: r.email });
        if (found.length > 0) user = found[0];
      } catch (_) {}

      if (!user) {
        user = new Record(usersCol);
        user.set("email", r.email);
        user.set("name", r.name);
        user.set("whatsapp", r.whatsapp);
        user.set("sexo", r.sexo);
        user.set("cidade", r.cidade);
        user.set("aceitou_consentimento", true);
        user.set("aceitou_termos", true);
        user.set("username", r.username);
        user.set("verified", true);
        user.setPassword(r.password);
      }

      // Keep the user record aligned too (defensive). For a newly created
      // user, the id only exists after the first save, so save first then
      // capture the id.
      user.set("papel", r.papel);
      user.set("status_cadastro", "aprovado");
      user.set("status_aprovacao", "aprovado");
      user.set("igreja_id", churchId);
      app.save(user);

      const userId = user.id;
      if (!userId) {
        throw new Error("Falha ao salvar usuário demo: " + r.email);
      }

      // Find an existing vínculo for (user, church).
      let vinculo = null;
      try {
        const existing = app.findRecordsByFilter(
          "vinculos_usuario_igreja",
          "usuario_id = '" + userId + "' && igreja_id = '" + churchId + "'",
          "created",
          1,
          0,
        );
        if (existing.length > 0) vinculo = existing[0];
      } catch (_) {}

      const novo = {
        papel: r.papel,
        status: "ativo",
        pode_aprovar_membros: true,
      };

      if (!vinculo) {
        vinculo = new Record(vinculosCol);
        vinculo.set("usuario_id", userId);
        vinculo.set("igreja_id", churchId);
        vinculo.set("papel", novo.papel);
        vinculo.set("status", novo.status);
        vinculo.set("pode_aprovar_membros", true);
        vinculo.set("responsavel_nome", r.responsavel);
        vinculo.set("motivo_alteracao", "Vínculo ativo garantido por migration demo");
        app.save(vinculo);

        // Register creation history.
        try {
          const h = new Record(historicoCol);
          h.set("vinculo_id", vinculo.id);
          h.set("usuario_id", userId);
          h.set("igreja_id", churchId);
          h.set("responsavel_nome", "Sistema");
          h.set("tipo_acao", "criacao");
          h.set("papel_anterior", "");
          h.set("papel_novo", novo.papel);
          h.set("status_anterior", "");
          h.set("status_novo", novo.status);
          h.set("pode_aprovar_anterior", false);
          h.set("pode_aprovar_novo", true);
          h.set("motivo", "Vínculo ativo garantido por migration demo");
          h.set("data_acao", new Date().toISOString().split("T")[0]);
          app.save(h);
        } catch (err) {
          app.logger().error("historico create failed", "err", String(err));
        }
      } else {
        // Promote existing vínculo to active + approval permission.
        const anterior = {
          papel: vinculo.get("papel") || "",
          status: vinculo.get("status") || "",
          pode_aprovar_membros: !!vinculo.get("pode_aprovar_membros"),
        };

        vinculo.set("papel", novo.papel);
        vinculo.set("status", novo.status);
        vinculo.set("pode_aprovar_membros", true);
        vinculo.set("motivo_alteracao", "Vínculo ativado por migration demo");
        app.save(vinculo);

        try {
          const h = new Record(historicoCol);
          h.set("vinculo_id", vinculo.id);
          h.set("usuario_id", userId);
          h.set("igreja_id", churchId);
          h.set("responsavel_nome", "Sistema");
          h.set("tipo_acao", "edicao");
          h.set("papel_anterior", anterior.papel);
          h.set("papel_novo", novo.papel);
          h.set("status_anterior", anterior.status);
          h.set("status_novo", novo.status);
          h.set("pode_aprovar_anterior", anterior.pode_aprovar_membros);
          h.set("pode_aprovar_novo", true);
          h.set("motivo", "Vínculo ativado por migration demo");
          h.set("data_acao", new Date().toISOString().split("T")[0]);
          app.save(h);
        } catch (err) {
          app.logger().error("historico update failed", "err", String(err));
        }
      }
    }
  },
  (app) => {
    // One-way demo setup; no destructive down.
  },
);
