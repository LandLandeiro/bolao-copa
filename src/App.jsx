import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { TorneioProvider } from './context/TorneioContext'
import { SLUG_PADRAO, SLUG_COPA } from './lib/torneios'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import AvisoArquivo from './components/AvisoArquivo'
import LembreteJogos from './components/LembreteJogos'
import Login from './pages/Login'
import ConferirEscudos from './pages/ConferirEscudos'
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
      {/*
        `data-torneio` liga o skin de COR e TIPOGRAFIA (ver src/index.css): daqui pra
        dentro, `bg-verde` e `font-display` valem o que este torneio define. Precisa
        envolver TUDO que a rota renderiza — header inclusive.
      */}
      {/* `svh` e não `screen`/`100vh`: no iOS o 100vh conta a barra do Safari que
          some ao rolar, deixando a página mais alta que a tela — dá pra "puxar"
          verticalmente mesmo sem conteúdo. `svh` usa a altura visível de fato. */}
      <div data-torneio={slug} className="min-h-svh">
        <TorneioProvider slug={slug} base={base}>
          <Header />
          {/* Só aparece em torneio encerrado; a troca de torneio vive no título. */}
          <AvisoArquivo />
          <LembreteJogos />
          <Outlet />
        </TorneioProvider>
      </div>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* 🔧 TEMPORÁRIA: conferência visual das escalas dos escudos. Fora do
              guard e do torneio de propósito (só mostra asset público) — apagar
              junto com pages/ConferirEscudos.jsx quando os valores estiverem bons. */}
          <Route path="/dev/escudos" element={<ConferirEscudos />} />

          {/* Torneio ATIVO (Brasileirão) — mora na raiz. */}
          <Route element={<TorneioLayout slug={SLUG_PADRAO} />}>
            <Route path="/" element={<JogosView />} />
            <Route path="/ranking" element={<Ranking />} />
            {/* Fora do menu do header desde jul/2026, mas a rota FICA: o mural
                guarda o histórico da Copa e sumir com ela apagaria o acesso. */}
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
