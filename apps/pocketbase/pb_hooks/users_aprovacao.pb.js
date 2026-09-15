/// <reference path="../pb_data/types.d.ts" />

onRecordUpdateRequest((e) => {
  const record = e.record

  const statusAntigo = record.original().get("status_aprovacao")
  const statusNovo = record.get("status_aprovacao")

  // Se NÃO está mudando o status, libera
  if (statusAntigo === statusNovo) {
    return e.next()
  }

  // Está mudando o status -> exige estar logado
  if (!e.auth) {
    return e.unauthorizedError("Faça login para aprovar/recusar.")
  }

  return e.next()
}, "users")
