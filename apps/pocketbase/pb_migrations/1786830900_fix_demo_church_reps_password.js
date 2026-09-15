/// <reference path="../pb_data/types.d.ts" />

// Fix the demo church representative accounts.
//
// The original seed migration (1786379774_seed_demo_church_reps.js) set the
// auth password with `record.set("password", plaintext)` instead of
// `record.setPassword(plaintext)`. In the PocketBase JSVM, `set("password")`
// does NOT bcrypt-hash the value the way the auth pipeline expects, so
// `validatePassword` always returned false and login failed with
// "invalid login credentials" even though the user existed and the typed
// password was correct.
//
// This forward migration re-seeds / repairs both demo reps using the correct
// `setPassword()` method, re-asserts their approved status, and ensures their
// `igreja_id` relation points to a real church (or is cleared if none exists),
// fixing the "Failed to find all relation records" save error that occurred
// when the previously-stored church id no longer resolved.
//
// Idempotent: updates existing records or creates them if missing.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // users.igreja_id is a relation to the `empresas` collection (churches are
    // stored there with tipo = 'igreja'), NOT to the legacy `igrejas`
    // collection. Resolve a valid church record in `empresas`, creating one if
    // necessary. We do NOT swallow errors here — if this fails, the migration
    // must fail loudly so the cause is visible.
    let churchId = "";
    const empresasCol = app.findCollectionByNameOrId("empresas");
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

    const reps = [
      {
        name: "Pastor Demo",
        email: "pastor.demo@conexaobatista.com.br",
        password: "PastorDemo123!",
        whatsapp: "(11) 99999-0001",
        sexo: "masculino",
        cidade: "São Paulo",
        papel: "pastor",
        username: "pastor_demo",
      },
      {
        name: "Secretário Demo",
        email: "secretario.demo@conexaobatista.com.br",
        password: "SecretarioDemo123!",
        whatsapp: "(11) 99999-0002",
        sexo: "feminino",
        cidade: "São Paulo",
        papel: "secretario",
        username: "secretario_demo",
      },
    ];

    for (const r of reps) {
      let rec = null;
      try {
        const found = app.findRecordsByFilter("users", "email = {:e}", "", 1, 0, { e: r.email });
        if (found.length > 0) rec = found[0];
      } catch (_) {}

      if (!rec) {
        rec = new Record(users);
        rec.set("email", r.email);
        rec.set("name", r.name);
        rec.set("whatsapp", r.whatsapp);
        rec.set("sexo", r.sexo);
        rec.set("cidade", r.cidade);
        rec.set("aceitou_consentimento", true);
        rec.set("aceitou_termos", true);
      }

      // Always (re)set the password with the proper hashing method.
      rec.setPassword(r.password);

      // Re-assert approved status, role, verification, and a valid church link.
      rec.set("papel", r.papel);
      rec.set("status_cadastro", "aprovado");
      rec.set("status_aprovacao", "aprovado");
      rec.set("verified", true);
      // Always explicitly set igreja_id to a known-valid id so any dangling
      // reference from a previous (broken) seed is replaced.
      rec.set("igreja_id", churchId);

      // Set username only if empty (avoid clobbering a user-chosen one).
      try {
        const currentUsername = rec.get("username") || "";
        if (!currentUsername) rec.set("username", r.username);
      } catch (_) {}

      app.save(rec);
    }
  },
  (app) => {
    // No destructive down — the original seed migration owns creation/removal.
  },
);
