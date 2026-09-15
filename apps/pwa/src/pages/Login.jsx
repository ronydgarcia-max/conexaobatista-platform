import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/pocketbase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/pendencias')
    } catch (err) {
      setError('E-mail ou senha incorretos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-batista-blue px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-4">
            <img
              src="/images/logo.png"
              alt="Conexão Batista"
              className="w-72 h-72 object-contain mx-auto drop-shadow-xl"
            />
          </div>
          <p className="text-xl font-semibold text-gray-300">App do Aprovador</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-8">
          <div className="mb-6">
            <label htmlFor="email" className="block text-batista-blue text-sm font-semibold mb-2">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-batista-gold text-batista-blue"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-batista-blue text-sm font-semibold mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-batista-gold text-batista-blue"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-batista-gold hover:bg-yellow-600 text-batista-blue font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>

          <div className="mt-6 text-center">
            <a href="#" className="text-batista-blue text-sm hover:underline">
              Esqueci minha senha
            </a>
          </div>
        </form>

        <div className="mt-6 text-center text-gray-400 text-xs">
          <p>© 2026 Conexao Batista</p>
        </div>
      </div>
    </div>
  )
}
