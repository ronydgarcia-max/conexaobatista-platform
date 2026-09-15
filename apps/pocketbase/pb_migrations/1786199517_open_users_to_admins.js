/// <reference path="../pb_data/types.d.ts" />

// Opens the existing `users` collection to administrators authenticated
// against the `admins` collection, so the /adm panel can list, view and
// update member records. Regular users keep their owner-only access
// (id = @request.auth.id); the added clause grants admins full read/update
// over every member record. createRule and deleteRule are intentionally
// left unchanged.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.listRule = "id = @request.auth.id || @request.auth.collectionName = 'admins'";
    users.viewRule = "id = @request.auth.id || @request.auth.collectionName = 'admins'";
    users.updateRule = "id = @request.auth.id || @request.auth.collectionName = 'admins'";
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.listRule = "id = @request.auth.id";
    users.viewRule = "id = @request.auth.id";
    users.updateRule = "id = @request.auth.id";
    app.save(users);
  },
);
