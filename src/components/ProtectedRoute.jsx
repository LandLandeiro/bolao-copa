import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import EscolherNome from './EscolherNome'
import Loader from './Loader'

// Guarda de rota — segura a renderização enquanto sabe se há sessão,
// e manda pra /login caso não tenha.
export default function ProtectedRoute({ children }) {
  const { session, loading, profile } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={72} />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  // Gate do 1º login: até escolher um nome, bloqueia o app inteiro (header +
  // conteúdo). nome_escolhido === false só nos novos usuários; quem já escolheu
  // nunca cai aqui. Se o profile falhou em carregar (null), não bloqueia.
  if (profile && profile.nome_escolhido === false) return <EscolherNome />

  return children
}
