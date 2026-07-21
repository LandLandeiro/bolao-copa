import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoaderTorneio from '../components/LoaderTorneio'
import { useCarregamentoSuave } from '../components/Loader'

// ⚠️ Guarda APENAS de UX — a segurança REAL é a RLS no Postgres (função is_admin()).
// Esconder/redirecionar a tela não protege nada: mesmo que um não-admin force a
// rota /admin, o banco recusa qualquer escrita que não seja dele. Aqui a gente só
// evita mostrar uma tela inútil pra quem não é admin.
export default function AdminRoute({ children }) {
  const { loading, profile } = useAuth()
  const loadingSuave = useCarregamentoSuave(loading)

  if (loadingSuave) {
    return (
      <div className="max-w-[880px] mx-auto px-4 py-16 flex justify-center">
        <LoaderTorneio />
      </div>
    )
  }

  if (profile?.is_admin !== true) return <Navigate to="/" replace />

  return children
}
