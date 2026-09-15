// Proxy PÚBLICO de listagem de cursos publicados para a API externa de cursos
// (VPS — projeto cursos-api).
//
// O site Conexão Batista é servido em HTTPS, enquanto a API de cursos roda em
// HTTP (http://69.62.124.240:3333). Chamadas fetch diretas do navegador para
// um endpoint HTTP a partir de uma página HTTPS são bloqueadas como "mixed
// content". Por isso esta rota recebe a requisição do frontend (mesma origem,
// via /hcgi/api) e repassa ao backend de cursos, onde não há restrição de
// mixed content.
//
// A API externa GET /cursos já retorna apenas cursos com status='publicado'.
// Aqui additionally:
//   - normalizamos nomes antigos de categoria para os canônicos
//     (CATEGORIA_LEGACY_MAP), alinhando o site imediatamente;
//   - filtramos por status='publicado' (defesa em profundidade);
//   - aplicamos o filtro opcional ?categoria=<nome canônico>.
//
// Rota pública (sem autenticação): GET /cursos-publicados[?categoria=...]

import logger from "../utils/logger.js";
import { normalizarCategoria } from "../utils/categorias.js";

// A API externa de cursos (VPS) expõe o endpoint público de listagem em
// https://api.conexaobatista.com.br/cursos (mesma base usada pelos proxies
// de moderação/mentor-status, que já funcionam em produção). O raw HTTP
// (69.62.124.240:3333) não é alcançável a partir do processo Express do
// sandbox, por isso usamos a base HTTPS administrativa. O endpoint público
// /cursos não exige o segredo, mas enviamos o header quando disponível
// (inócuo e consistente com os demais proxies).
const CURSOS_PUBLICOS_URL = (
  process.env.CURSOS_ADMIN_API_URL || "https://api.conexaobatista.com.br"
).replace(/\/+$/, "");
const BRIDGE_SECRET = process.env.CURSOS_API_BRIDGE_SECRET;

async function lerUpstream(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text || null;
  }
  return data;
}

export default async (req, res) => {
  const categoria = req.query.categoria || "";

  const headers = {};
  if (BRIDGE_SECRET) {
    headers["x-bridge-secret"] = BRIDGE_SECRET;
  }

  const upstream = await fetch(`${CURSOS_PUBLICOS_URL}/cursos`, { headers });

  if (!upstream.ok) {
    throw new Error(
      `cursos-publicados falhou: ${upstream.status} ${upstream.statusText}`,
    );
  }

  const data = await lerUpstream(upstream);
  const lista = Array.isArray(data) ? data : data?.cursos || [];

  const cursos = lista
    .filter((c) => c && c.status === "publicado")
    .map((c) => ({ ...c, categoria: normalizarCategoria(c.categoria) }))
    .filter((c) => !categoria || c.categoria === categoria);

  logger.info(
    `[cursos-publicados] Listagem pública solicitada — ${cursos.length} curso(s) publicado(s)` +
      (categoria ? ` (filtro categoria="${categoria}")` : ""),
  );

  return res.status(200).json({ cursos });
};
