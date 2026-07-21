import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTorneio } from '../context/TorneioContext'
import { carregarPerfis, getMatchPoints, carregarMatches } from '../lib/dados'
import { rotuloDoJogo } from '../lib/fases'
import Bandeira from '../components/Bandeira'
import EmptyPanel from '../components/EmptyPanel'
import Loader from '../components/Loader'

// Confronto direto (você vs amigo). TODOS os pontos vêm de get_match_points (mesma
// fórmula do ranking) — aqui só AGREGAMOS as linhas, nunca recalculamos pontos.

// Dia (Brasília) — fallback pra agrupar "melhor rodada" onde não existe rodada.
const fmtDiaKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
})

// Agrega as linhas de um usuário em métricas (pontos sempre da função).
function statsDe(rows) {
  const total = rows.reduce((s, r) => s + (r.pontos ?? 0), 0)
  const cravadas = rows.filter((r) => r.base === 5).length
  const pontuados = rows.filter((r) => (r.pontos ?? 0) > 0).length
  const aproveitamento = rows.length ? Math.round((100 * pontuados) / rows.length) : 0
  // "Melhor rodada": na liga a rodada é explícita (r.rodada); na Copa não existe
  // esse conceito, então cai no dia de Brasília, como era antes.
  const porRodada = {}
  for (const r of rows) {
    const k = r.rodada != null ? `r${r.rodada}` : fmtDiaKey.format(new Date(r.data_hora))
    porRodada[k] = (porRodada[k] ?? 0) + (r.pontos ?? 0)
  }
  const melhorRodada = Math.max(0, ...Object.values(porRodada))
  return { total, cravadas, aproveitamento, melhorRodada, jogos: rows.length }
}

export default function Confronto() {
  const { user } = useAuth()
  const torneio = useTorneio()
  const [perfis, setPerfis] = useState([])
  const [advId, setAdvId] = useState('')
  const [meusRows, setMeusRows] = useState(null)
  const [deleRows, setDeleRows] = useState(null)
  const [matchesMap, setMatchesMap] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [carregandoAdv, setCarregandoAdv] = useState(false)
  const [erro, setErro] = useState(null)

  // Carga inicial: perfis + meus pontos + nomes dos times.
  useEffect(() => {
    if (!user) return
    let cancelado = false
    async function carregar() {
      setCarregando(true)
      setErro(null)
      const [resP, resMe, resM] = await Promise.all([
        carregarPerfis(),
        getMatchPoints(user.id, torneio.slug),
        carregarMatches(torneio.id),
      ])
      if (cancelado) return
      if (resP.error || resMe.error || resM.error) {
        setErro((resP.error || resMe.error || resM.error).message)
        setCarregando(false)
        return
      }
      const outros = (resP.data ?? []).filter((p) => p.id !== user.id)
      setPerfis(outros)
      setMeusRows(resMe.data ?? [])
      setMatchesMap(Object.fromEntries((resM.data ?? []).map((m) => [m.id, m])))
      setAdvId(outros[0]?.id ?? '')
      setCarregando(false)
    }
    carregar()
    return () => { cancelado = true }
  }, [user, torneio.id, torneio.slug])

  // Pontos do adversário sempre que muda a seleção.
  useEffect(() => {
    if (!advId) { setDeleRows(null); return }
    let cancelado = false
    async function carregar() {
      setCarregandoAdv(true)
      const { data, error } = await getMatchPoints(advId, torneio.slug)
      if (cancelado) return
      setDeleRows(error ? [] : (data ?? []))
      setCarregandoAdv(false)
    }
    carregar()
    return () => { cancelado = true }
  }, [advId, torneio.slug])

  const meEu = useMemo(() => (meusRows ? statsDe(meusRows) : null), [meusRows])
  const meEle = useMemo(() => (deleRows ? statsDe(deleRows) : null), [deleRows])

  // Duelo jogo a jogo: só jogos que os DOIS palpitaram (interseção por match_id).
  const duelos = useMemo(() => {
    if (!meusRows || !deleRows) return []
    const meuPorId = Object.fromEntries(meusRows.map((r) => [r.match_id, r]))
    return deleRows
      .filter((r) => meuPorId[r.match_id])
      .map((r) => ({ meu: meuPorId[r.match_id], dele: r, match: matchesMap[r.match_id] }))
      .sort((a, b) => new Date(b.dele.data_hora) - new Date(a.dele.data_hora))
  }, [meusRows, deleRows, matchesMap])

  const placarDuelo = useMemo(() => {
    let v = 0, e = 0, d = 0
    for (const x of duelos) {
      const a = x.meu.pontos ?? 0
      const b = x.dele.pontos ?? 0
      if (a > b) v++
      else if (a < b) d++
      else e++
    }
    return { v, e, d }
  }, [duelos])

  const adversario = perfis.find((p) => p.id === advId)

  if (carregando) {
    return (
      <main className="max-w-[880px] mx-auto px-4 py-16 flex justify-center">
        <Loader />
      </main>
    )
  }
  if (erro) {
    return (
      <main className="max-w-[880px] mx-auto px-4 py-8">
        <p className="text-vermelho">Não consegui carregar: {erro}</p>
      </main>
    )
  }

  return (
    <main className="max-w-[880px] mx-auto px-4 py-8 sm:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight">CONFRONTO DIRETO</h1>
        <p className="mt-1 text-slate text-sm">Você contra um amigo, jogo a jogo. Mesmos pontos do ranking.</p>
      </header>

      {perfis.length === 0 ? (
        <EmptyPanel titulo="SÓ VOCÊ POR AQUI" mensagem="Ainda não há outros participantes pra comparar." />
      ) : (
        <>
          {/* Seletor de adversário */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-ink">Você</span>
            <span className="text-slate font-display text-xl">vs</span>
            <select
              value={advId}
              onChange={(e) => setAdvId(e.target.value)}
              className="flex-1 min-w-[160px] h-11 px-3 rounded-md border border-line bg-cloud text-ink font-semibold focus:outline-none focus:border-verde focus:ring-2 focus:ring-verde/30"
            >
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>{p.nome ?? 'sem nome'}</option>
              ))}
            </select>
          </div>

          {carregandoAdv || !meEle ? (
            <div className="py-12 flex justify-center"><Loader size={48} /></div>
          ) : (
            <>
              <Resumo eu={meEu} ele={meEle} nomeEle={adversario?.nome} />
              <Stats eu={meEu} ele={meEle} nomeEle={adversario?.nome} />
              <Duelo
                duelos={duelos}
                placar={placarDuelo}
                nomeEle={adversario?.nome}
              />
            </>
          )}
        </>
      )}
    </main>
  )
}

// Topo: quem lidera no total + os dois totais lado a lado.
function Resumo({ eu, ele, nomeEle }) {
  const dif = eu.total - ele.total
  const liderTxt =
    dif > 0 ? `Você lidera por ${dif}` : dif < 0 ? `${nomeEle} lidera por ${-dif}` : 'Empate técnico'
  return (
    <section className="bg-cloud rounded-lg border border-line shadow-soft p-5">
      <p className="text-center text-sm font-semibold text-slate mb-3">{liderTxt}</p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <LadoTotal nome="Você" total={eu.total} lidera={dif > 0} />
        <span className="font-display text-2xl text-slate">×</span>
        <LadoTotal nome={nomeEle ?? 'Amigo'} total={ele.total} lidera={dif < 0} />
      </div>
    </section>
  )
}

function LadoTotal({ nome, total, lidera }) {
  return (
    <div className="text-center min-w-0">
      <div className="font-semibold text-ink truncate">{nome}</div>
      <div className={`font-display text-5xl tnum leading-none mt-1 ${lidera ? 'text-verde' : 'text-ink'}`}>
        {total}
      </div>
      <div className="text-xs text-slate mt-0.5">pts</div>
    </div>
  )
}

// Métricas lado a lado; verde em quem lidera cada uma.
function Stats({ eu, ele, nomeEle }) {
  return (
    <section className="bg-cloud rounded-lg border border-line shadow-soft overflow-hidden">
      <div className="grid grid-cols-3 px-4 py-2.5 bg-paper border-b border-line text-xs font-bold uppercase tracking-wider text-slate">
        <span className="truncate">Você</span>
        <span className="text-center">métrica</span>
        <span className="text-right truncate">{nomeEle ?? 'Amigo'}</span>
      </div>
      <LinhaStat rotulo="Pontos" a={eu.total} b={ele.total} />
      <LinhaStat rotulo="Cravadas" a={eu.cravadas} b={ele.cravadas} />
      <LinhaStat rotulo="Aproveitamento" a={eu.aproveitamento} b={ele.aproveitamento} sufixo="%" />
      <LinhaStat rotulo="Melhor rodada" a={eu.melhorRodada} b={ele.melhorRodada} sufixo=" pts" />
    </section>
  )
}

function LinhaStat({ rotulo, a, b, sufixo = '' }) {
  const aLidera = a > b
  const bLidera = b > a
  return (
    <div className="grid grid-cols-3 items-center px-4 py-3 border-b border-line last:border-0">
      <span className={`font-display text-2xl tnum ${aLidera ? 'text-verde' : 'text-ink'}`}>
        {a}{sufixo}
      </span>
      <span className="text-center text-xs font-semibold text-slate">{rotulo}</span>
      <span className={`text-right font-display text-2xl tnum ${bLidera ? 'text-verde' : 'text-ink'}`}>
        {b}{sufixo}
      </span>
    </div>
  )
}

// Duelo jogo a jogo (só jogos que os dois palpitaram).
function Duelo({ duelos, placar, nomeEle }) {
  if (duelos.length === 0) {
    return (
      <EmptyPanel
        titulo="SEM CONFRONTO AINDA"
        mensagem={`Você e ${nomeEle ?? 'esse amigo'} ainda não palpitaram nos mesmos jogos já começados.`}
      />
    )
  }
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl tracking-tight text-ink">JOGO A JOGO</h2>
        <span className="text-sm font-semibold tnum text-slate">
          <span className="text-verde">{placar.v}V</span> · {placar.e}E ·{' '}
          <span className="text-vermelho">{placar.d}D</span>
        </span>
      </div>
      <ul className="space-y-3">
        {duelos.map((d) => (
          <LinhaDuelo key={d.dele.match_id} d={d} nomeEle={nomeEle} />
        ))}
      </ul>
    </section>
  )
}

function LinhaDuelo({ d, nomeEle }) {
  const { meu, dele, match } = d
  const a = meu.pontos ?? 0
  const b = dele.pontos ?? 0
  const euGanhou = a > b
  const eleGanhou = b > a

  return (
    <li className="bg-cloud rounded-lg border border-line shadow-soft p-4">
      <header className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-pill bg-ink text-paper text-xs font-bold uppercase tracking-wider">
          {rotuloDoJogo(meu)}
        </span>
        {match && (
          <span className="flex items-center gap-2 text-sm font-semibold text-ink min-w-0">
            <Bandeira time={match.time_casa} size={20} />
            <span className="tnum">{meu.gols_casa}×{meu.gols_fora}</span>
            <Bandeira time={match.time_fora} size={20} />
          </span>
        )}
      </header>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <LadoDuelo nome="Você" palpiteCasa={meu.palpite_casa} palpiteFora={meu.palpite_fora} pontos={a} ganhou={euGanhou} />
        <span className="text-xs font-bold text-slate uppercase">{euGanhou ? '◀' : eleGanhou ? '▶' : '='}</span>
        <LadoDuelo nome={nomeEle ?? 'Amigo'} palpiteCasa={dele.palpite_casa} palpiteFora={dele.palpite_fora} pontos={b} ganhou={eleGanhou} fim />
      </div>
    </li>
  )
}

function LadoDuelo({ nome, palpiteCasa, palpiteFora, pontos, ganhou, fim }) {
  return (
    <div className={`min-w-0 ${fim ? 'text-right' : ''}`}>
      <div className="text-xs text-slate truncate">{nome}</div>
      <div className="font-semibold text-ink tnum">{palpiteCasa} × {palpiteFora}</div>
      <span
        className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-pill text-xs font-bold tnum ${
          ganhou ? 'bg-verde text-cloud' : 'bg-line text-slate'
        }`}
      >
        {pontos === 0 ? '0 pts' : `+${pontos} pts`}
      </span>
    </div>
  )
}
