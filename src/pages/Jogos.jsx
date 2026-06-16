import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { calcularPontos } from '../lib/pontuacao'
import MatchCard from '../components/MatchCard'
import EmptyPanel from '../components/EmptyPanel'

// ⚠️ Fuso FIXO em Brasília — não usar o do navegador nem a data UTC crua.
// O seed grava com offset -03, então Brasília é a referência. Um jogo às 01:00 UTC
// (22h de Brasília do dia anterior) tem que cair no dia certo; errar o fuso parte
// um dia em dois.
const TZ = 'America/Sao_Paulo'

// Chave de agrupamento: 'YYYY-MM-DD' no fuso de Brasília. en-CA + formatToParts
// garante o formato ISO, que ordena cronologicamente como string.
const fmtChave = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
function chaveDiaBrasilia(iso) {
  const p = Object.fromEntries(
    fmtChave.formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  )
  return `${p.year}-${p.month}-${p.day}`
}

// Rótulo do cabeçalho: "Segunda · 15 jun" (dia da semana + data, pt-BR, Brasília).
const fmtRotulo = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'short',
})
function rotuloDia(iso) {
  const p = Object.fromEntries(
    fmtRotulo.formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  )
  // "segunda-feira" → "Segunda" (sentence case, sem "-feira"); "jun." → "jun".
  const dia = p.weekday.split('-')[0]
  const diaCap = dia.charAt(0).toUpperCase() + dia.slice(1)
  const mes = p.month.replace('.', '')
  return `${diaCap} · ${p.day} ${mes}`
}

// Resumo do dia derivado do estado dos jogos + palpites do usuário.
// • todos encerrados → soma dos pontos (fonte única: pontuacao.js).
// • senão → quantos jogos o usuário já palpitou (X/Y).
function resumoDoDia(jogos, palpites) {
  const todosEncerrados = jogos.every(
    (m) => m.gols_casa !== null && m.gols_fora !== null,
  )
  if (todosEncerrados) {
    const pontos = jogos.reduce((soma, m) => {
      const p = palpites[m.id]
      if (p?.palpite_casa == null || p?.palpite_fora == null) return soma
      const { pontos } = calcularPontos({
        palpiteCasa: p.palpite_casa,
        palpiteFora: p.palpite_fora,
        golsCasa: m.gols_casa,
        golsFora: m.gols_fora,
        fase: m.fase,
      })
      return soma + (pontos ?? 0)
    }, 0)
    return { tipo: 'encerrado', pontos }
  }
  const palpitados = jogos.filter((m) => {
    const p = palpites[m.id]
    return p?.palpite_casa != null && p?.palpite_fora != null
  }).length
  return { tipo: 'pendente', palpitados, total: jogos.length }
}

// Enfeite "ao vivo": jogo começou há no máx. 3h e ainda sem placar. Heurística —
// o resultado entra na mão (com atraso), então é só sinalização, não lógica crítica.
function temJogoAoVivo(jogos, agora) {
  const TRES_HORAS = 3 * 60 * 60 * 1000
  return jogos.some((m) => {
    const t = new Date(m.data_hora).getTime()
    return (
      t <= agora &&
      t >= agora - TRES_HORAS &&
      m.gols_casa === null &&
      m.gols_fora === null
    )
  })
}

// `titulo`/`subtitulo`/`renderCard` deixam o Admin reaproveitar ESTA mesma tela
// (fetch + agrupamento por dia + acordeão) trocando só o card por um com editor
// de placar. Sem props = comportamento normal do app.
export default function Jogos({
  titulo = 'JOGOS',
  subtitulo = '{subtitulo}',
  renderCard,
}) {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [palpites, setPalpites] = useState({}) // map por match_id
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  // Set de dias abertos (chave 'YYYY-MM-DD'). null = ainda não interagiu (usa o padrão).
  const [diasAbertos, setDiasAbertos] = useState(null)

  // Recarrega só os palpites — usado pelo onSaved sem flash de loading.
  const recarregarPalpites = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('predictions')
      .select('match_id, palpite_casa, palpite_fora')
      .eq('user_id', user.id)
    if (error) {
      console.error('[jogos] palpites:', error)
      return
    }
    const mapa = {}
    for (const p of data ?? []) mapa[p.match_id] = p
    setPalpites(mapa)
  }, [user])

  // Recarrega só os jogos — usado pelo Admin depois de editar um placar, pra a
  // lista (e o resumo do dia) refletirem o resultado novo.
  const recarregarMatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('data_hora', { ascending: true })
    if (error) {
      console.error('[jogos] matches:', error)
      return
    }
    setMatches(data ?? [])
  }, [])

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      setCarregando(true)
      setErro(null)
      const [resMatches, resPalpites] = await Promise.all([
        supabase.from('matches').select('*').order('data_hora', { ascending: true }),
        user
          ? supabase
              .from('predictions')
              .select('match_id, palpite_casa, palpite_fora')
              .eq('user_id', user.id)
          : Promise.resolve({ data: [], error: null }),
      ])
      if (cancelado) return

      if (resMatches.error) {
        setErro(resMatches.error.message)
        setCarregando(false)
        return
      }
      setMatches(resMatches.data ?? [])

      const mapa = {}
      for (const p of resPalpites.data ?? []) mapa[p.match_id] = p
      setPalpites(mapa)
      setCarregando(false)
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [user])

  // Agrupa os jogos por dia de Brasília. matches já vêm ordenados por data_hora asc
  // (fetch), então os dias e os jogos dentro de cada dia saem em ordem cronológica.
  const gruposPorDia = useMemo(() => {
    const mapa = new Map()
    for (const m of matches) {
      const chave = chaveDiaBrasilia(m.data_hora)
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave).push(m)
    }
    return [...mapa.entries()]
      .sort(([a], [b]) => a.localeCompare(b)) // 'YYYY-MM-DD' ordena = cronológico
      .map(([chave, jogos]) => ({ chave, jogos, rotulo: rotuloDia(jogos[0].data_hora) }))
  }, [matches])

  // Dia aberto por padrão: hoje (se tiver jogo); senão o próximo dia com jogo; se a
  // temporada acabou, o último. Sempre exatamente um grupo aberto no load.
  const hoje = chaveDiaBrasilia(new Date())
  const chaveInicial = useMemo(() => {
    if (gruposPorDia.length === 0) return null
    const deHoje = gruposPorDia.find((g) => g.chave === hoje)
    if (deHoje) return deHoje.chave
    const proximo = gruposPorDia.find((g) => g.chave > hoje)
    return (proximo ?? gruposPorDia[gruposPorDia.length - 1]).chave
  }, [gruposPorDia, hoje])

  // Antes da 1ª interação, abre só o dia inicial (sem flash, sem effect).
  const conjuntoAberto =
    diasAbertos ?? (chaveInicial ? new Set([chaveInicial]) : new Set())

  function alternarDia(chave) {
    setDiasAbertos((prev) => {
      const base = prev ?? (chaveInicial ? new Set([chaveInicial]) : new Set())
      const proximo = new Set(base)
      if (proximo.has(chave)) proximo.delete(chave)
      else proximo.add(chave)
      return proximo
    })
  }

  // Polish: cai direto no dia aberto ao montar (só se não for o primeiro da lista,
  // que já está no topo).
  const refDiaInicial = useRef(null)
  useEffect(() => {
    refDiaInicial.current?.scrollIntoView({ block: 'start' })
  }, [chaveInicial])

  if (carregando) {
    return (
      <main className="max-w-[720px] mx-auto px-4 py-8 text-slate">
        carregando jogos…
      </main>
    )
  }

  if (erro) {
    return (
      <main className="max-w-[720px] mx-auto px-4 py-8">
        <p className="text-vermelho">Não consegui carregar os jogos: {erro}</p>
      </main>
    )
  }

  // Tela inteira vazia: empty ilustrado no lugar do acordeão.
  if (matches.length === 0) {
    return (
      <main className="max-w-[720px] mx-auto px-4 py-8 sm:py-10 space-y-8">
        <header>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight">{titulo}</h1>
          <p className="mt-1 text-slate text-sm">
            {subtitulo}
          </p>
        </header>
        <EmptyPanel
          titulo="AINDA SEM JOGOS"
          mensagem="Espera o admin cadastrar os primeiros jogos."
        />
      </main>
    )
  }

  const agora = Date.now()

  // Card de cada jogo: o do app por padrão; o Admin injeta um com editor de placar.
  const desenharCard =
    renderCard ??
    ((m, ctx) => (
      <MatchCard match={m} palpite={ctx.palpite} onSaved={ctx.onSaved} />
    ))

  return (
    <main className="max-w-[720px] mx-auto px-4 py-8 sm:py-10">
      <header className="mb-6 sm:mb-8">
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight">{titulo}</h1>
        <p className="mt-1 text-slate text-sm">
          {subtitulo}
        </p>
      </header>

      <div className="space-y-3">
        {gruposPorDia.map((grupo, i) => (
          <DiaSecao
            key={grupo.chave}
            grupo={grupo}
            palpites={palpites}
            aberto={conjuntoAberto.has(grupo.chave)}
            ehHoje={grupo.chave === hoje}
            agora={agora}
            onToggle={alternarDia}
            onSaved={recarregarPalpites}
            recarregarMatches={recarregarMatches}
            renderCard={desenharCard}
            // ref só no dia inicial e só quando há dias antes dele (senão já está no topo).
            scrollRef={
              grupo.chave === chaveInicial && i > 0 ? refDiaInicial : undefined
            }
          />
        ))}
      </div>
    </main>
  )
}

// Um dia do acordeão: cabeçalho clicável (botão acessível) + lista de MatchCards.
function DiaSecao({ grupo, palpites, aberto, ehHoje, agora, onToggle, onSaved, recarregarMatches, renderCard, scrollRef }) {
  const resumo = resumoDoDia(grupo.jogos, palpites)
  const aoVivo = temJogoAoVivo(grupo.jogos, agora)
  const painelId = `dia-painel-${grupo.chave}`
  const botaoId = `dia-cab-${grupo.chave}`

  return (
    <section ref={scrollRef} className="scroll-mt-4">
      <h2 className="m-0">
        <button
          type="button"
          id={botaoId}
          aria-expanded={aberto}
          aria-controls={painelId}
          onClick={() => onToggle(grupo.chave)}
          className="w-full flex items-center gap-3 rounded-lg border border-line bg-cloud px-4 py-3.5 text-left shadow-soft transition-colors hover:bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-verde"
        >
          <Chevron aberto={aberto} />
          <span className="font-display text-xl sm:text-2xl tracking-tight text-ink leading-none">
            {grupo.rotulo}
          </span>

          {ehHoje && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-verde text-cloud text-[11px] font-bold uppercase tracking-wider">
              hoje
            </span>
          )}
          {aoVivo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-vermelho text-cloud text-[11px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-pill bg-cloud" aria-hidden="true" />
              ao vivo
            </span>
          )}

          <ResumoDia resumo={resumo} />
        </button>
      </h2>

      {aberto && (
        <div
          id={painelId}
          role="region"
          aria-labelledby={botaoId}
          className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
        >
          {grupo.jogos.map((m, i) => (
            <CardEntrada key={m.id} index={i}>
              {renderCard(m, { palpite: palpites[m.id], onSaved, recarregarMatches })}
            </CardEntrada>
          ))}
        </div>
      )}
    </section>
  )
}

// Resumo à direita do cabeçalho: "+N pts" (dia encerrado) ou "palpitou X/Y"
// (laranja = falta palpitar).
function ResumoDia({ resumo }) {
  if (resumo.tipo === 'encerrado') {
    return (
      <span className="ml-auto shrink-0 text-sm font-bold tnum text-verde">
        {resumo.pontos > 0 ? `+${resumo.pontos}` : resumo.pontos} pts
      </span>
    )
  }
  const incompleto = resumo.palpitados < resumo.total
  return (
    <span
      className={`ml-auto shrink-0 text-sm font-semibold tnum ${
        incompleto ? 'text-laranja' : 'text-slate'
      }`}
    >
      palpitou {resumo.palpitados}/{resumo.total}
    </span>
  )
}

// Chevron que gira ao abrir/fechar.
function Chevron({ aberto }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`w-5 h-5 shrink-0 text-slate transition-transform duration-200 ${
        aberto ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Wrapper só pra escalonar o fade-up sem mexer no MatchCard.
function CardEntrada({ index, children }) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${index * 40}ms` }}>
      {children}
    </div>
  )
}
