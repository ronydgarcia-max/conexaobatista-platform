/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // Find the first church to link the demo reps to.
    let churchId = "";
    try {
      const churches = app.findRecordsByFilter("igrejas", "id != ''", "created", 1, 0);
      if (churches.length > 0) churchId = churches[0].id;
    } catch (_) {}

    if (!churchId) return; // no church to link to — nothing to seed

    // --- Demo Pastor ---
    let pastorExists = false;
    try {
      const found = app.findRecordsByFilter("users", "email = 'pastor.demo@conexaobatista.com.br'", "", 1, 0);
      pastorExists = found.length > 0;
    } catch (_) {}

    if (!pastorExists) {
      const pastor = new Record(users);
      pastor.set("name", "Pastor Demo");
      pastor.set("email", "pastor.demo@conexaobatista.com.br");
      pastor.set("password", "PastorDemo123!");
      pastor.set("whatsapp", "(11) 99999-0001");
      pastor.set("sexo", "masculino");
      pastor.set("cidade", "São Paulo");
      pastor.set("papel", "pastor");
      pastor.set("igreja_id", churchId);
      pastor.set("status_cadastro", "aprovado");
      pastor.set("status_aprovacao", "aprovado");
      pastor.set("aceitou_consentimento", true);
      pastor.set("aceitou_termos", true);
      pastor.set("verified", true);
      app.save(pastor);
    }

    // --- Demo Secretário ---
    let secExists = false;
    try {
      const found = app.findRecordsByFilter("users", "email = 'secretario.demo@conexaobatista.com.br'", "", 1, 0);
      secExists = found.length > 0;
    } catch (_) {}

    if (!secExists) {
      const sec = new Record(users);
      sec.set("name", "Secretário Demo");
      sec.set("email", "secretario.demo@conexaobatista.com.br");
      sec.set("password", "SecretarioDemo123!");
      sec.set("whatsapp", "(11) 99999-0002");
      sec.set("sexo", "feminino");
      sec.set("cidade", "São Paulo");
      sec.set("papel", "secretario");
      sec.set("igreja_id", churchId);
      sec.set("status_cadastro", "aprovado");
      sec.set("status_aprovacao", "aprovado");
      sec.set("aceitou_consentimento", true);
      sec.set("aceitou_termos", true);
      sec.set("verified", true);
      app.save(sec);
    }
  },
  (app) => {
    try {
      const pastors = app.findRecordsByFilter("users", "email = 'pastor.demo@conexaobatista.com.br'", "", 1, 0);
      for (const r of pastors) app.delete(r);
    } catch (_) {}
    try {
      const secs = app.findRecordsByFilter("users", "email = 'secretario.demo@conexaobatista.com.br'", "", 1, 0);
      for (const r of secs) app.delete(r);
    } catch (_) {}
  },
);
