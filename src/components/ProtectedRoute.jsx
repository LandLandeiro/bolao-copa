import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Guarda de rota — segura a renderização enquanto sabe se há sessão,
// e manda pra /login caso não tenha.
export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate">
        carregando…
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return children
}
