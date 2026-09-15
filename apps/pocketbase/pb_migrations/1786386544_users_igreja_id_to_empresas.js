/// <reference path="../pb_data/types.d.ts" />

// Repontua o vínculo de usuários com igreja para a coleção `empresas`
// (tipo = 'igreja'), em vez da coleção separada `igrejas`.
//
// O PocketBase não permite alterar a coleção de destino de uma relação
// existente em um único save. Por isso removemos o campo, persistimos a
// remoção e só então adicionamos um novo campo `igreja_id` apontando para
// `empresas`. Os valores antigos são perdidos; plantamos uma igreja demo em
// `empresas` e religamos os representantes demo a ela.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const empresas = app.findCollectionByNameOrId("empresas");

    // As regras atuais referenciam `igreja_id`. Para poder remover o campo
    // precisamos simplificar as regras primeiro (senão a validação falha com
    // "unknown field igreja_id").
    const simpleRule =
      "id = @request.auth.id || @request.auth.collectionName = 'admins'";
    users.listRule = simpleRule;
    users.viewRule = simpleRule;
    users.updateRule = simpleRule;

    // 1) Remove o campo antigo e persiste a remoção.
    try {
      users.fields.removeByName("igreja_id");
    } catch (_) {}
    app.save(users);

    // 2) Recria o campo apontando para `empresas` e restaura as regras que
    //    filtram por igreja (agora válidas novamente).
    users.fields.add(
      new RelationField({
        name: "igreja_id",
        maxSelect: 1,
        collectionId: empresas.id,
        cascadeDelete: false,
      }),
    );
    const churchRepRule =
      "id = @request.auth.id || @request.auth.collectionName = 'admins' || ((@request.auth.papel = 'pastor' || @request.auth.papel = 'secretario') && igreja_id = @request.auth.igreja_id)";
    users.listRule = churchRepRule;
    users.viewRule = churchRepRule;
    users.updateRule = churchRepRule;
    app.save(users);

    // Planta uma igreja demo em `empresas` (tipo = igreja) se ainda não existir
    let churchId = "";
    try {
      const existing = app.findRecordsByFilter(
        "empresas",
        "tipo = 'igreja'",
        "created",
        1,
        0,
      );
      if (existing.length > 0) churchId = existing[0].id;
    } catch (_) {}

    if (!churchId) {
      const rec = new Record(empresas);
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

    // Religa os representantes demo à igreja em `empresas`
    const demoEmails = [
      "pastor.demo@conexaobatista.com.br",
      "secretario.demo@conexaobatista.com.br",
    ];
    for (const email of demoEmails) {
      try {
        const found = app.findRecordsByFilter(
          "users",
          "email = {:email}",
          "",
          1,
          0,
          { email },
        );
        if (found.length > 0) {
          const u = found[0];
          u.set("igreja_id", churchId);
          app.save(u);
        }
      } catch (_) {}
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    let igrejas;
    try {
      igrejas = app.findCollectionByNameOrId("igrejas");
    } catch (_) {
      return;
    }
    try {
      users.fields.removeByName("igreja_id");
    } catch (_) {}
    app.save(users);
    users.fields.add(
      new RelationField({
        name: "igreja_id",
        maxSelect: 1,
        collectionId: igrejas.id,
        cascadeDelete: false,
      }),
    );
    app.save(users);
  },
);
