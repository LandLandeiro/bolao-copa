import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Aba: sublinhado verde quando ativa, alinhado com a borda do header.
function tabClass({ isActive }) {
  const base = 'relative px-1 py-5 font-semibold transition-colors'
  const state = isActive
    ? 'text-ink after:absolute after:left-0 after:right-0 after:-bottom-px after:h-1 after:bg-verde'
    : 'text-slate hover:text-ink'
  return `${base} ${state}`
}

export default function Header() {
  const { profile, sair } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-paper border-b border-line">
      <div className="max-w-[880px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/*
          Wordmark ORIGINAL — bloco "26" + texto.
          NUNCA reproduzir o emblema "26"+taça da FIFA (ver CLAUDE.md / DESIGN.md §9).
        */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-10 h-10 bg-ink text-paper font-display text-2xl rounded-md leading-none">
            26
          </span>
          <span className="font-display text-xl tracking-tight hidden sm:inline truncate">
            BOLÃO DA COPA
          </span>
        </div>

        <nav className="flex items-center gap-6">
          <NavLink to="/" end className={tabClass}>
            Jogos
          </NavLink>
          <NavLink to="/ranking" className={tabClass}>
            Ranking
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {profile?.nome && (
            <span className="text-sm text-slate hidden sm:inline truncate max-w-[120px]">
              {profile.nome}
            </span>
          )}
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
