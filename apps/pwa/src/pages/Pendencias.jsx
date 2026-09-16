import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, getPendencias, logout } from '../lib/pocketbase'

export default function Pendencias() {
  const [pendencias, setPendencias] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('[DIAG] Pendencias montado')
    const currentUser = getCurrentUser()
    console.log('[DIAG] Usuário atual:', currentUser)

    if (!currentUser) {
      console.log('[DIAG] Sem usuário, redirecionando para login')
      setErro('Usuario nao logado. Redirecionando...')
      navigate('/login')
      return
    }

    setUser(currentUser)

    if (!currentUser?.igreja_id) {
      console.log('[DIAG] Usuário sem igreja_id')
      setErro('Usuario nao possui igreja_id. Entre em contato com o suporte.')
      setLoading(false)
      return
    }

    console.log('[DIAG] Carregando pendências para igreja_id:', currentUser.igreja_id)

    let cancelled = false

    const loadPendencias = async () => {
      try {
        setLoading(true)
        const items = await getPendencias(currentUser.igreja_id)
        console.log('[DIAG] Pendências carregadas:', items?.length ?? 0, 'itens')
        if (!cancelled) {
          setPendencias(items || [])
          setErro(null)
        }
      } catch (err) {
        console.error('[DIAG] Erro ao carregar pendencias:', err)
        if (!cancelled) {
          setErro('Erro ao carregar pendencias: ' + (err?.message || 'Erro desconhecido'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPendencias()

    return () => {
      cancelled = true
    }
  }, [navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-batista-blue">
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-batista-blue">Pendencias</h1>
            <p className="text-sm text-gray-600">Ola, {user?.name || 'visitante'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-batista-blue hover:text-batista-gold font-semibold"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-white">
            <p>Carregando...</p>
          </div>
        ) : erro ? (
          <div className="bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Ops!</h2>
            <p>{erro}</p>
          </div>
        ) : pendencias.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-batista-blue mb-2">Tudo em ordem!</h2>
            <p className="text-gray-600">Nao ha solicitacoes pendentes no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendencias.map((pendencia) => (
              <div key={pendencia.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <h3 className="text-lg font-bold text-batista-blue mb-2">{pendencia.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{pendencia.email}</p>
                <button
                  onClick={() => navigate(`/detalhes/${pendencia.id}`)}
                  className="bg-batista-gold hover:bg-yellow-600 text-batista-blue font-bold py-2 px-4 rounded-lg transition"
                >
                  Ver detalhes
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
