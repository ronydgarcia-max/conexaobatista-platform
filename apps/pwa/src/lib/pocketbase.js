import PocketBase from 'pocketbase'

// Detecta automaticamente a URL do PocketBase
const getPBUrl = () => {
  // Se houver variável explícita, usa ela
  if (import.meta.env.VITE_POCKETBASE_URL) {
    return import.meta.env.VITE_POCKETBASE_URL
  }

  // Em desenvolvimento local
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:8090'
  }

  // Em produção: troca "app." por "pb." no domínio
  // app.conexaobatista.com.br → pb.conexaobatista.com.br
  return `https://pb.${window.location.hostname.replace(/^app\./, '')}`
}

const PB_URL = getPBUrl()

export const pb = new PocketBase(PB_URL)

// Desativa o auto-cancellation que causa o erro "autocancelled"
pb.autoCancellation(false)

export const login = async (email, password) => {
  const authData = await pb.collection('users').authWithPassword(email, password)

  // Armazena a senha temporariamente para usar em updates futuros
  // ATENÇÃO: isso é temporário e não recomendado para produção
  if (authData.record) {
    localStorage.setItem('current_password', password)
  }

  return authData
}

export const logout = () => {
  pb.authStore.clear()
  localStorage.removeItem('current_password')
}

export const getCurrentUser = () => {
  return pb.authStore.model
}

// Recupera a senha armazenada temporariamente
const getCurrentPassword = () => {
  return localStorage.getItem('current_password')
}

export const getPendencias = async (igrejaId) => {
  const records = await pb.collection('users').getList(1, 50, {
    filter: `igreja_id = "${igrejaId}" && status_aprovacao = "pendente"`,
    sort: '-created',
  })
  return records.items
}

export const aprovarUsuario = async (usuarioId, representanteId, igrejaId, justificativa = '') => {
  const agora = new Date()
  const dataAcao = agora.toISOString().split('T')[0]
  const horaAcao = agora.toTimeString().split(' ')[0].substring(0, 5)
  const password = getCurrentPassword()

  await pb.collection('users').update(usuarioId, {
    status_aprovacao: 'aprovado',
    passwordOld: password,
  })

  await pb.collection('decisoes_aprovacao_igreja').create({
    usuario_id: usuarioId,
    representante_id: representanteId,
    igreja_id: igrejaId,
    data_acao: dataAcao,
    hora_acao: horaAcao,
    status: 'aprovado',
    tipo_acao: 'aprovacao',
    justificativa: justificativa,
  })
}

export const recusarUsuario = async (usuarioId, representanteId, igrejaId, justificativa) => {
  const agora = new Date()
  const dataAcao = agora.toISOString().split('T')[0]
  const horaAcao = agora.toTimeString().split(' ')[0].substring(0, 5)
  const password = getCurrentPassword()

  await pb.collection('users').update(usuarioId, {
    status_aprovacao: 'recusado',
    passwordOld: password,
  })

  await pb.collection('decisoes_aprovacao_igreja').create({
    usuario_id: usuarioId,
    representante_id: representanteId,
    igreja_id: igrejaId,
    data_acao: dataAcao,
    hora_acao: horaAcao,
    status: 'recusado',
    tipo_acao: 'recusa',
    justificativa: justificativa,
  })
}
