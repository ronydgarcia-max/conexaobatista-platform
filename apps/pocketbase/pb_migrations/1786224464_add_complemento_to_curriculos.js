/// <reference path="../pb_data/types.d.ts" />

// Adiciona os campos "complemento" e "bairro" à coleção curriculos.
// complemento: complemento de endereço (apartamento, bloco, sala, etc.).
// bairro: bairro retornado pela consulta ViaCEP. Ambos opcionais e
// protegidos junto aos demais dados privados de endereço.

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("curriculos");

    if (!collection.fields.getByName("complemento")) {
      collection.fields.add(
        new TextField({
          name: "complemento",
          max: 160,
        }),
      );
    }

    if (!collection.fields.getByName("bairro")) {
      collection.fields.add(
        new TextField({
          name: "bairro",
          max: 120,
        }),
      );
    }

    app.save(collection);
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("curriculos");
      collection.fields.removeByName("complemento");
      collection.fields.removeByName("bairro");
      app.save(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) {
        console.log("Collection not found, skipping revert");
        return;
      }
      throw e;
    }
  },
);
