import { Link } from 'react-router-dom'
import { useTorneio } from '../context/TorneioContext'
import { SLUG_COPA } from '../lib/torneios'

// Faixa fina abaixo do header: em qual bolão você está + link pro outro, e o aviso
// de somente leitura quando o torneio está encerrado.
//
// Mesma linguagem do sub-menu do admin (faixa cloud + pílulas), pra não inventar um
// componente de navegação novo. Discreta de propósito: o conteúdo é a lista, não isto.
const TORNEIOS = [
  { slug: 'brasileirao-2026', rotulo: 'Brasileirão', to: '/' },
  { slug: SLUG_COPA, rotulo: 'Copa 2026', to: '/copadomundo2026' },
]

function pill(ativo) {
  const base =
    'shrink-0 px-3 py-1.5 rounded-pill text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-verde'
  return ativo
    ? `${base} bg-ink text-paper`
    : `${base} text-slate hover:text-ink hover:bg-paper`
}

export default function SeletorTorneio() {
  const { slug, encerrado } = useTorneio()

  return (
    <div className="border-b border-line bg-cloud">
      <div className="max-w-[880px] mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="shrink-0 mr-1 text-xs font-bold uppercase tracking-widest text-slate">
          Bolão
        </span>

        <nav aria-label="Escolher bolão" className="flex items-center gap-2">
          {TORNEIOS.map((t) => {
            const ativo = t.slug === slug
            return (
              <Link
                key={t.slug}
                to={t.to}
                aria-current={ativo ? 'page' : undefined}
                className={pill(ativo)}
              >
                {t.rotulo}
              </Link>
            )
          })}
        </nav>

        {/*
          Aviso de arquivo. É UX — a trava real é a RLS: o Postgres recusa
          insert/update de palpite quando now() >= matches.data_hora, e todos os
          jogos da Copa já passaram. Esconder botão não é o que protege.
        */}
        {encerrado && (
          <span className="ml-auto shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-line text-slate text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
            <IconeCadeado />
            Torneio encerrado · somente leitura
          </span>
        )}
      </div>
    </div>
  )
}

function IconeCadeado() {
  return (
    <svg viewBox="0 0 20 20" className="w-3 h-3" fill="currentColor" aria-hidden="true">
      <path d="M10 2a3.5 3.5 0 0 0-3.5 3.5V8H6a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 6 17h8a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 14 8h-.5V5.5A3.5 3.5 0 0 0 10 2Zm2 6H8V5.5a2 2 0 1 1 4 0V8Z" />
    </svg>
  )
}
