// Endpoint PÚBLICO que retorna a lista canônica de categorias dos cursos.
//
// O frontend (área pública /cursos) chama esta rota para montar o filtro de
// categorias dinamicamente, em vez de usar categorias fixas no código. Assim
// o site e o backend permanecem alinhados pela mesma fonte de verdade
// (apps/api/src/utils/categorias.js).
//
// Rota pública (sem autenticação): GET /categorias

import { CATEGORIAS } from "../utils/categorias.js";

export default (req, res) => {
  return res.status(200).json({ categorias: CATEGORIAS });
};
