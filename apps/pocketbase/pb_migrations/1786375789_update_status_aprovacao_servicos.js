/// <reference path="../pb_data/types.d.ts" />

// Atualiza o campo `status_aprovacao` da coleção `servicos_profissionais`
// para o novo fluxo de análise administrativa:
//   aguardando_analise, aprovado, nao_aprovado, suspenso
// Migra os valores antigos (aguardando_aprovacao -> aguardando_analise,
// reprovado -> nao_aprovado) antes de trocar as opções do select.

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("servicos_profissionais");

    // 1) Migra os dados existentes para os novos valores (antes de
    //    restringir o select, para não deixar linhas inválidas).
    const db = app.db();
    db.newQuery(
      "UPDATE servicos_profissionais SET status_aprovacao = 'aguardando_analise' WHERE status_aprovacao = 'aguardando_aprovacao'",
    ).execute();
    db.newQuery(
      "UPDATE servicos_profissionais SET status_aprovacao = 'nao_aprovado' WHERE status_aprovacao = 'reprovado'",
    ).execute();

    // 2) Atualiza as opções do select.
    const field = collection.fields.getByName("status_aprovacao");
    field.values = [
      "aguardando_analise",
      "aprovado",
      "nao_aprovado",
      "suspenso",
    ];
    app.save(collection);
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("servicos_profissionais");
      const field = collection.fields.getByName("status_aprovacao");
      field.values = ["aguardando_aprovacao", "aprovado", "reprovado"];
      app.save(collection);

      const db = app.db();
      db.newQuery(
        "UPDATE servicos_profissionais SET status_aprovacao = 'aguardando_aprovacao' WHERE status_aprovacao = 'aguardando_analise'",
      ).execute();
      db.newQuery(
        "UPDATE servicos_profissionais SET status_aprovacao = 'reprovado' WHERE status_aprovacao = 'nao_aprovado'",
      ).execute();
    } catch (e) {
      if (e.message.includes("no rows in result set")) {
        console.log("Collection not found, skipping revert");
        return;
      }
      throw e;
    }
  },
);
