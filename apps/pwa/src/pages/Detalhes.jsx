import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pb, getCurrentUser, aprovarUsuario, recusarUsuario } from '../lib/pocketbase'

export default function Detalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  
  const [pendente, setPendente] = useState(null)
  const [empresa, setEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRecusaModal, setShowRecusaModal] = useState(false)
  const [justificativa, setJustificativa] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadDetalhes()
  }, [id])

  const loadDetalhes = async () => {
    try {
      const record = await pb.collection('users').getOne(id)
      setPendente(record)

      if (record.igreja_id) {
        try {
          const empresaRecord = await pb.collection('empresas').getOne(record.igreja_id)
          setEmpresa(empresaRecord)
        } catch (err) {
          console.warn('Empresa não encontrada:', err)
          setEmpresa(null)
        }
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err)
      setError('Não foi possível carregar os detalhes.')
    } finally {
      setLoading(false)
    }
  }

  const handleAprovar = async () => {
    if (!confirm(`Aprovar ${pendente.name}?`)) return
    
    setActionLoading(true)
    setError('')
    try {
      await aprovarUsuario(id, user.id, pendente.igreja_id, 'Aprovado via app')
      setSuccess('Usuário aprovado com sucesso!')
      setTimeout(() => navigate('/pendencias'), 1500)
          } catch (err) {
      console.error('Erro ao aprovar:', err)
      const detalhe = err?.response?.data?.message 
        || err?.response?.data 
        || err?.message 
        || 'Erro desconhecido'
      setError(`Erro ao aprovar: ${typeof detalhe === 'string' ? detalhe : JSON.stringify(detalhe)}`)
    } finally {

     setActionLoading(false)
    }
  }

  const handleRecusar = async () => {
    if (!justificativa.trim()) {
      alert('Informe o motivo da recusa.')
      return
    }
    
    setActionLoading(true)
    setError('')
    try {
      await recusarUsuario(id, user.id, pendente.igreja_id, justificativa)
      setSuccess('Usuário recusado com sucesso!')
      setShowRecusaModal(false)
      setTimeout(() => navigate('/pendencias'), 1500)
     } catch (err) {
      console.error('Erro ao recusar:', err)
      const detalhe = err?.response?.data?.message 
        || err?.response?.data 
        || err?.message 
        || 'Erro desconhecido'
      setError(`Erro ao recusar: ${typeof detalhe === 'string' ? detalhe : JSON.stringify(detalhe)}`)
    } finally {
 
    setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-batista-blue flex items-center justify-center">
        <p className="text-white text-lg">Carregando...</p>
      </div>
    )
  }

  if (!pendente) {
    return (
      <div className="min-h-screen bg-batista-blue flex items-center justify-center">
        <p className="text-white text-lg">Usuário não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-batista-blue">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/pendencias')}
            className="text-batista-blue hover:text-batista-gold font-semibold flex items-center gap-2"
          >
            Voltar
          </button>
          <h1 className="text-xl font-bold text-batista-blue">Detalhes</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Card de informações */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-batista-blue rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {pendente.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-batista-blue">{pendente.name}</h2>
              <p className="text-gray-600">{pendente.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Igreja:</span>
              <span className="text-batista-blue font-semibold">
                {empresa?.nome_fantasia || empresa?.razao_social || 'Não informada'}
              </span>
            </div>

            {empresa?.telefone && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Telefone:</span>
                <span className="text-batista-blue font-semibold">{empresa.telefone}</span>
              </div>
            )}

            {empresa?.cidade && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Cidade:</span>
                <span className="text-batista-blue font-semibold">
                  {empresa.cidade}{empresa.estado ? `/${empresa.estado}` : ''}
                </span>
              </div>
            )}

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600 font-medium">Data de cadastro:</span>
              <span className="text-batista-blue font-semibold">
                {new Date(pendente.created).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-gray-600 font-medium">Status:</span>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                Pendente
              </span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleAprovar}
            disabled={actionLoading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
          >
            {actionLoading ? 'Processando...' : 'APROVAR'}
          </button>

          <button
            onClick={() => setShowRecusaModal(true)}
            disabled={actionLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
          >
            RECUSAR
          </button>
        </div>
      </main>

      {/* Modal de recusa */}
      {showRecusaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-batista-blue mb-4">
              Motivo da recusa
            </h3>
            <textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-batista-gold text-batista-blue mb-4"
              rows="4"
              placeholder="Informe o motivo da recusa..."
              required
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRecusaModal(false)
                  setJustificativa('')
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-batista-blue font-bold py-2 px-4 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleRecusar}
                disabled={actionLoading || !justificativa.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {actionLoading ? 'Processando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
