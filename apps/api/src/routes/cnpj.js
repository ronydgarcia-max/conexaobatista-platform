// Consulta de CNPJ via BrasilAPI (proxy server-side para não expor chamadas
// externas no navegador). O frontend chama /cnpj/:cnpj através do apiServerClient.
export default async (req, res) => {
	const { cnpj } = req.params;

	// Validação de entrada: apenas dígitos, 14 posições.
	const digits = (cnpj || "").replace(/\D/g, "");
	if (!digits || digits.length !== 14) {
		return res.status(422).json({
			error: "CNPJ inválido",
			code: "invalid_format",
		});
	}

	const upstream = await fetch(
		`https://brasilapi.com.br/api/cnpj/v1/${digits}`,
		{
			headers: {
				Accept: "application/json",
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
			},
		},
	);

	// BrasilAPI retorna 404 quando o CNPJ não existe; 502/503 em indisponibilidade.
	if (upstream.status === 404) {
		return res.status(404).json({
			error: "CNPJ não encontrado na base da Receita Federal.",
			code: "not_found",
		});
	}

	if (!upstream.ok) {
		throw new Error(
			`brasilapi cnpj failed: ${upstream.status} ${upstream.statusText}`,
		);
	}

	const data = await upstream.json();
	res.json(data);
};
