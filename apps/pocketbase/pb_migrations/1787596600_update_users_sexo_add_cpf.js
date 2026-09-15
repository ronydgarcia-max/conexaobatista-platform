/// <reference path="../pb_data/types.d.ts" />

// Ajustes no cadastro de usuário (Conexão Batista):
//
// 1. Campo `sexo` (select): remove a opção "outro" e adiciona
//    "prefiro_nao_informar". Opções finais:
//      masculino, feminino, prefiro_nao_informar
//    Registros existentes com sexo='outro' são migrados para
//    'prefiro_nao_informar' (backfill).
//
// 2. Campo `cpf` (text, opcional no banco): adiciona o campo CPF ao cadastro.
//    A validação do dígito verificador (módulo 11) é feita no frontend; o
//    campo é opcional no banco para não quebrar usuários já cadastrados.
//
// Não altera outros campos existentes.

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("users");

    // 1. Atualiza as opções do select `sexo`.
    const sexoField = collection.fields.getByName("sexo");
    sexoField.values = ["masculino", "feminino", "prefiro_nao_informar"];

    // 2. Adiciona o campo `cpf` (text, max 14, não obrigatório no banco).
    if (!collection.fields.getByName("cpf")) {
      collection.fields.add(
        new TextField({
          name: "cpf",
          required: false,
          max: 14,
        }),
      );
    }

    app.save(collection);

    // Backfill: migra registros existentes com sexo='outro' para
    // 'prefiro_nao_informar' (a opção 'outro' foi removida do select).
    let atualizados = 0;
    try {
      const registros = app.findRecordsByFilter("users", "sexo = 'outro'");
      for (const r of registros) {
        r.set("sexo", "prefiro_nao_informar");
        app.save(r);
        atualizados++;
      }
    } catch (e) {
      // Se não houver registros com sexo='outro', findRecordsByFilter pode
      // retornar vazio — não há nada a fazer. Log apenas para diagnóstico.
      console.log("[migracao sexo] backfill: " + (e && e.message ? e.message : e));
    }
    console.log("[migracao sexo] registros atualizados: " + atualizados);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("users");

    // Reverte as opções do select `sexo` para o estado anterior.
    const sexoField = collection.fields.getByName("sexo");
    sexoField.values = ["masculino", "feminino", "outro"];

    // Remove o campo `cpf`.
    try {
      collection.fields.removeByName("cpf");
    } catch (e) {
      // já removido — ignora
    }

    app.save(collection);
  },
);
