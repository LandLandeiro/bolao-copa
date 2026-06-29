import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { carregarMatches, carregarPalpites } from '../lib/dados'
import { salvarPalpite } from '../lib/palpite'
import { montarBracket, rodadaAtivaIndex, FASES_MATA } from '../lib/bracket'
import SeletorFases from '../components/bracket/SeletorFases'
import CardChave from '../components/bracket/CardChave'
import Loader from '../components/Loader'

// Visão Chaveamento (árvore do mata-mata). Mesmo componente em desktop e mobile —
// adapta por largura medida + breakpoint (SPEC §5). A edição de palpite é inline no
// card grande e via bottom-sheet no compacto (reusa o save da Lista, lib/palpite.js).

const GAP_CONECTOR = 16 // largura da coluna de conectores (px)
const SLOT_GRANDE = 172 // altura do "slot" vertical de cada card grande
const SLOT_COMPACTO = 66 // idem compacto

export default function Chaveamento() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [palpites, setPalpites] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [janela, setJanela] = useState(null) // {inicio, fim} em índices 0..4

  const arvoreRef = useRef(null)
  const [largura, setLargura] = useState(
    typeof window !== 'undefined' ? Math.min(window.innerWidth, 1120) : 720,
  )
  const [desktop, setDesktop] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 640px)').matches : true,
  )

  // Fetch (Supabase em prod, fixture em dev — ver lib/dados.js).
  useEffect(() => {
    let cancelado = false
    async function carregar() {
      setCarregando(true)
      setErro(null)
      const [resM, resP] = await Promise.all([
        carregarMatches(),
        user ? carregarPalpites(user.id) : Promise.resolve({ data: [], error: null }),
      ])
      if (cancelado) return
      if (resM.error) {
        setErro(resM.error.message)
        setCarregando(false)
        return
      }
      setMatches(resM.data ?? [])
      const mapa = {}
      for (const p of resP.data ?? []) mapa[p.match_id] = p
      setPalpites(mapa)
      setCarregando(false)
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [user])

  // Largura da árvore (decide grande ⇄ compacto).
  useEffect(() => {
    const el = arvoreRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setLargura(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [carregando])

  // Breakpoint (default da janela: 2 rodadas no desktop, 1 no mobile).
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const onChange = () => setDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const mata = useMemo(() => matches.filter((m) => m.fase !== 'grupos'), [matches])
  const bracket = useMemo(() => montarBracket(mata), [mata])
  const ativaIdx = useMemo(() => rodadaAtivaIndex(mata), [mata])

  // Define a janela padrão uma vez, quando os dados chegam.
  useEffect(() => {
    if (carregando || janela) return
    const fim = desktop ? Math.min(FASES_MATA.length - 1, ativaIdx + 1) : ativaIdx
    setJanela({ inicio: ativaIdx, fim })
  }, [carregando, janela, desktop, ativaIdx])

  // Salva um palpite de forma OTIMISTA: atualiza o indicador na hora e, se a escrita
  // for recusada (ex.: RLS — jogo já começou), faz rollback. Mesmo save da Lista.
  async function salvar(matchId, casa, fora) {
    const anterior = palpites[matchId]
    setPalpites((prev) => ({
      ...prev,
      [matchId]: { match_id: matchId, palpite_casa: casa, palpite_fora: fora },
    }))
    const { error, ehTrava } = await salvarPalpite({
      userId: user?.id,
      matchId,
      palpiteCasa: casa,
      palpiteFora: fora,
    })
    if (error) {
      setPalpites((prev) => {
        const cp = { ...prev }
        if (anterior) cp[matchId] = anterior
        else delete cp[matchId]
        return cp
      })
    }
    return { error, ehTrava }
  }

  if (carregando) {
    return (
      <div className="py-16 flex justify-center">
        <Loader />
      </div>
    )
  }
  if (erro) {
    return <p className="text-chave-r0 text-sm py-8">não consegui carregar: {erro}</p>
  }

  const j = janela ?? { inicio: 0, fim: desktop ? 1 : 0 }
  const nRodadas = j.fim - j.inicio + 1
  const terceiroVisivel = j.fim === FASES_MATA.length - 1
  const colsEfetivas = nRodadas + (terceiroVisivel ? 1 : 0)
  const colWidth = (largura - (colsEfetivas - 1) * GAP_CONECTOR) / colsEfetivas
  const variante = nRodadas <= 2 && colWidth >= 250 ? 'grande' : 'compacto'
  const modoLista = nRodadas === 1

  const rodadasVisiveis = bracket.rodadas.slice(j.inicio, j.fim + 1)
  const slot = variante === 'grande' ? SLOT_GRANDE : SLOT_COMPACTO
  const alturaArvore = rodadasVisiveis[0].jogos.length * slot

  return (
    <div className="space-y-5">
      <SeletorFases janela={j} onChange={setJanela} />

      <div ref={arvoreRef} className="overflow-x-hidden">
        {modoLista ? (
          // 1 rodada → lista vertical (cards grandes, sem conectores).
          <div className="flex flex-col gap-3 max-w-[420px] mx-auto">
            {rodadasVisiveis[0].jogos.map((m, i) => (
              <CardChave
                key={m?.id ?? `s${i}`}
                match={m}
                palpite={m ? palpites[m.id] : null}
                fase={rodadasVisiveis[0].fase}
                variante={variante}
                onSalvar={salvar}
              />
            ))}
            {terceiroVisivel && (
              <Terceiro terceiro={bracket.terceiro} variante={variante} palpites={palpites} onSalvar={salvar} />
            )}
          </div>
        ) : (
          // 2+ rodadas → árvore com conectores ortogonais.
          <div className="flex items-stretch" style={{ height: alturaArvore }}>
            {rodadasVisiveis.map((round, ci) => (
              <Fragment key={round.fase}>
                <Coluna round={round} palpites={palpites} variante={variante} onSalvar={salvar} />
                {ci < rodadasVisiveis.length - 1 && (
                  <Conectores nPais={rodadasVisiveis[ci + 1].jogos.length} />
                )}
              </Fragment>
            ))}
            {terceiroVisivel && (
              <ColunaTerceiro terceiro={bracket.terceiro} variante={variante} palpites={palpites} onSalvar={salvar} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Uma coluna da árvore: cards distribuídos por flex-1 → cada pai cai no meio do par
// de filhos automaticamente (propriedade do binário).
function Coluna({ round, palpites, variante, onSalvar }) {
  return (
    <div className="flex flex-col flex-1 min-w-0">
      {round.jogos.map((m, i) => (
        <div key={m?.id ?? `s${i}`} className="flex-1 flex items-center px-1.5">
          <div className="w-full">
            <CardChave
              match={m}
              palpite={m ? palpites[m.id] : null}
              fase={round.fase}
              variante={variante}
              onSalvar={onSalvar}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Coluna de conectores entre duas rodadas. Um grupo por pai (= nPais), cada um
// "abraçando" o par de filhos com cotovelo ortogonal. Stroke 1.6px (SPEC §3).
function Conectores({ nPais }) {
  return (
    <div className="flex flex-col shrink-0" style={{ width: GAP_CONECTOR }} aria-hidden="true">
      {Array.from({ length: nPais }, (_, i) => (
        <div key={i} className="relative flex-1">
          <span className="absolute left-0 w-1/2 h-[1.6px] bg-chave-conector" style={{ top: '25%' }} />
          <span className="absolute left-0 w-1/2 h-[1.6px] bg-chave-conector" style={{ top: '75%' }} />
          <span className="absolute left-1/2 w-[1.6px] bg-chave-conector" style={{ top: '25%', bottom: '25%' }} />
          <span className="absolute left-1/2 right-0 h-[1.6px] bg-chave-conector" style={{ top: '50%' }} />
        </div>
      ))}
    </div>
  )
}

// Disputa de 3º lugar — adjacente à Final (SPEC §9). Coluna própria, centralizada.
function ColunaTerceiro({ terceiro, variante, palpites, onSalvar }) {
  return (
    <div className="flex flex-col flex-1 min-w-0 justify-center">
      <Terceiro terceiro={terceiro} variante={variante} palpites={palpites} onSalvar={onSalvar} />
    </div>
  )
}

function Terceiro({ terceiro, variante, palpites, onSalvar }) {
  return (
    <div className="px-1.5">
      <p className="text-[10px] font-black uppercase tracking-[0.06em] text-chave-label mb-1.5 text-center">
        Disputa de 3º lugar
      </p>
      <CardChave
        match={terceiro}
        palpite={terceiro ? palpites[terceiro.id] : null}
        fase="terceiro"
        variante={variante}
        onSalvar={onSalvar}
      />
    </div>
  )
}
