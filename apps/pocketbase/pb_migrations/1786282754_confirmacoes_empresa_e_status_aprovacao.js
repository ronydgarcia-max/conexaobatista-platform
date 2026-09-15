/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId("users");

		// 1) Adiciona o campo `status_aprovacao` à coleção `empresas` existente.
		const empresas = app.findCollectionByNameOrId("empresas");
		if (!empresas.fields.getByName("status_aprovacao")) {
			empresas.fields.add(
				new SelectField({
					name: "status_aprovacao",
					maxSelect: 1,
					values: [
						"aguardando_aprovacao",
						"aprovado",
						"reprovado",
					],
				}),
			);
		}
		app.save(empresas);

		// 2) Cria a coleção `confirmacoes_empresa` para registrar a declaração
		//    de integridade (usuário, CNPJ, data/hora, versão e texto do termo,
		//    hash SHA-256). Owner-scoped via usuario_id.
		let confirmacoes;
		try {
			confirmacoes = app.findCollectionByNameOrId(
				"confirmacoes_empresa",
			);
		} catch (_) {
			confirmacoes = new Collection({
				type: "base",
				name: "confirmacoes_empresa",
				listRule:
					"@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
				viewRule:
					"@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
				createRule:
					"@request.auth.id != '' && @request.auth.id = @request.body.usuario_id",
				updateRule:
					"@request.auth.id != '' && usuario_id = @request.auth.id",
				deleteRule: null,
				fields: [
					{
						name: "usuario_id",
						type: "relation",
						required: true,
						maxSelect: 1,
						collectionId: users.id,
						cascadeDelete: true,
					},
					{ name: "cnpj", type: "text", required: true, max: 18 },
					{
						name: "data_hora",
						type: "date",
						required: true,
					},
					{
						name: "versao_termo",
						type: "text",
						required: true,
						max: 20,
					},
					{
						name: "texto_termo",
						type: "text",
						required: true,
						max: 2000,
					},
					{
						name: "hash_sha256",
						type: "text",
						required: true,
						max: 64,
					},
					{
						name: "created",
						type: "autodate",
						onCreate: true,
						onUpdate: false,
					},
					{
						name: "updated",
						type: "autodate",
						onCreate: true,
						onUpdate: true,
					},
				],
				indexes: [
					"CREATE INDEX idx_confirmacoes_empresa_usuario ON confirmacoes_empresa (usuario_id)",
					"CREATE INDEX idx_confirmacoes_empresa_cnpj ON confirmacoes_empresa (cnpj)",
				],
			});
			app.save(confirmacoes);
		}
	},
	(app) => {
		// Reverte: remove o campo adicionado e exclui a coleção nova.
		try {
			const empresas = app.findCollectionByNameOrId("empresas");
			empresas.fields.removeByName("status_aprovacao");
			app.save(empresas);
		} catch (e) {
			if (!e.message.includes("no rows in result set")) throw e;
		}

		try {
			app.delete(app.findCollectionByNameOrId("confirmacoes_empresa"));
		} catch (e) {
			if (!e.message.includes("no rows in result set")) throw e;
		}
	},
);
