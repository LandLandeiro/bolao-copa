import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTorneio, useSkin } from '../context/TorneioContext'
import { skinDoTorneio } from '../lib/skin'
import { SLUG_PADRAO, SLUG_COPA } from '../lib/torneios'

// O TÍTULO é o seletor de torneio.
//
// Antes isto era uma faixa inteira abaixo do header, o que dava peso de navegação
// principal a uma ação rara e ainda sugeria que os dois bolões estavam rolando. Agora
// o wordmark abre um menu curto, e a hierarquia ativo × arquivo fica explícita lá
// dentro — que é onde ela importa.
//
// Mobile: só "CRAVADA ▾" cabe, então o nome do torneio some do botão e vai pro menu.
//
// ⚠️ A marca de cada torneio NÃO se cadastra aqui — vem de `skin.marca`
// (lib/skin.js), a mesma fonte que o botão do header usa. Já teve um `logo` próprio
// nesta lista, e a duplicação cobrou: ao adicionar a arte da Copa, o skin foi
// atualizado e esta cópia ficou em `null`, então o item aparecia sem marca nenhuma.
// Uma fonte só, e os dois lugares andam juntos por construção.
const TORNEIOS = [
  {
    slug: SLUG_PADRAO,
    curto: 'Brasileirão',
    nome: 'Brasileirão 2026 · returno',
    to: '/',
    arquivo: false,
  },
  {
    slug: SLUG_COPA,
    curto: 'Copa 2026',
    nome: 'Copa do Mundo 2026',
    to: '/copadomundo2026',
    arquivo: true,
  },
]

// Marca de quando não há torneio (a bola do próprio app) — usada como último
// recurso se a arte de um torneio não carregar.
const SKIN_FALLBACK = skinDoTorneio(undefined)

export default function SeletorTorneio() {
  const { slug } = useTorneio()
  const skin = useSkin()
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
        aria-label={`Cravada: ${atual.nome}. Trocar de torneio`}
        onClick={() => setAberto((v) => !v)}
        className={`flex items-center gap-2 sm:gap-3 min-w-0 rounded-md py-1 pr-1 focus:outline-none focus-visible:ring-2 ${skin.headerFoco}`}
      >
        {/* Marca do torneio no MESMO espaço reservado (40px) — a bola do bolão na
            Copa, a logo do campeonato no Brasileirão. Tamanho fixo pro menu ao lado
            não se deslocar quando a arte troca. */}
        <img
          src={skin.marca.src}
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 shrink-0 object-contain"
        />
        <span
          className={`font-display text-xl tracking-tight shrink-0 ${skin.headerMarca}`}
        >
          CRAVADA
        </span>
        {/* Nome do torneio: peso menor e cor secundária — é subtítulo, não marca.
            Some no mobile (fica no menu) pra o header não quebrar. */}
        <span
          className={`hidden sm:inline text-sm font-semibold truncate ${skin.headerSec}`}
        >
          {atual.curto}
        </span>
        <ChevronBaixo aberto={aberto} cor={skin.headerChevron} />
      </button>

      {aberto && (
        <ul className="absolute left-0 top-full mt-1 z-50 w-[320px] max-w-[calc(100vw-2rem)] bg-cloud border border-line rounded-lg shadow-hard py-1 overflow-hidden">
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
                  <MarcaDoTorneio slug={t.slug} esmaecida={t.arquivo} />

                  {/* Ativo em ink/semibold; arquivo em cinza — a hierarquia é a
                      informação principal deste menu.
                      O menu é largo o bastante pros dois nomes caberem inteiros
                      (medido: 226px o maior, com folga). O `truncate` fica só como
                      rede: um torneio de nome mais longo no futuro ganha reticências
                      em vez de ser cortado no silêncio pelo overflow-hidden do <ul>. */}
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

// Marca do torneio no menu, em slot de tamanho fixo (o alinhamento dos nomes não
// depende da arte que caiu ali).
//
// Se o arquivo falhar, cai na logo do próprio app em vez de deixar buraco: item de
// menu sem marca nenhuma parece defeito, e foi exatamente assim que este bug se
// manifestou.
function MarcaDoTorneio({ slug, esmaecida }) {
  const [falhou, setFalhou] = useState(false)
  const marca = skinDoTorneio(slug).marca
  const src = falhou ? SKIN_FALLBACK.marca.src : marca.src

  return (
    <span className="w-5 h-5 shrink-0 flex items-center justify-center">
      <img
        src={src}
        alt=""
        width={20}
        height={20}
        onError={() => setFalhou(true)}
        className={`max-w-full max-h-full object-contain ${esmaecida ? 'opacity-60' : ''}`}
      />
    </span>
  )
}

function ChevronBaixo({ aberto, cor = 'text-slate' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`w-4 h-4 shrink-0 ${cor} transition-transform duration-200 ${
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
