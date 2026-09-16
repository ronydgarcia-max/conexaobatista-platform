import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Pendencias from './pages/Pendencias'
import Detalhes from './pages/Detalhes'
import { pb } from './lib/pocketbase'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)

  useEffect(() => {
    console.log('[DIAG] App montado. Auth inicial:', pb.authStore.isValid)
    console.log('[DIAG] Token:', pb.authStore.token ? 'presente' : 'ausente')
    console.log('[DIAG] Modelo do usuário:', pb.authStore.model)

    const unsub = pb.authStore.onChange(() => {
      console.log('[DIAG] AuthStore mudou. Novo estado:', pb.authStore.isValid)
      setIsAuthenticated(pb.authStore.isValid)
    })
    return unsub
  }, [])

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/pendencias" /> : <Login />}
      />
      <Route
        path="/pendencias"
        element={isAuthenticated ? <Pendencias /> : <Navigate to="/login" />}
      />
      <Route
        path="/detalhes/:id"
        element={isAuthenticated ? <Detalhes /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default App
