import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTorneio, useRotaTorneio } from '../context/TorneioContext'
import SeletorTorneio from './SeletorTorneio'

// Aba: sublinhado verde quando ativa, alinhado com a borda do header.
function tabClass({ isActive }) {
  const base = 'relative px-1 py-5 font-semibold transition-colors shrink-0 whitespace-nowrap'
  const state = isActive
    ? 'text-ink after:absolute after:left-0 after:right-0 after:-bottom-px after:h-1 after:bg-verde'
    : 'text-slate hover:text-ink'
  return `${base} ${state}`
}

export default function Header() {
  const { profile, sair } = useAuth()
  const { base } = useTorneio()
  const rota = useRotaTorneio()

  // Jogos e Ranking existem nos DOIS torneios, então apontam pra rota do torneio
  // atual. Mural e Admin não são escopados por torneio e vivem só na árvore da
  // raiz (ver App.jsx) — some no arquivo da Copa pra não levar pra fora do bolão.
  const naRaiz = base === ''

  return (
    <header className="sticky top-0 z-40 bg-paper border-b border-line">
      <div className="max-w-[880px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/*
          Wordmark ORIGINAL (logo + "BOLÃO") que TAMBÉM é o seletor de torneio —
          o nome do bolão atual fica ao lado, em peso menor.
          NUNCA reproduzir o emblema "26"+taça da FIFA (ver CLAUDE.md / DESIGN.md §9).
        */}
        <SeletorTorneio />

        <nav className="flex items-center gap-4 sm:gap-6 min-w-0 overflow-x-auto no-scrollbar">
          <NavLink to={rota('/')} end className={tabClass}>
            Jogos
          </NavLink>
          <NavLink to={rota('/ranking')} end className={tabClass}>
            Ranking
          </NavLink>
          {naRaiz && (
            <NavLink to="/mural" className={tabClass}>
              Mural
            </NavLink>
          )}
          {/* Link só pra admin. Esconder é UX — a segurança real é a RLS. */}
          {naRaiz && profile?.is_admin && (
            <NavLink to="/admin" className={tabClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Nome = atalho pro Perfil (editar nick). Visível também no mobile. */}
          <NavLink
            to="/perfil"
            title="Editar seu nome"
            className={({ isActive }) =>
              `text-sm font-semibold truncate max-w-[96px] sm:max-w-[140px] rounded-md px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-verde/40 ${
                isActive ? 'text-ink' : 'text-slate hover:text-ink'
              }`
            }
          >
            {profile?.nome ?? 'perfil'}
          </NavLink>
          <button
            type="button"
            onClick={sair}
            className="px-3 py-3 -mr-3 text-sm font-semibold text-slate hover:text-ink rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-verde/40"
          >
            sair
          </button>
        </div>
      </div>
    </header>
  )
}
