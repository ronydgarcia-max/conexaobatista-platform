/// <reference path="../pb_data/types.d.ts" />

// Adiciona suporte a cadastros de Igreja na mesma coleção `empresas`:
//  - campo `tipo` (empresa | igreja) para diferenciar e filtrar
//  - campo `visibilidade` (publico | privado | oculto) — controle de exposição
//    nas áreas públicas do portal (apenas "publico" aparece publicamente)
//  - campos específicos de igreja provenientes da BrasilAPI (CNAE principal,
//    CNAEs secundários, natureza jurídica, QSA) e o cargo do representante
//  - campo `fonte_dados` para identificar a origem dos dados (ex.: BrasilAPI)
//  - amplia os valores de `status_aprovacao` com nao_aprovado e suspenso
//  - cria a coleção `acoes_empresas` (auditoria de aprovações/rejeições)
migrate(
	(app) => {
		const users = app.findCollectionByNameOrId("users");
		const admins = app.findCollectionByNameOrId("admins");

		const empresas = app.findCollectionByNameOrId("empresas");

		// 1) tipo: empresa | igreja
		if (!empresas.fields.getByName("tipo")) {
			empresas.fields.add(
				new SelectField({
					name: "tipo",
					maxSelect: 1,
					values: ["empresa", "igreja"],
				}),
			);
		}

		// 2) visibilidade: publico | privado | oculto
		if (!empresas.fields.getByName("visibilidade")) {
			empresas.fields.add(
				new SelectField({
					name: "visibilidade",
					maxSelect: 1,
					values: ["publico", "privado", "oculto"],
				}),
			);
		}

		// 3) Campos específicos de igreja (origem BrasilAPI / Receita Federal)
		if (!empresas.fields.getByName("cnae_principal_codigo")) {
			empresas.fields.add(
				new TextField({
					name: "cnae_principal_codigo",
					max: 20,
				}),
			);
		}
		if (!empresas.fields.getByName("cnae_principal_descricao")) {
			empresas.fields.add(
				new TextField({
					name: "cnae_principal_descricao",
					max: 300,
				}),
			);
		}
		if (!empresas.fields.getByName("cnaes_secundarios")) {
			empresas.fields.add(
				new JSONField({
					name: "cnaes_secundarios",
				}),
			);
		}
		if (!empresas.fields.getByName("natureza_juridica_codigo")) {
			empresas.fields.add(
				new TextField({
					name: "natureza_juridica_codigo",
					max: 20,
				}),
			);
		}
		if (!empresas.fields.getByName("natureza_juridica_descricao")) {
			empresas.fields.add(
				new TextField({
					name: "natureza_juridica_descricao",
					max: 200,
				}),
			);
		}
		if (!empresas.fields.getByName("qsa")) {
			empresas.fields.add(
				new JSONField({
					name: "qsa",
				}),
			);
		}
		if (!empresas.fields.getByName("cargo_representante")) {
			empresas.fields.add(
				new TextField({
					name: "cargo_representante",
					max: 80,
				}),
			);
		}
		if (!empresas.fields.getByName("fonte_dados")) {
			empresas.fields.add(
				new TextField({
					name: "fonte_dados",
					max: 60,
				}),
			);
		}

		// 4) Amplia os valores de status_aprovacao (preserva reprovado existente)
		const statusField = empresas.fields.getByName("status_aprovacao");
		if (statusField) {
			statusField.values = [
				"aguardando_aprovacao",
				"aprovado",
				"nao_aprovado",
				"suspenso",
				"reprovado",
			];
		}

		app.save(empresas);

		// 5) Coleção de auditoria `acoes_empresas`
		let acoes;
		try {
			acoes = app.findCollectionByNameOrId("acoes_empresas");
		} catch (_) {
			acoes = new Collection({
				type: "base",
				name: "acoes_empresas",
				listRule: "@request.auth.collectionName = 'admins'",
				viewRule: "@request.auth.collectionName = 'admins'",
				createRule: "@request.auth.collectionName = 'admins'",
				updateRule: null,
				deleteRule: null,
				fields: [
					{
						name: "empresa_id",
						type: "relation",
						required: true,
						maxSelect: 1,
						collectionId: empresas.id,
						cascadeDelete: true,
					},
					{
						name: "usuario_admin_id",
						type: "relation",
						required: true,
						maxSelect: 1,
						collectionId: admins.id,
						cascadeDelete: true,
					},
					{ name: "data_acao", type: "date", required: true },
					{ name: "status_anterior", type: "text", max: 60 },
					{ name: "status_novo", type: "text", required: true, max: 60 },
					{ name: "justificativa", type: "text", max: 1000 },
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
					"CREATE INDEX idx_acoes_empresas_empresa ON acoes_empresas (empresa_id)",
					"CREATE INDEX idx_acoes_empresas_admin ON acoes_empresas (usuario_admin_id)",
				],
			});
			app.save(acoes);
		}
	},
	(app) => {
		try {
			const empresas = app.findCollectionByNameOrId("empresas");
			[
				"tipo",
				"visibilidade",
				"cnae_principal_codigo",
				"cnae_principal_descricao",
				"cnaes_secundarios",
				"natureza_juridica_codigo",
				"natureza_juridica_descricao",
				"qsa",
				"cargo_representante",
				"fonte_dados",
			].forEach((nome) => {
				try {
					empresas.fields.removeByName(nome);
				} catch (_) {
					/* campo já ausente */
				}
			});
			const statusField = empresas.fields.getByName("status_aprovacao");
			if (statusField) {
				statusField.values = [
					"aguardando_aprovacao",
					"aprovado",
					"reprovado",
				];
			}
			app.save(empresas);
		} catch (e) {
			if (!e.message.includes("no rows in result set")) throw e;
		}

		try {
			app.delete(app.findCollectionByNameOrId("acoes_empresas"));
		} catch (e) {
			if (!e.message.includes("no rows in result set")) throw e;
		}
	},
);
