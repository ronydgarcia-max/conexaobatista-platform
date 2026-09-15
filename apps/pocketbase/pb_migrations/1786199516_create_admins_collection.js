/// <reference path="../pb_data/types.d.ts" />

// Creates the `admins` auth collection used by the private /adm area.
// Authentication is by username (passwordAuth.identityFields = ["username"]),
// sign-up is closed (createRule: null) so accounts can only be seeded
// server-side. Seeds the initial administrator:
//   username: "Admin"  |  temporary password: "admin"
// The temp password must be changed on first login (must_change_password = true).
// Strong-password enforcement on change is handled by
// admins_password_strength.pb.js; the password field min is lowered to 5 here
// only so the temporary "admin" can be seeded and used once.
//
// Note: auth-option setters (passwordAuth, authAlert) spread the existing
// (default) value, so they must be applied AFTER the collection's first save,
// once the defaults are initialized — not on the bare new Collection.

migrate(
  (app) => {
    let admins;
    try {
      admins = app.findCollectionByNameOrId("admins");
    } catch (_) {
      admins = new Collection({
        type: "auth",
        name: "admins",
        listRule: "id = @request.auth.id",
        viewRule: "id = @request.auth.id",
        createRule: null, // closed: no public sign-up
        updateRule: "id = @request.auth.id",
        deleteRule: null,
        fields: [
          { name: "name", type: "text", max: 120 },
          { name: "username", type: "text", required: true, min: 3, max: 40 },
          { name: "must_change_password", type: "bool" },
        ],
        indexes: [
          "CREATE UNIQUE INDEX idx_admins_username ON admins (username)",
        ],
      });
      app.save(admins); // first save initializes default auth options

      // Now configure auth options on the persisted collection.
      admins = app.findCollectionByNameOrId("admins");
      admins.passwordAuth = { enabled: true, identityFields: ["username"] };
      admins.authAlert = { enabled: false };
      // Allow the short temporary password "admin" (5 chars) for first login.
      admins.fields.getByName("password").min = 5;
      app.save(admins);
    }

    // Seed the initial administrator account (idempotent by email).
    try {
      app.findAuthRecordByEmail("admins", "admin@conexaobatista.com.br");
    } catch (_) {
      const admin = new Record(admins);
      admin.setEmail("admin@conexaobatista.com.br");
      admin.setPassword("admin");
      admin.set("username", "Admin");
      admin.set("name", "Administrador");
      admin.set("must_change_password", true);
      admin.set("verified", true);
      app.save(admin);
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("admins"));
    } catch (e) {
      if (!e.message.includes("no rows in result set")) throw e;
    }
  },
);
