import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTorneio, useRotaTorneio, useSkin } from '../context/TorneioContext'
import SeletorTorneio from './SeletorTorneio'

// Aba: sublinhado quando ativa, alinhado com a borda do header. A cor do texto e do
// sublinhado vêm do skin — na Copa é barra clara com sublinhado verde; no Brasileirão
// é faixa verde escura com sublinhado amarelo.
function tabClass(skin) {
  return ({ isActive }) => {
    const base =
      'relative px-1 py-3 sm:py-5 font-semibold transition-colors shrink-0 whitespace-nowrap'
    const estado = isActive
      ? `${skin.headerNavAtivo} after:absolute after:left-0 after:right-0 after:-bottom-px after:h-1`
      : skin.headerNav
    return `${base} ${estado}`
  }
}

export default function Header() {
  const { profile, sair } = useAuth()
  const { base } = useTorneio()
  const rota = useRotaTorneio()
  const skin = useSkin()
  const aba = tabClass(skin)

  // Jogos e Ranking existem nos DOIS torneios, então apontam pra rota do torneio
  // atual. Mural e Admin não são escopados por torneio e vivem só na árvore da
  // raiz (ver App.jsx) — some no arquivo da Copa pra não levar pra fora do bolão.
  const naRaiz = base === ''

  return (
    <header className={`sticky top-0 z-40 ${skin.headerBarra}`}>
      {/*
        DUAS LINHAS NO MOBILE, uma no desktop — via flex-wrap + `order`, sem duplicar
        markup. Em ~390px a barra tem largura intrínseca de ~447px: em linha única a
        marca (que é `shrink-0`) transbordava POR CIMA do nav, e o `overflow-x-auto`
        do nav escondia o "Admin" atrás de um scroll invisível. Espremer não resolvia;
        reorganizar sim.
          mobile:  [ marca ......... sair ]
                   [ Jogos  Ranking  Admin  Perfil ]
          desktop: [ marca   Jogos Ranking Admin   nome  sair ]
      */}
      <div className="max-w-[880px] mx-auto px-4 flex flex-wrap items-center gap-x-3 sm:gap-x-6">
        {/*
          Wordmark ORIGINAL (logo + "CRAVADA") que TAMBÉM é o seletor de torneio.
          NUNCA reproduzir o emblema "26"+taça da FIFA (ver CLAUDE.md / DESIGN.md §9).
          `flex-1` no mobile empurra o "sair" pra direita; no desktop o nav assume.
        */}
        <div className="order-1 flex-1 sm:flex-none min-w-0 flex items-center h-14 sm:h-16">
          <SeletorTorneio />
        </div>

        {/* No mobile fecha a 1ª linha; no desktop vai pro fim da única linha. */}
        <div className="order-2 sm:order-3 shrink-0 flex items-center gap-2 sm:gap-3 sm:ml-auto">
          {/* Nome só no desktop: em 390px ele virava "L…", que não informa nada.
              No mobile o acesso ao perfil vira uma aba do nav, logo abaixo. */}
          <NavLink
            to="/perfil"
            title="Editar seu nome"
            className={({ isActive }) =>
              `hidden sm:block text-sm font-semibold truncate max-w-[140px] rounded-md px-1 focus:outline-none focus-visible:ring-2 ${skin.headerFoco} ${
                isActive ? skin.headerMarca : skin.headerSec
              }`
            }
          >
            {profile?.nome ?? 'perfil'}
          </NavLink>
          <button
            type="button"
            onClick={sair}
            className={`px-3 py-3 -mr-3 text-sm font-semibold rounded-md focus:outline-none focus-visible:ring-2 ${skin.headerSec} ${skin.headerFoco}`}
          >
            sair
          </button>
        </div>

        {/* 2ª linha no mobile (w-full), meio da linha no desktop. Sem
            `overflow-x-auto`: agora cabe, e scroll invisível escondia aba. */}
        <nav className="order-3 sm:order-2 w-full sm:w-auto flex items-center gap-5 sm:gap-6 min-w-0">
          <NavLink to={rota('/')} end className={aba}>
            Jogos
          </NavLink>
          <NavLink to={rota('/ranking')} end className={aba}>
            Ranking
          </NavLink>
          {/*
            O Mural saiu do menu (jul/2026), mas a ROTA continua de pé — ver App.jsx.
            O conteúdo é da época da Copa e não se perde: chega-se nele digitando o
            caminho. Pra devolver ao menu, é só pôr um NavLink aqui apontando pra lá.
          */}
          {/* Link só pra admin. Esconder é UX — a segurança real é a RLS. */}
          {naRaiz && profile?.is_admin && (
            <NavLink to="/admin" className={aba}>
              Admin
            </NavLink>
          )}
          {/* Só no mobile: substitui o nome escondido lá em cima, pra o perfil não
              ficar inalcançável no celular. */}
          <NavLink to="/perfil" className={(s) => `${aba(s)} sm:hidden`}>
            Perfil
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
