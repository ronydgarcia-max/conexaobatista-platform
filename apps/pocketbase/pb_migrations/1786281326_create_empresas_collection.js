/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId("users");

		const collection = new Collection({
			type: "base",
			name: "empresas",
			// Owner-scoped (via usuario_id); admins podem ver todas.
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
				{ name: "cnpj", type: "text", max: 18 },
				{ name: "razao_social", type: "text", max: 200 },
				{ name: "nome_fantasia", type: "text", max: 200 },
				{ name: "tipo_empresa", type: "text", max: 120 },
				{ name: "data_abertura", type: "date" },
				{ name: "situacao_cadastral", type: "text", max: 60 },
				{ name: "logradouro", type: "text", max: 160 },
				{ name: "numero", type: "text", max: 20 },
				{ name: "complemento", type: "text", max: 160 },
				{ name: "bairro", type: "text", max: 120 },
				{ name: "cidade", type: "text", max: 80 },
				{ name: "estado", type: "text", max: 2 },
				{ name: "cep", type: "text", max: 12 },
				{ name: "telefone", type: "text", max: 40 },
				{ name: "email", type: "email" },
				{ name: "website", type: "url" },
				{ name: "descricao", type: "text", max: 2000 },
				{ name: "ramo_atividade", type: "text", max: 160 },
				{ name: "numero_funcionarios", type: "text", max: 60 },
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
					name: "status",
					type: "select",
					maxSelect: 1,
					values: ["rascunho", "publicado", "pausado", "excluido"],
				},
				{
					name: "visibilidade_perfil",
					type: "select",
					maxSelect: 1,
					values: ["publico", "membros", "privado"],
				},
			],
			indexes: [
				"CREATE UNIQUE INDEX idx_empresas_usuario_id ON empresas (usuario_id)",
			],
		});
		app.save(collection);
	},
	(app) => {
		try {
			app.delete(app.findCollectionByNameOrId("empresas"));
		} catch (e) {
			if (!e.message.includes("no rows in result set")) throw e;
		}
	},
);
