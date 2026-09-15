/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    // Allow admins to delete member accounts, in addition to self-deletion.
    users.deleteRule = "id = @request.auth.id || @request.auth.collectionName = 'admins'";
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.deleteRule = "id = @request.auth.id";
    app.save(users);
  },
);
