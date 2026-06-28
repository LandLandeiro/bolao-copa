import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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

  return (
    <header className="sticky top-0 z-40 bg-paper border-b border-line">
      <div className="max-w-[880px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/*
          Wordmark ORIGINAL — logo do bolão + texto.
          NUNCA reproduzir o emblema "26"+taça da FIFA (ver CLAUDE.md / DESIGN.md §9).
        */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/logo-bolao.png"
            alt="Bolão da Copa"
            className="w-10 h-10 shrink-0"
          />
          <span className="font-display text-xl tracking-tight hidden sm:inline truncate">
            BOLÃO DA COPA
          </span>
        </div>

        <nav className="flex items-center gap-4 sm:gap-6 min-w-0 overflow-x-auto no-scrollbar">
          <NavLink to="/" end className={tabClass}>
            Jogos
          </NavLink>
          <NavLink to="/ranking" className={tabClass}>
            Ranking
          </NavLink>
          <NavLink to="/mural" className={tabClass}>
            Mural
          </NavLink>
          {/* Link só pra admin. Esconder é UX — a segurança real é a RLS. */}
          {profile?.is_admin && (
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
