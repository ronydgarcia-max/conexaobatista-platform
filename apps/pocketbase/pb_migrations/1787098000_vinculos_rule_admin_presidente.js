/// <reference path="../pb_data/types.d.ts" />

// Correção: membros PENDENTES não aparecem na lista de aprovação do painel
// da igreja para representantes cujo `users.papel` é 'admin' ou 'presidente'.
//
// CAUSA RAIZ: as regras de leitura/escrita (listRule/viewRule/updateRule) de
// `vinculos_usuario_igreja` liberavam o escopo por igreja APENAS para
// `@request.auth.papel = 'pastor' || @request.auth.papel = 'secretario'`.
// O painel da igreja (IgrejaLayout -> verificarAcessoPainel) autoriza o
// acesso com base no VÍNCULO ativo com permissão de aprovação
// (status='ativo' && pode_aprovar_membros=true && papel pastor/secretário),
// e o hook vinculos_flow.pb.js (repPodeAprovar) também valida pelo vínculo.
// Quando um representante tem `users.papel = 'admin'` (ex.: foi promovido a
// administrador mas mantém o vínculo de pastor ativo com permissão de
// aprovação), ele CONSEGUE entrar no painel (verificarAcessoPainel usa o
// vínculo), mas a REGRA DE ACESSO da coleção bloqueia a listagem/atualização
// dos vínculos de outros membros (porque checa `users.papel`, não o vínculo).
// Resultado: lista de aprovação vazia (HTTP 200, sem erro) mesmo existindo
// membro pendente na mesma igreja. O filtro do frontend (status='pendente')
// já estava correto — a divergência estava entre a regra de acesso e a
// lógica de autorização do painel/hook.
//
// SOLUÇÃO: estender o branch escopado por igreja das regras list/view/update
// para incluir também 'presidente' e 'admin'. A regra continua escopada por
// `igreja_id = @request.auth.igreja_id` (visibilidade restrita à igreja do
// próprio registro), e o hook repPodeAprovar segue fazendo a validação fina
// (exige vínculo ativo de pastor/secretário com pode_aprovar_membros na
// igreja) antes de permitir a aprovação. Assim a regra de acesso passa a
// usar a mesma noção de "representante da igreja" que o painel e o hook,
// eliminando a divergência. Nenhuma regra é afrouxada além do escopo por
// igreja: um 'admin'/'presidente' só vê/modifica vínculos da própria igreja.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId("vinculos_usuario_igreja");
    if (!col) {
      app.logger().error(
        "vinculos_rule_admin_presidente: colecao vinculos_usuario_igreja nao encontrada",
      );
      return;
    }

    const regraLeitura =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins' || ((@request.auth.papel = 'pastor' || @request.auth.papel = 'secretario' || @request.auth.papel = 'presidente' || @request.auth.papel = 'admin') && igreja_id = @request.auth.igreja_id))";
    const regraEscrita =
      "@request.auth.collectionName = 'admins' || ((@request.auth.papel = 'pastor' || @request.auth.papel = 'secretario' || @request.auth.papel = 'presidente' || @request.auth.papel = 'admin') && igreja_id = @request.auth.igreja_id)";

    col.listRule = regraLeitura;
    col.viewRule = regraLeitura;
    col.updateRule = regraEscrita;
    app.save(col);

    app.logger().info(
      "vinculos_rule_admin_presidente: regras atualizadas (presidente + admin adicionados ao branch por igreja)",
    );
  },
  (app) => {
    // Down: restaura as regras anteriores (sem presidente/admin).
    const col = app.findCollectionByNameOrId("vinculos_usuario_igreja");
    if (!col) return;
    const regraLeitura =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins' || ((@request.auth.papel = 'pastor' || @request.auth.papel = 'secretario') && igreja_id = @request.auth.igreja_id))";
    const regraEscrita =
      "@request.auth.collectionName = 'admins' || ((@request.auth.papel = 'pastor' || @request.auth.papel = 'secretario') && igreja_id = @request.auth.igreja_id)";
    col.listRule = regraLeitura;
    col.viewRule = regraLeitura;
    col.updateRule = regraEscrita;
    app.save(col);
  },
);
