/// <reference path="../pb_data/types.d.ts" />

// Correção: membros cadastrados não aparecem na lista de aprovação do painel
// da igreja.
//
// CAUSA RAIZ: a regra de leitura (listRule/viewRule) de
// `vinculos_usuario_igreja` filtra os vínculos visíveis a um pastor/secretário
// por `igreja_id = @request.auth.igreja_id` — ou seja, pelo campo
// `igreja_id` do PRÓPRIO registro do pastor na coleção `users`. Já o painel
// (IgrejaLayout -> verificarAcessoPainel) resolve a igreja a partir do
// VÍNCULO ativo com permissão de aprovação (caminho principal) e só cai no
// `users.igreja_id` no fallback legado.
//
// Quando o pastor foi aprovado por um vínculo ativo cuja igreja difere do
// `igreja_id` do seu registro `users` (campo desatualizado — ex.: o vínculo
// foi criado/promovido antes de a sincronização em sincronizarUsuario()
// existir ou ela falhou), a regra de acesso e o filtro da página apontam
// para igrejas diferentes:
//   - filtro da página:  igreja_id = <igreja do vínculo ativo>
//   - regra de acesso:   igreja_id = <users.igreja_id do pastor>
// PocketBase aplica AMBOS (AND), e como os ids divergem o resultado é 0
// vínculos — sem erro (HTTP 200), apenas lista vazia. O membro cadastrado
// existe e está pendente, mas fica invisível para o pastor.
//
// SOLUÇÃO: backfill que sincroniza o `igreja_id` de todo pastor/secretário/
// presidente que possui um vínculo ativo com permissão de aprovação para a
// igreja desse vínculo. Assim `@request.auth.igreja_id` volta a coincidir
// com a igreja resolvida pelo painel, e a regra de acesso deixa passar os
// vínculos de membros daquela igreja. A sincronização automática
// (sincronizarUsuario em vinculos_utils.js) já cuida dos casos futuros;
// esta migração corrige os registros legados defasados.
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId("users");

    // Busca todos os pastores/secretários/presidentes.
    const reps = app.findRecordsByFilter(
      "users",
      "papel = 'pastor' || papel = 'secretario' || papel = 'presidente'",
      "created",
      1000,
    );

    let corrigidos = 0;
    for (let i = 0; i < reps.length; i++) {
      const user = reps[i];
      const userId = user.id;
      const userIgrejaRaw = user.get("igreja_id");
      const userIgrejaId = Array.isArray(userIgrejaRaw)
        ? userIgrejaRaw[0] || ""
        : userIgrejaRaw || "";

      // Localiza o vínculo ativo com permissão de aprovação do representante.
      let vinculoAtivo = null;
      try {
        const vinculos = app.findRecordsByFilter(
          "vinculos_usuario_igreja",
          "usuario_id = '" + userId + "' && status = 'ativo' && pode_aprovar_membros = true && (papel = 'pastor' || papel = 'secretario' || papel = 'presidente')",
          "created",
          10,
        );
        vinculoAtivo = vinculos.length > 0 ? vinculos[0] : null;
      } catch (err) {
        app.logger().error(
          "sync_pastor_igreja_id: busca de vinculos falhou",
          "userId", userId,
          "err", String(err),
        );
        continue;
      }

      if (!vinculoAtivo) continue;

      const vincIgrejaRaw = vinculoAtivo.get("igreja_id");
      const vincIgrejaId = Array.isArray(vincIgrejaRaw)
        ? vincIgrejaRaw[0] || ""
        : vincIgrejaRaw || "";

      if (!vincIgrejaId) continue;

      // Só atualiza quando o vínculo ativo aponta para uma igreja diferente
      // do igreja_id atual do registro do usuário (evita writes desnecessários).
      if (vincIgrejaId !== userIgrejaId) {
        user.set("igreja_id", vincIgrejaId);
        app.save(user);
        corrigidos += 1;
      }
    }

    app.logger().info(
      "sync_pastor_igreja_id: backfill concluido",
      "reps", reps.length,
      "corrigidos", corrigidos,
    );
  },
  (app) => {
    // Down: não há como restaurar os igreja_id originais (não foram
    // preservados). A migração é uma correção de dado defasado; reverter
    // não faz sentido. No-op intencional.
  },
);
