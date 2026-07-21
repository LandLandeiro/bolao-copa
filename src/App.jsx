import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { TorneioProvider } from './context/TorneioContext'
import { SLUG_PADRAO, SLUG_COPA } from './lib/torneios'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import SeletorTorneio from './components/SeletorTorneio'
import LembreteJogos from './components/LembreteJogos'
import Login from './pages/Login'
import JogosView from './pages/JogosView'
import Ranking from './pages/Ranking'
import Mural from './pages/Mural'
import Confronto from './pages/Confronto'
import Perfil from './pages/Perfil'
import AdminLayout from './admin/AdminLayout'
import AdminUsuarios from './admin/AdminUsuarios'
import AdminPalpites from './admin/AdminPalpites'
import AdminJogos from './admin/AdminJogos'
import AdminRanking from './admin/AdminRanking'

// Shell autenticado DE UM TORNEIO: guard + torneio da rota + header + conteúdo.
// O TorneioProvider fica ACIMA do <Outlet/>, então toda tela filha tem o torneio à
// mão e nenhuma query roda sem escopo. `base` é o prefixo de rota do torneio, pros
// links internos não pularem de um bolão pro outro.
function TorneioLayout({ slug, base = '' }) {
  return (
    <ProtectedRoute>
      <TorneioProvider slug={slug} base={base}>
        <Header />
        <SeletorTorneio />
        <LembreteJogos />
        <Outlet />
      </TorneioProvider>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Torneio ATIVO (Brasileirão) — mora na raiz. */}
          <Route element={<TorneioLayout slug={SLUG_PADRAO} />}>
            <Route path="/" element={<JogosView />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/mural" element={<Mural />} />
            <Route path="/confronto" element={<Confronto />} />
            <Route path="/perfil" element={<Perfil />} />
            {/* Área de admin: AdminLayout aplica a guarda (UX) + sub-menu.
                O admin opera sempre sobre o torneio ativo — a Copa é arquivo. */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="usuarios" replace />} />
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="palpites" element={<AdminPalpites />} />
              <Route path="jogos" element={<AdminJogos />} />
              <Route path="ranking" element={<AdminRanking />} />
            </Route>
          </Route>

          {/*
            Copa 2026 ARQUIVADA — as MESMAS telas (jogos + ranking), só que com o
            slug da Copa. Como `torneios.encerrado` é true, a UI entra em modo
            somente leitura. Isso é UX: quem de fato recusa escrita é a RLS
            (predictions só aceita palpite antes do data_hora, e a Copa já passou).
          */}
          <Route
            path="/copadomundo2026"
            element={<TorneioLayout slug={SLUG_COPA} base="/copadomundo2026" />}
          >
            <Route index element={<JogosView />} />
            <Route path="ranking" element={<Ranking />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
