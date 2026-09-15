/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId("users");

		// Coleção `servicos_profissionais`: permite múltiplos serviços por
		// usuário (sem índice único em usuario_id). Owner-scoped via
		// usuario_id; admins podem ver todos.
		let collection;
		try {
			collection = app.findCollectionByNameOrId(
				"servicos_profissionais",
			);
		} catch (_) {
			collection = new Collection({
				type: "base",
				name: "servicos_profissionais",
				listRule:
					"@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
				viewRule:
					"@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
				createRule:
					"@request.auth.id != '' && @request.auth.id = @request.body.usuario_id",
				updateRule:
					"@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
				deleteRule:
					"@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')",
				fields: [
					{
						name: "usuario_id",
						type: "relation",
						required: true,
						maxSelect: 1,
						collectionId: users.id,
						cascadeDelete: true,
					},
					{ name: "profissao", type: "text", required: true, max: 120 },
					{
						name: "descricao_servicos",
						type: "text",
						required: true,
						max: 2000,
					},
					{ name: "cidade", type: "text", required: true, max: 80 },
					{ name: "estado", type: "text", required: true, max: 2 },
					{
						name: "telefone_whatsapp",
						type: "text",
						required: true,
						max: 40,
					},
					{
						name: "fotos",
						type: "file",
						maxSelect: 6,
						maxSize: 5242880,
						mimeTypes: [
							"image/jpeg",
							"image/png",
							"image/webp",
						],
						thumbs: ["400x300", "800x600"],
					},
					{
						name: "status",
						type: "select",
						maxSelect: 1,
						values: ["ativo", "inativo"],
					},
					{
						name: "status_aprovacao",
						type: "select",
						maxSelect: 1,
						values: [
							"aguardando_aprovacao",
							"aprovado",
							"reprovado",
						],
					},
					{
						name: "data_cadastro",
						type: "autodate",
						onCreate: true,
						onUpdate: false,
					},
					{
						name: "data_atualizacao",
						type: "autodate",
						onCreate: true,
						onUpdate: true,
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
					"CREATE INDEX idx_servicos_profissionais_usuario ON servicos_profissionais (usuario_id)",
				],
			});
			app.save(collection);
		}
	},
	(app) => {
		try {
			app.delete(
				app.findCollectionByNameOrId("servicos_profissionais"),
			);
		} catch (e) {
			if (!e.message.includes("no rows in result set")) throw e;
		}
	},
);
