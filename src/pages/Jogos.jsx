import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { carregarMatches, carregarPalpites } from '../lib/dados'
import { calcularPontos } from '../lib/pontuacao'
import { ORDEM_FASES, ehMataMata, rotuloRodada } from '../lib/fases'
import MatchCard from '../components/MatchCard'
import EmptyPanel from '../components/EmptyPanel'
import Loader from '../components/Loader'

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
  // Estado de colapso em 3 níveis. null = ainda não interagiu → usa o padrão (abre
  // a fase ativa). NÃO persistir (sem localStorage): a fonte da verdade é o Supabase.
  const [blocosAbertos, setBlocosAbertos] = useState(null) // 'grupos' | 'mata'
  const [diasAbertos, setDiasAbertos] = useState(null) // chave 'YYYY-MM-DD' (dentro de grupos)
  const [rodadasAbertas, setRodadasAbertas] = useState(null) // fase do mata-mata

  // Recarrega só os palpites — usado pelo onSaved sem flash de loading.
  const recarregarPalpites = useCallback(async () => {
    if (!user) return
    const { data, error } = await carregarPalpites(user.id)
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
    const { data, error } = await carregarMatches()
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
        carregarMatches(),
        user ? carregarPalpites(user.id) : Promise.resolve({ data: [], error: null }),
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

  // Separa os dois blocos de cima. matches já vêm ordenados por data_hora asc, então
  // ambas as listas preservam a ordem cronológica.
  const jogosGrupos = useMemo(() => matches.filter((m) => !ehMataMata(m.fase)), [matches])
  const jogosMata = useMemo(() => matches.filter((m) => ehMataMata(m.fase)), [matches])

  // Dentro de "Fase de Grupos": agrupa por dia de Brasília (igual a antes). Dias e
  // jogos dentro de cada dia saem em ordem cronológica.
  const gruposPorDia = useMemo(() => {
    const mapa = new Map()
    for (const m of jogosGrupos) {
      const chave = chaveDiaBrasilia(m.data_hora)
      if (!mapa.has(chave)) mapa.set(chave, [])
      mapa.get(chave).push(m)
    }
    return [...mapa.entries()]
      .sort(([a], [b]) => a.localeCompare(b)) // 'YYYY-MM-DD' ordena = cronológico
      .map(([chave, jogos]) => ({ chave, jogos, rotulo: rotuloDia(jogos[0].data_hora) }))
  }, [jogosGrupos])

  // Dentro de "Mata-Mata": agrupa por rodada (NÃO por dia), na ordem fixa do torneio.
  const rodadas = useMemo(() => {
    const mapa = new Map()
    for (const m of jogosMata) {
      if (!mapa.has(m.fase)) mapa.set(m.fase, [])
      mapa.get(m.fase).push(m)
    }
    return ORDEM_FASES.filter((f) => mapa.has(f)).map((f) => ({
      fase: f,
      rotulo: rotuloRodada(f),
      jogos: mapa.get(f),
    }))
  }, [jogosMata])

  // Fase "ativa" = a do jogo de referência (hoje, senão o próximo, senão o último).
  // Decide qual bloco/rodada/dia abre por padrão. matches está ordenado asc, então
  // o .find pega o primeiro jogo de hoje / o próximo mais cedo.
  const hoje = chaveDiaBrasilia(new Date())
  const faseAtiva = useMemo(() => {
    if (matches.length === 0) return null
    const deHoje = matches.find((m) => chaveDiaBrasilia(m.data_hora) === hoje)
    const proximo = matches.find((m) => chaveDiaBrasilia(m.data_hora) > hoje)
    return (deHoje ?? proximo ?? matches[matches.length - 1]).fase
  }, [matches, hoje])

  const blocoAtivo = faseAtiva == null ? null : ehMataMata(faseAtiva) ? 'mata' : 'grupos'
  const rodadaAtiva = faseAtiva && ehMataMata(faseAtiva) ? faseAtiva : null

  // --- Nível 1: blocos "Fase de Grupos" / "Mata-Mata" ---
  // Antes da 1ª interação, abre só o bloco da fase ativa.
  const blocosVisiveis = blocosAbertos ?? (blocoAtivo ? new Set([blocoAtivo]) : new Set())
  function alternarBloco(id) {
    setBlocosAbertos((prev) => {
      const base = prev ?? (blocoAtivo ? new Set([blocoAtivo]) : new Set())
      const proximo = new Set(base)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  // --- Nível 2a: dias dentro de "Fase de Grupos" ---
  // Dia aberto por padrão: hoje (se tiver jogo de grupos); senão o próximo; senão o
  // último. Mantém o comportamento de antes da reorganização.
  const chaveInicial = useMemo(() => {
    if (gruposPorDia.length === 0) return null
    const deHoje = gruposPorDia.find((g) => g.chave === hoje)
    if (deHoje) return deHoje.chave
    const proximo = gruposPorDia.find((g) => g.chave > hoje)
    return (proximo ?? gruposPorDia[gruposPorDia.length - 1]).chave
  }, [gruposPorDia, hoje])

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

  // --- Nível 2b: rodadas dentro de "Mata-Mata" ---
  // Abre a rodada ativa; se a ativa não for do mata-mata, abre a primeira rodada.
  const rodadaPadrao = rodadaAtiva ?? rodadas[0]?.fase ?? null
  const rodadasVisiveis =
    rodadasAbertas ?? (rodadaPadrao ? new Set([rodadaPadrao]) : new Set())
  function alternarRodada(fase) {
    setRodadasAbertas((prev) => {
      const base = prev ?? (rodadaPadrao ? new Set([rodadaPadrao]) : new Set())
      const proximo = new Set(base)
      if (proximo.has(fase)) proximo.delete(fase)
      else proximo.add(fase)
      return proximo
    })
  }

  // Polish: cai direto no bloco da fase ativa ao montar, quando ele não é o primeiro
  // (ou seja, quando o mata-mata é o ativo e tem a fase de grupos acima).
  const refBlocoAtivo = useRef(null)
  useEffect(() => {
    refBlocoAtivo.current?.scrollIntoView({ block: 'start' })
  }, [blocoAtivo])

  if (carregando) {
    return (
      <main className="max-w-[720px] mx-auto px-4 py-16 flex justify-center">
        <Loader />
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

      <div className="space-y-4">
        {/* Bloco 1: Fase de Grupos — mantém o acordeão por dia exatamente como antes. */}
        {jogosGrupos.length > 0 && (
          <BlocoSecao
            id="grupos"
            rotulo="Fase de Grupos"
            contagem={jogosGrupos.length}
            aberto={blocosVisiveis.has('grupos')}
            onToggle={alternarBloco}
          >
            <div className="space-y-3">
              {gruposPorDia.map((grupo) => (
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
                />
              ))}
            </div>
          </BlocoSecao>
        )}

        {/* Bloco 2: Mata-Mata — agrupa por rodada (não por dia). */}
        {jogosMata.length > 0 && (
          <BlocoSecao
            id="mata"
            rotulo="Mata-Mata"
            contagem={jogosMata.length}
            aberto={blocosVisiveis.has('mata')}
            onToggle={alternarBloco}
            // só rola até aqui quando o mata-mata é a fase ativa (e tem grupos acima).
            scrollRef={blocoAtivo === 'mata' ? refBlocoAtivo : undefined}
          >
            <div className="space-y-3">
              {rodadas.map((rodada) => (
                <RodadaSecao
                  key={rodada.fase}
                  rodada={rodada}
                  palpites={palpites}
                  aberto={rodadasVisiveis.has(rodada.fase)}
                  ehAtiva={rodada.fase === rodadaAtiva}
                  agora={agora}
                  onToggle={alternarRodada}
                  onSaved={recarregarPalpites}
                  recarregarMatches={recarregarMatches}
                  renderCard={desenharCard}
                />
              ))}
            </div>
          </BlocoSecao>
        )}
      </div>
    </main>
  )
}

// Bloco de nível 1 (Fase de Grupos / Mata-Mata): cabeçalho forte (ink/paper) que
// expande/recolhe o conteúdo. Visualmente acima dos sub-cabeçalhos de dia/rodada.
function BlocoSecao({ id, rotulo, contagem, aberto, onToggle, scrollRef, children }) {
  const painelId = `bloco-painel-${id}`
  const botaoId = `bloco-cab-${id}`
  return (
    <section ref={scrollRef} className="scroll-mt-4">
      <h2 className="m-0">
        <button
          type="button"
          id={botaoId}
          aria-expanded={aberto}
          aria-controls={painelId}
          onClick={() => onToggle(id)}
          className="w-full flex items-center gap-3 rounded-lg bg-ink px-4 py-4 text-left text-paper shadow-soft transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-verde focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <Chevron aberto={aberto} cor="text-paper/70" />
          <span className="font-display text-2xl sm:text-3xl tracking-tight leading-none">
            {rotulo}
          </span>
          <span className="ml-auto shrink-0 text-xs font-semibold tnum text-paper/60">
            {contagem} {contagem === 1 ? 'jogo' : 'jogos'}
          </span>
        </button>
      </h2>

      {aberto && (
        <div id={painelId} role="region" aria-labelledby={botaoId} className="mt-3">
          {children}
        </div>
      )}
    </section>
  )
}

// Um dia do acordeão: cabeçalho clicável (botão acessível) + lista de MatchCards.
function DiaSecao({ grupo, palpites, aberto, ehHoje, agora, onToggle, onSaved, recarregarMatches, renderCard }) {
  const resumo = resumoDoDia(grupo.jogos, palpites)
  const aoVivo = temJogoAoVivo(grupo.jogos, agora)
  const painelId = `dia-painel-${grupo.chave}`
  const botaoId = `dia-cab-${grupo.chave}`

  return (
    <section className="scroll-mt-4">
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

// Uma rodada do mata-mata (16-avos, oitavas, …): cabeçalho clicável + grade de
// MatchCards. Mesma mecânica/visual do DiaSecao, mas agrupa por fase, não por dia.
function RodadaSecao({ rodada, palpites, aberto, ehAtiva, agora, onToggle, onSaved, recarregarMatches, renderCard }) {
  const resumo = resumoDoDia(rodada.jogos, palpites)
  const aoVivo = temJogoAoVivo(rodada.jogos, agora)
  const painelId = `rodada-painel-${rodada.fase}`
  const botaoId = `rodada-cab-${rodada.fase}`

  return (
    <section className="scroll-mt-4">
      <h2 className="m-0">
        <button
          type="button"
          id={botaoId}
          aria-expanded={aberto}
          aria-controls={painelId}
          onClick={() => onToggle(rodada.fase)}
          className="w-full flex items-center gap-3 rounded-lg border border-line bg-cloud px-4 py-3.5 text-left shadow-soft transition-colors hover:bg-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-verde"
        >
          <Chevron aberto={aberto} />
          <span className="font-display text-xl sm:text-2xl tracking-tight text-ink leading-none">
            {rodada.rotulo}
          </span>

          {ehAtiva && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-verde text-cloud text-[11px] font-bold uppercase tracking-wider">
              atual
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
          {rodada.jogos.map((m, i) => (
            <CardEntrada key={m.id} index={i}>
              {renderCard(m, { palpite: palpites[m.id], onSaved, recarregarMatches })}
            </CardEntrada>
          ))}
        </div>
      )}
    </section>
  )
}

// Resumo à direita do cabeçalho: "+N pts" (dia/rodada encerrado) ou "palpitou X/Y"
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

// Chevron que gira ao abrir/fechar. `cor` ajusta o tom (claro nos blocos ink).
function Chevron({ aberto, cor = 'text-slate' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`w-5 h-5 shrink-0 ${cor} transition-transform duration-200 ${
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
