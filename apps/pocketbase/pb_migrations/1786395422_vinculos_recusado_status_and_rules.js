/// <reference path="../pb_data/types.d.ts" />

// Vínculos flow: torna o vínculo a fonte da verdade do fluxo de aprovação.
//  - adiciona o status "recusado" ao select `status` de vinculos_usuario_igreja
//  - adiciona o campo `motivo_recusa` (texto) ao vínculo
//  - abre as regras do vínculo para que Pastor/Secretário possam listar e
//    atualizar vínculos da própria igreja (aprovar/recusar)
//  - permite que o próprio usuário crie/exclua seus vínculos (retry após recusa)
//  - abre o createRule de historico_vinculos para representantes da igreja
migrate(
  (app) => {
    const vinculos = app.findCollectionByNameOrId("vinculos_usuario_igreja");

    // --- Regras de acesso ---
    // Pastor/Secretário com igreja_id podem listar/ver vínculos da própria igreja.
    const repReadRule =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins' || ((@request.auth.papel = 'pastor' || @request.auth.papel = 'secretario') && igreja_id = @request.auth.igreja_id))";
    vinculos.listRule = repReadRule;
    vinculos.viewRule = repReadRule;

    // Admins criam livremente; usuário comum pode criar apenas o próprio vínculo
    // (hook server-side força papel=membro, status=pendente, pode_aprovar=false).
    vinculos.createRule =
      "@request.auth.collectionName = 'admins' || (@request.auth.id != '' && @request.auth.id = @request.body.usuario_id)";

    // Admins atualizam livremente; Pastor/Secretário atualizam vínculos da
    // própria igreja (aprovar/recusar). Hook valida permissão e auto-aprovação.
    vinculos.updateRule =
      "@request.auth.collectionName = 'admins' || ((@request.auth.papel = 'pastor' || @request.auth.papel = 'secretario') && igreja_id = @request.auth.igreja_id)";

    // Admins excluem livremente; usuário pode excluir o próprio vínculo
    // (hook server-side permite apenas recusado/suspenso/encerrado).
    vinculos.deleteRule =
      "@request.auth.collectionName = 'admins' || (@request.auth.id != '' && usuario_id = @request.auth.id)";

    // --- Status: adiciona "recusado" ---
    const statusField = vinculos.fields.getByName("status");
    const currentValues = (statusField && statusField.values) || [];
    if (statusField && !currentValues.includes("recusado")) {
      statusField.values = ["pendente", "ativo", "suspenso", "encerrado", "recusado"];
    }

    // --- motivo_recusa (texto) ---
    if (!vinculos.fields.getByName("motivo_recusa")) {
      vinculos.fields.add(
        new TextField({ name: "motivo_recusa", max: 1000 }),
      );
    }

    app.save(vinculos);

    // --- historico_vinculos: permite que representantes registrem decisões ---
    const historico = app.findCollectionByNameOrId("historico_vinculos");
    historico.createRule =
      "@request.auth.collectionName = 'admins' || ((@request.auth.papel = 'pastor' || @request.auth.papel = 'secretario') && igreja_id = @request.auth.igreja_id)";
    app.save(historico);
  },
  (app) => {
    const vinculos = app.findCollectionByNameOrId("vinculos_usuario_igreja");

    const statusField = vinculos.fields.getByName("status");
    if (statusField) {
      statusField.values = ["pendente", "ativo", "suspenso", "encerrado"];
    }

    if (vinculos.fields.getByName("motivo_recusa")) {
      vinculos.fields.removeByName("motivo_recusa");
    }

    vinculos.listRule =
      "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.collectionName = 'admins')";
    vinculos.viewRule = vinculos.listRule;
    vinculos.createRule = "@request.auth.collectionName = 'admins'";
    vinculos.updateRule = "@request.auth.collectionName = 'admins'";
    vinculos.deleteRule = "@request.auth.collectionName = 'admins'";
    app.save(vinculos);

    const historico = app.findCollectionByNameOrId("historico_vinculos");
    historico.createRule = "@request.auth.collectionName = 'admins'";
    app.save(historico);
  },
);
