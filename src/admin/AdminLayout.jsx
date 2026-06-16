import { NavLink, Outlet } from 'react-router-dom'
import AdminRoute from './AdminRoute'

// Sub-menu do admin: navega entre as 4 telas. Some pra não-admin porque a
// AdminRoute já redireciona antes de chegar aqui.
const ABAS = [
  { to: '/admin/usuarios', label: 'Usuários' },
  { to: '/admin/palpites', label: 'Palpites' },
  { to: '/admin/jogos', label: 'Jogos' },
  { to: '/admin/ranking', label: 'Ranking' },
]

function subTab({ isActive }) {
  const base =
    'shrink-0 px-3 py-2 rounded-pill text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-verde'
  return isActive
    ? `${base} bg-ink text-paper`
    : `${base} text-slate hover:text-ink hover:bg-paper`
}

// Não usa <main> próprio: cada tela-filha (incl. Jogos/Ranking reaproveitados)
// renderiza o seu, então fica só a barra de navegação + o Outlet.
export default function AdminLayout() {
  return (
    <AdminRoute>
      <div className="border-b border-line bg-cloud">
        <nav
          aria-label="Seções do admin"
          className="max-w-[880px] mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto"
        >
          <span className="shrink-0 mr-1 text-xs font-bold uppercase tracking-widest text-slate">
            Admin
          </span>
          {ABAS.map((a) => (
            <NavLink key={a.to} to={a.to} className={subTab}>
              {a.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </AdminRoute>
  )
}
