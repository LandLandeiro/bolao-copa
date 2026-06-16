import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import Login from './pages/Login'
import Jogos from './pages/Jogos'
import Ranking from './pages/Ranking'
import Perfil from './pages/Perfil'
import AdminLayout from './admin/AdminLayout'
import AdminUsuarios from './admin/AdminUsuarios'
import AdminPalpites from './admin/AdminPalpites'
import AdminJogos from './admin/AdminJogos'
import AdminRanking from './admin/AdminRanking'

// Shell autenticado: guard + header + conteúdo da rota filha via <Outlet/>.
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Header />
      <Outlet />
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Jogos />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/perfil" element={<Perfil />} />
            {/* Área de admin: AdminLayout aplica a guarda (UX) + sub-menu. */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="usuarios" replace />} />
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="palpites" element={<AdminPalpites />} />
              <Route path="jogos" element={<AdminJogos />} />
              <Route path="ranking" element={<AdminRanking />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
