/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId(
			"servicos_profissionais",
		);

		// Tipos de atendimento (múltipla seleção)
		if (!collection.fields.getByName("tipos_atendimento")) {
			collection.fields.add(
				new SelectField({
					name: "tipos_atendimento",
					maxSelect: 5,
					values: [
						"estabelecimento",
						"domicilio",
						"online",
						"hora_marcada",
						"ordem_chegada",
					],
				}),
			);
		}

		// Serviço de leva e traz (sim/não)
		if (!collection.fields.getByName("leva_traz")) {
			collection.fields.add(
				new SelectField({
					name: "leva_traz",
					maxSelect: 1,
					values: ["sim", "nao"],
				}),
			);
		}

		// Distância máxima em km (opcional, só quando leva_traz = sim)
		if (!collection.fields.getByName("distancia_maxima_km")) {
			collection.fields.add(
				new NumberField({
					name: "distancia_maxima_km",
					min: 0,
				}),
			);
		}

		// Horários por dia da semana (segunda a domingo)
		const dias = [
			"segunda",
			"terca",
			"quarta",
			"quinta",
			"sexta",
			"sabado",
			"domingo",
		];
		dias.forEach((dia) => {
			const inicio = `horario_${dia}_inicio`;
			const fim = `horario_${dia}_fim`;
			if (!collection.fields.getByName(inicio)) {
				collection.fields.add(
					new TextField({ name: inicio, max: 5 }),
				);
			}
			if (!collection.fields.getByName(fim)) {
				collection.fields.add(
					new TextField({ name: fim, max: 5 }),
				);
			}
		});

		// Feriados e emergências
		if (!collection.fields.getByName("atende_feriados")) {
			collection.fields.add(
				new SelectField({
					name: "atende_feriados",
					maxSelect: 1,
					values: ["sim", "nao"],
				}),
			);
		}
		if (!collection.fields.getByName("atende_emergencias")) {
			collection.fields.add(
				new SelectField({
					name: "atende_emergencias",
					maxSelect: 1,
					values: ["sim", "nao"],
				}),
			);
		}
		if (!collection.fields.getByName("horario_emergencia_inicio")) {
			collection.fields.add(
				new TextField({
					name: "horario_emergencia_inicio",
					max: 5,
				}),
			);
		}
		if (!collection.fields.getByName("horario_emergencia_fim")) {
			collection.fields.add(
				new TextField({ name: "horario_emergencia_fim", max: 5 }),
			);
		}

		app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId(
			"servicos_profissionais",
		);
		const campos = [
			"tipos_atendimento",
			"leva_traz",
			"distancia_maxima_km",
			"horario_segunda_inicio",
			"horario_segunda_fim",
			"horario_terca_inicio",
			"horario_terca_fim",
			"horario_quarta_inicio",
			"horario_quarta_fim",
			"horario_quinta_inicio",
			"horario_quinta_fim",
			"horario_sexta_inicio",
			"horario_sexta_fim",
			"horario_sabado_inicio",
			"horario_sabado_fim",
			"horario_domingo_inicio",
			"horario_domingo_fim",
			"atende_feriados",
			"atende_emergencias",
			"horario_emergencia_inicio",
			"horario_emergencia_fim",
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
