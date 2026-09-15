/// <reference path="../pb_data/types.d.ts" />

// Strong-password enforcement for the `admins` collection. The initial
// temporary password ("admin") is seeded directly in the migration (which
// bypasses request hooks), so this hook only governs password changes made
// through the API, i.e. the forced first-login change and any later change.
// Requires 10+ characters with upper- and lower-case letters, a number and
// a symbol.

function assertStrongAdminPassword(e) {
  const pw = e.requestInfo().body.password;
  if (pw) {
    const strong =
      pw.length >= 10 &&
      /[a-z]/.test(pw) &&
      /[A-Z]/.test(pw) &&
      /[0-9]/.test(pw) &&
      /[^A-Za-z0-9]/.test(pw);
    if (!strong) {
      throw new BadRequestError(
        "A senha deve ter no mínimo 10 caracteres, com letras maiúsculas e minúsculas, números e símbolos.",
      );
    }
  }
  e.next();
}

onRecordCreateRequest(assertStrongAdminPassword, "admins");
onRecordUpdateRequest(assertStrongAdminPassword, "admins");
onRecordConfirmPasswordResetRequest(assertStrongAdminPassword, "admins");
