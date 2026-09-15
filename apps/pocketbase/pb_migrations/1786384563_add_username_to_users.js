/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // username — optional, unique (case-insensitive), 3-20 chars, must start
    // with a letter, only letters/digits/underscore. Existing users keep
    // working without one (the unique index is partial on non-empty values).
    if (!users.fields.getByName("username")) {
      users.fields.add(
        new TextField({
          name: "username",
          min: 3,
          max: 20,
          pattern: "^[a-zA-Z][a-zA-Z0-9_]{2,19}$",
        }),
      );
    }

    // Case-insensitive unique index, partial so empty usernames don't clash.
    const idxName = "idx_users_username";
    const hasIdx = (users.indexes || []).some((s) =>
      typeof s === "string" && s.includes(idxName),
    );
    if (!hasIdx) {
      users.indexes.push(
        "CREATE UNIQUE INDEX `idx_users_username` ON `users` (`username` COLLATE NOCASE) WHERE `username` != ''",
      );
    }

    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    try { users.fields.removeByName("username"); } catch (_) {}
    users.indexes = (users.indexes || []).filter(
      (s) => !(typeof s === "string" && s.includes("idx_users_username")),
    );
    app.save(users);
  },
);
