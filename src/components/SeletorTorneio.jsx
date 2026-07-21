import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTorneio } from '../context/TorneioContext'
import { SLUG_PADRAO, SLUG_COPA } from '../lib/torneios'

// O TÍTULO é o seletor de torneio.
//
// Antes isto era uma faixa inteira abaixo do header, o que dava peso de navegação
// principal a uma ação rara e ainda sugeria que os dois bolões estavam rolando. Agora
// o wordmark abre um menu curto, e a hierarquia ativo × arquivo fica explícita lá
// dentro — que é onde ela importa.
//
// Mobile: só "BOLÃO ▾" cabe, então o nome do torneio some do botão e aparece no menu.
// `logo` é a marca do CAMPEONATO (não de um time, não do bolão) — serve só pra
// identificar o torneio na lista. A logo do próprio bolão continua no botão, como
// marca do app (DESIGN.md §9). Torneio sem arte deixa o slot vazio, e o alinhamento
// do texto se mantém.
const TORNEIOS = [
  {
    slug: SLUG_PADRAO,
    curto: 'Brasileirão',
    nome: 'Brasileirão 2026 · returno',
    to: '/',
    arquivo: false,
    logo: '/brasileirao-logo.webp',
  },
  {
    slug: SLUG_COPA,
    curto: 'Copa 2026',
    nome: 'Copa do Mundo 2026',
    to: '/copadomundo2026',
    arquivo: true,
    logo: null,
  },
]

export default function SeletorTorneio() {
  const { slug } = useTorneio()
  const [aberto, setAberto] = useState(false)
  const caixaRef = useRef(null)
  const botaoRef = useRef(null)

  const atual = TORNEIOS.find((t) => t.slug === slug) ?? TORNEIOS[0]

  // Esc fecha (e devolve o foco pro botão); clique fora fecha.
  useEffect(() => {
    if (!aberto) return
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setAberto(false)
        botaoRef.current?.focus()
      }
    }
    function onClique(e) {
      if (!caixaRef.current?.contains(e.target)) setAberto(false)
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('mousedown', onClique)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('mousedown', onClique)
    }
  }, [aberto])

  return (
    <div ref={caixaRef} className="relative min-w-0">
      <button
        ref={botaoRef}
        type="button"
        aria-expanded={aberto}
        aria-haspopup="true"
        aria-label={`Bolão: ${atual.nome}. Trocar de torneio`}
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 sm:gap-3 min-w-0 rounded-md py-1 pr-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-verde/40"
      >
        <img src="/logo-bolao.png" alt="" className="w-10 h-10 shrink-0" />
        <span className="font-display text-xl tracking-tight shrink-0">BOLÃO</span>
        {/* Nome do torneio: peso menor e cor secundária — é subtítulo, não marca.
            Some no mobile (fica no menu) pra o header não quebrar. */}
        <span className="hidden sm:inline text-sm font-semibold text-slate truncate">
          {atual.curto}
        </span>
        <ChevronBaixo aberto={aberto} />
      </button>

      {aberto && (
        <ul className="absolute left-0 top-full mt-1 z-50 w-[248px] max-w-[calc(100vw-2rem)] bg-cloud border border-line rounded-lg shadow-hard py-1 overflow-hidden">
          {TORNEIOS.map((t) => {
            const ehAtual = t.slug === slug
            return (
              <li key={t.slug}>
                <Link
                  to={t.to}
                  aria-current={ehAtual ? 'page' : undefined}
                  onClick={() => setAberto(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 transition-colors focus:outline-none focus-visible:bg-paper ${
                    ehAtual ? 'bg-paper' : 'hover:bg-paper'
                  }`}
                >
                  {/* Slot fixo de 20px: com logo do campeonato ou vazio, pros
                      nomes ficarem alinhados de um jeito ou de outro. */}
                  <span className="w-5 h-5 shrink-0 flex items-center justify-center">
                    {t.logo && (
                      <img
                        src={t.logo}
                        alt=""
                        width={20}
                        height={20}
                        className={`max-w-full max-h-full object-contain ${
                          t.arquivo ? 'opacity-60' : ''
                        }`}
                      />
                    )}
                  </span>

                  {/* Ativo em ink/semibold; arquivo em cinza — a hierarquia é a
                      informação principal deste menu. */}
                  <span
                    className={`flex-1 min-w-0 text-sm truncate ${
                      t.arquivo ? 'text-slate' : 'font-semibold text-ink'
                    }`}
                  >
                    {t.nome}
                  </span>
                  {t.arquivo && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-pill bg-line text-slate text-[10px] font-bold uppercase tracking-wider">
                      arquivo
                    </span>
                  )}
                  {ehAtual && (
                    <span className="shrink-0 text-verde text-sm font-bold" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function ChevronBaixo({ aberto }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`w-4 h-4 shrink-0 text-slate transition-transform duration-200 ${
        aberto ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
