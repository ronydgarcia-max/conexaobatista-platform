/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId("users");
		users.createRule = "";
		app.save(users);

		let contatos;
		try {
			contatos = app.findCollectionByNameOrId("contatos");
		} catch (_) {
			contatos = new Collection({
				type: "base",
				name: "contatos",
				listRule: null,
				viewRule: null,
				createRule: "",
				updateRule: null,
				deleteRule: null,
				fields: [
					{ name: "nome", type: "text", required: true, max: 120 },
					{ name: "email", type: "email", required: true },
					{ name: "telefone", type: "text", max: 40 },
					{ name: "igreja", type: "text", max: 160 },
					{ name: "assunto", type: "text", max: 160 },
					{ name: "mensagem", type: "text", required: true, max: 3000 },
					{ name: "origem", type: "text", max: 60 },
					{ name: "created", type: "autodate", onCreate: true, onUpdate: false },
					{ name: "updated", type: "autodate", onCreate: true, onUpdate: true },
				],
			});
			app.save(contatos);
		}
	},
	(app) => {
		try {
			app.delete(app.findCollectionByNameOrId("contatos"));
		} catch (e) {
			if (!e.message.includes("no rows in result set")) throw e;
		}
	},
);
