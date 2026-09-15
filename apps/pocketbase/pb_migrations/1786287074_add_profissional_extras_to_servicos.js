/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId(
			"servicos_profissionais",
		);

		// Anos de experiência (número, opcional)
		if (!collection.fields.getByName("anos_experiencia")) {
			collection.fields.add(
				new NumberField({
					name: "anos_experiencia",
					min: 0,
				}),
			);
		}

		// Certificações (array de textos livres) — armazenado como JSON
		if (!collection.fields.getByName("certificacoes")) {
			collection.fields.add(
				new JSONField({
					name: "certificacoes",
				}),
			);
		}

		// Curso técnico (sim/não)
		if (!collection.fields.getByName("curso_tecnico")) {
			collection.fields.add(
				new SelectField({
					name: "curso_tecnico",
					maxSelect: 1,
					values: ["sim", "nao"],
				}),
			);
		}

		// MEI (sim/não)
		if (!collection.fields.getByName("mei")) {
			collection.fields.add(
				new SelectField({
					name: "mei",
					maxSelect: 1,
					values: ["sim", "nao"],
				}),
			);
		}

		// Emissão de nota fiscal (sim/não)
		if (!collection.fields.getByName("emissao_nota_fiscal")) {
			collection.fields.add(
				new SelectField({
					name: "emissao_nota_fiscal",
					maxSelect: 1,
					values: ["sim", "nao"],
				}),
			);
		}

		// Materiais próprios (sim/não)
		if (!collection.fields.getByName("materiais_proprios")) {
			collection.fields.add(
				new SelectField({
					name: "materiais_proprios",
					maxSelect: 1,
					values: ["sim", "nao"],
				}),
			);
		}

		// Forma de cobrança (hora/projeto/valor_fixo/outro)
		if (!collection.fields.getByName("forma_cobranca")) {
			collection.fields.add(
				new SelectField({
					name: "forma_cobranca",
					maxSelect: 1,
					values: ["hora", "projeto", "valor_fixo", "outro"],
				}),
			);
		}

		// Forma de cobrança — descrição "outro" (texto, opcional)
		if (!collection.fields.getByName("forma_cobranca_outro")) {
			collection.fields.add(
				new TextField({
					name: "forma_cobranca_outro",
					max: 120,
				}),
			);
		}

		// Faixa de preço — valor mínimo e máximo (número, opcional)
		if (!collection.fields.getByName("preco_minimo")) {
			collection.fields.add(
				new NumberField({
					name: "preco_minimo",
					min: 0,
				}),
			);
		}
		if (!collection.fields.getByName("preco_maximo")) {
			collection.fields.add(
				new NumberField({
					name: "preco_maximo",
					min: 0,
				}),
			);
		}

		// Formas de pagamento (múltipla seleção)
		if (!collection.fields.getByName("formas_pagamento")) {
			collection.fields.add(
				new SelectField({
					name: "formas_pagamento",
					maxSelect: 5,
					values: [
						"pix",
						"cartao_credito",
						"cartao_debito",
						"dinheiro",
						"transferencia",
					],
				}),
			);
		}

		// Parcelamento (sim/não)
		if (!collection.fields.getByName("parcelamento")) {
			collection.fields.add(
				new SelectField({
					name: "parcelamento",
					maxSelect: 1,
					values: ["sim", "nao"],
				}),
			);
		}

		// Número máximo de parcelas (número, opcional)
		if (!collection.fields.getByName("parcelas_maximas")) {
			collection.fields.add(
				new NumberField({
					name: "parcelas_maximas",
					min: 0,
				}),
			);
		}

		// Orçamento gratuito (sim/não)
		if (!collection.fields.getByName("orcamento_gratuito")) {
			collection.fields.add(
				new SelectField({
					name: "orcamento_gratuito",
					maxSelect: 1,
					values: ["sim", "nao"],
				}),
			);
		}

		// Desconto para membros da igreja (sim/não)
		if (!collection.fields.getByName("desconto_membros_igreja")) {
			collection.fields.add(
				new SelectField({
					name: "desconto_membros_igreja",
					maxSelect: 1,
					values: ["sim", "nao"],
				}),
			);
		}

		// Percentual de desconto (número, opcional)
		if (!collection.fields.getByName("percentual_desconto")) {
			collection.fields.add(
				new NumberField({
					name: "percentual_desconto",
					min: 0,
					max: 100,
				}),
			);
		}

		// Diferenciais (múltipla seleção)
		if (!collection.fields.getByName("diferenciais")) {
			collection.fields.add(
				new SelectField({
					name: "diferenciais",
					maxSelect: 6,
					values: [
						"idosos",
						"criancas",
						"eventos_igreja",
						"libras",
						"acessibilidade",
						"trabalho_equipe",
					],
				}),
			);
		}

		app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId(
			"servicos_profissionais",
		);
		const campos = [
			"anos_experiencia",
			"certificacoes",
			"curso_tecnico",
			"mei",
			"emissao_nota_fiscal",
			"materiais_proprios",
			"forma_cobranca",
			"forma_cobranca_outro",
			"preco_minimo",
			"preco_maximo",
			"formas_pagamento",
			"parcelamento",
			"parcelas_maximas",
			"orcamento_gratuito",
			"desconto_membros_igreja",
			"percentual_desconto",
			"diferenciais",
		];
		campos.forEach((c) => {
			try {
				collection.fields.removeByName(c);
			} catch (_) {
				/* campo já não existe */
			}
		});
		app.save(collection);
	},
);
