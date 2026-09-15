// Adiciona os campos dataNascimento (date) e estadoCivil (select) à coleção
// `users` para a integração com o aplicativo "Corações Conectados".
//
// Ambos os campos são obrigatórios conforme solicitado. Não altera nenhum
// campo existente — apenas adiciona os dois novos.
/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("users");

    // dataNascimento — tipo date, obrigatório.
    if (!collection.fields.getByName("dataNascimento")) {
      collection.fields.add(
        new DateField({
          name: "dataNascimento",
          required: true,
        }),
      );
    }

    // estadoCivil — tipo select (seleção única), obrigatório.
    // Opções exatamente nesta ordem:
    //   Solteiro, Casado, Separado, Divorciado, Viúvo, União estável
    if (!collection.fields.getByName("estadoCivil")) {
      collection.fields.add(
        new SelectField({
          name: "estadoCivil",
          required: true,
          maxSelect: 1,
          values: [
            "Solteiro",
            "Casado",
            "Separado",
            "Divorciado",
            "Viúvo",
            "União estável",
          ],
        }),
      );
    }

    app.save(collection);
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("users");
      collection.fields.removeByName("dataNascimento");
      collection.fields.removeByName("estadoCivil");
      app.save(collection);
    } catch (e) {
      if (e.message.includes("no rows in result set")) {
        console.log("Coleção users não encontrada, ignorando revert");
        return;
      }
      throw e;
    }
  },
);
