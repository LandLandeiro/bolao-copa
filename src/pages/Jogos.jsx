import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTorneio } from '../context/TorneioContext'
import { carregarMatches, carregarPalpites } from '../lib/dados'
import { calcularPontos } from '../lib/pontuacao'
import { ORDEM_FASES, ehMataMata, rotuloRodada } from '../lib/fases'
import { prazoDaRodada, ordemPorData } from '../lib/prazo'
import { skinDoTorneio } from '../lib/skin'
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

// Resumo de uma seção (dia, rodada do mata-mata ou rodada da liga) derivado do
// estado dos jogos + palpites do usuário.
// • todos encerrados → soma dos pontos (fonte única: pontuacao.js).
// • senão → quantos jogos o usuário já palpitou (X/Y).
function resumoDaSecao(jogos, palpites) {
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
    if (!m.data_hora) return false // sem data marcada não dá pra saber
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
// (fetch + agrupamento + acordeão) trocando só o card por um com editor de placar.
// Sem props = comportamento normal do app.
//
// O TORNEIO vem do contexto (rota), e com ele o FORMATO, que decide o agrupamento:
//   • 'mata-mata'      (Copa) → blocos "Fase de Grupos" (por dia) + "Mata-Mata" (por fase)
//   • 'pontos-corridos' (liga) → lista plana de rodadas ("Rodada 20", "Rodada 21"…)
export default function Jogos({ titulo = 'JOGOS', subtitulo, renderCard }) {
  const { user } = useAuth()
  const torneio = useTorneio()
  const ehLiga = torneio.formato === 'pontos-corridos'
  // Skin do torneio da rota. Na Copa devolve o visual base — as mesmas classes de
  // sempre, então a aba dela não muda em nada. Ver lib/skin.js.
  const skin = skinDoTorneio(torneio.slug)

  const [matches, setMatches] = useState([])
  const [palpites, setPalpites] = useState({}) // map por match_id
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  // Estado de colapso. null = ainda não interagiu → usa o padrão (abre a seção
  // ativa). NÃO persistir (sem localStorage): a fonte da verdade é o Supabase.
  const [blocosAbertos, setBlocosAbertos] = useState(null) // 'grupos' | 'mata'
  const [diasAbertos, setDiasAbertos] = useState(null) // chave 'YYYY-MM-DD' (dentro de grupos)
  const [rodadasAbertas, setRodadasAbertas] = useState(null) // fase do mata-mata
  const [rodadasLigaAbertas, setRodadasLigaAbertas] = useState(null) // 'rodada-20', …

  // Recarrega só os palpites — usado pelo onSaved sem flash de loading.
  const recarregarPalpites = useCallback(async () => {
    if (!user) return
    const { data, error } = await carregarPalpites(user.id, torneio.id)
    if (error) {
      console.error('[jogos] palpites:', error)
      return
    }
    const mapa = {}
    for (const p of data ?? []) mapa[p.match_id] = p
    setPalpites(mapa)
  }, [user, torneio.id])

  // Recarrega só os jogos — usado pelo Admin depois de editar um placar, pra a
  // lista (e o resumo da seção) refletirem o resultado novo.
  const recarregarMatches = useCallback(async () => {
    const { data, error } = await carregarMatches(torneio.id)
    if (error) {
      console.error('[jogos] matches:', error)
      return
    }
    setMatches(data ?? [])
  }, [torneio.id])

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      setCarregando(true)
      setErro(null)
      const [resMatches, resPalpites] = await Promise.all([
        carregarMatches(torneio.id),
        user
          ? carregarPalpites(user.id, torneio.id)
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
  }, [user, torneio.id])

  // ---------------- Agrupamento: LIGA (pontos corridos) ----------------
  // Uma seção por rodada, em ordem crescente; dentro da rodada, por data_hora com
  // NULLS LAST — os jogos "a definir" ficam no fim do grupo.
  const secoesLiga = useMemo(() => {
    if (!ehLiga) return []
    const mapa = new Map()
    for (const m of matches) {
      if (m.rodada == null) continue
      if (!mapa.has(m.rodada)) mapa.set(m.rodada, [])
      mapa.get(m.rodada).push(m)
    }
    return [...mapa.entries()]
      .sort(([a], [b]) => a - b)
      .map(([rodada, jogos]) => ({
        chave: `rodada-${rodada}`,
        rotulo: `Rodada ${rodada}`,
        jogos: jogos.slice().sort(ordemPorData),
        // Prazo dos jogos SEM data desta rodada = menor data_hora não-nula dela.
        // Sai dos jogos JÁ CARREGADOS — nada de query nova. null = rodada inteira
        // sem data, e aí ela segue aberta (igual ao 'infinity' do palpite_aberto).
        prazo: prazoDaRodada(jogos),
      }))
  }, [matches, ehLiga])

  // RODADA ATUAL = a MENOR rodada que ainda tem pelo menos um jogo sem resultado.
  // É ela que abre por padrão e leva o badge. Campeonato todo lançado (nenhuma
  // pendente) → destaca a última, pra a tela não abrir toda recolhida.
  const rodadaAtualChave = useMemo(() => {
    if (secoesLiga.length === 0) return null
    const pendente = secoesLiga.find((s) => s.jogos.some((m) => m.gols_casa === null))
    return (pendente ?? secoesLiga[secoesLiga.length - 1]).chave
  }, [secoesLiga])

  const ligaVisiveis =
    rodadasLigaAbertas ?? (rodadaAtualChave ? new Set([rodadaAtualChave]) : new Set())
  function alternarRodadaLiga(chave) {
    setRodadasLigaAbertas((prev) => {
      const base = prev ?? (rodadaAtualChave ? new Set([rodadaAtualChave]) : new Set())
      const proximo = new Set(base)
      if (proximo.has(chave)) proximo.delete(chave)
      else proximo.add(chave)
      return proximo
    })
  }

  // ---------------- Agrupamento: MATA-MATA (Copa) ----------------
  // Tudo daqui pra baixo só roda em torneio de mata-mata (na liga sai vazio de
  // cara): agrupar liga por dia não faz sentido e ainda esbarraria nos jogos sem
  // data marcada, que não têm dia nenhum.
  //
  // Separa os dois blocos de cima. matches já vêm ordenados por data_hora asc, então
  // ambas as listas preservam a ordem cronológica.
  const jogosGrupos = useMemo(
    () => (ehLiga ? [] : matches.filter((m) => !ehMataMata(m.fase))),
    [matches, ehLiga],
  )
  const jogosMata = useMemo(
    () => (ehLiga ? [] : matches.filter((m) => ehMataMata(m.fase))),
    [matches, ehLiga],
  )

  // Dentro de "Fase de Grupos": agrupa por dia de Brasília. Dias e jogos dentro de
  // cada dia saem em ordem cronológica.
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

  // Dentro de "Mata-Mata": agrupa por fase (NÃO por dia), na ordem fixa do torneio.
  const rodadas = useMemo(() => {
    const mapa = new Map()
    for (const m of jogosMata) {
      if (!mapa.has(m.fase)) mapa.set(m.fase, [])
      mapa.get(m.fase).push(m)
    }
    return ORDEM_FASES.filter((f) => mapa.has(f)).map((f) => ({
      chave: f,
      rotulo: rotuloRodada(f),
      jogos: mapa.get(f),
    }))
  }, [jogosMata])

  // Fase "ativa" = a do jogo de referência (hoje, senão o próximo, senão o último).
  // Decide qual bloco/rodada/dia abre por padrão. matches está ordenado asc, então
  // o .find pega o primeiro jogo de hoje / o próximo mais cedo.
  const hoje = chaveDiaBrasilia(new Date())
  const faseAtiva = useMemo(() => {
    if (ehLiga || matches.length === 0) return null
    const comData = matches.filter((m) => m.data_hora)
    if (comData.length === 0) return null
    const deHoje = comData.find((m) => chaveDiaBrasilia(m.data_hora) === hoje)
    const proximo = comData.find((m) => chaveDiaBrasilia(m.data_hora) > hoje)
    return (deHoje ?? proximo ?? comData[comData.length - 1]).fase
  }, [matches, hoje, ehLiga])

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
  // último.
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

  // --- Nível 2b: fases dentro de "Mata-Mata" ---
  // Abre a fase ativa; se a ativa não for do mata-mata, abre a primeira.
  const rodadaPadrao = rodadaAtiva ?? rodadas[0]?.chave ?? null
  const rodadasVisiveis =
    rodadasAbertas ?? (rodadaPadrao ? new Set([rodadaPadrao]) : new Set())
  function alternarRodada(chave) {
    setRodadasAbertas((prev) => {
      const base = prev ?? (rodadaPadrao ? new Set([rodadaPadrao]) : new Set())
      const proximo = new Set(base)
      if (proximo.has(chave)) proximo.delete(chave)
      else proximo.add(chave)
      return proximo
    })
  }

  // Polish: cai direto no bloco da fase ativa ao montar, quando ele não é o primeiro
  // (ou seja, quando o mata-mata é o ativo e tem a fase de grupos acima).
  const refBlocoAtivo = useRef(null)
  useEffect(() => {
    if (ehLiga) return
    refBlocoAtivo.current?.scrollIntoView({ block: 'start' })
  }, [blocoAtivo, ehLiga])

  // Subtítulo padrão conta a regra do torneio da vez (o Admin sobrescreve com o seu).
  const subtituloFinal =
    subtitulo ??
    (torneio.encerrado
      ? `Arquivo do ${torneio.nome} — resultados e pontuação final.`
      : ehLiga
      ? 'Todas as rodadas liberadas pra palpite. Cada jogo trava no apito inicial.'
      : 'Palpite nos jogos abertos. Cada jogo trava no apito inicial.')

  const cabecalho = (
    <header className="mb-6 sm:mb-8">
      <h1 className={`${skin.fonteDisplay} text-4xl sm:text-5xl tracking-tight`}>
        {titulo}
      </h1>
      <p className="mt-1 text-slate text-sm">{subtituloFinal}</p>
    </header>
  )

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
        {cabecalho}
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
      <MatchCard
        match={m}
        palpite={ctx.palpite}
        onSaved={ctx.onSaved}
        prazoRodada={ctx.prazoRodada}
      />
    ))

  const propsComuns = {
    palpites,
    agora,
    skin,
    onSaved: recarregarPalpites,
    recarregarMatches,
    renderCard: desenharCard,
  }

  return (
    <main className="max-w-[720px] mx-auto px-4 py-8 sm:py-10">
      {cabecalho}

      {ehLiga ? (
        /* LIGA: lista plana de rodadas — sem os blocos Grupos/Mata-Mata, que não
           existem em pontos corridos. A rodada atual já vem aberta e destacada. */
        <div className="space-y-3">
          {secoesLiga.map((secao) => (
            <SecaoJogos
              key={secao.chave}
              secao={secao}
              aberto={ligaVisiveis.has(secao.chave)}
              badge={secao.chave === rodadaAtualChave ? 'rodada atual' : null}
              onToggle={alternarRodadaLiga}
              {...propsComuns}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bloco 1: Fase de Grupos — acordeão por dia. */}
          {jogosGrupos.length > 0 && (
            <BlocoSecao
              id="grupos"
              rotulo="Fase de Grupos"
              contagem={jogosGrupos.length}
              aberto={blocosVisiveis.has('grupos')}
              onToggle={alternarBloco}
            >
              <div className="space-y-3">
                {gruposPorDia.map((secao) => (
                  <SecaoJogos
                    key={secao.chave}
                    secao={secao}
                    aberto={conjuntoAberto.has(secao.chave)}
                    badge={secao.chave === hoje ? 'hoje' : null}
                    onToggle={alternarDia}
                    {...propsComuns}
                  />
                ))}
              </div>
            </BlocoSecao>
          )}

          {/* Bloco 2: Mata-Mata — agrupa por fase (não por dia). */}
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
                {rodadas.map((secao) => (
                  <SecaoJogos
                    key={secao.chave}
                    secao={secao}
                    aberto={rodadasVisiveis.has(secao.chave)}
                    badge={secao.chave === rodadaAtiva ? 'atual' : null}
                    onToggle={alternarRodada}
                    {...propsComuns}
                  />
                ))}
              </div>
            </BlocoSecao>
          )}
        </div>
      )}
    </main>
  )
}

// Bloco de nível 1 (Fase de Grupos / Mata-Mata): cabeçalho forte (ink/paper) que
// expande/recolhe o conteúdo. Visualmente acima dos sub-cabeçalhos de dia/rodada.
// Só o mata-mata usa — a liga é lista plana de rodadas.
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

// UMA seção do acordeão: cabeçalho clicável (botão acessível) + grade de cards.
// Serve aos três agrupamentos — dia da fase de grupos, fase do mata-mata e rodada
// da liga — porque só muda o rótulo e o `badge` ("hoje" / "atual" / "rodada atual").
// `secao` = { chave, rotulo, jogos }.
function SecaoJogos({
  secao,
  palpites,
  aberto,
  badge,
  agora,
  skin,
  onToggle,
  onSaved,
  recarregarMatches,
  renderCard,
}) {
  const resumo = resumoDaSecao(secao.jogos, palpites)
  const aoVivo = temJogoAoVivo(secao.jogos, agora)
  const painelId = `secao-painel-${secao.chave}`
  const botaoId = `secao-cab-${secao.chave}`

  return (
    <section className="scroll-mt-4">
      <h2 className="m-0">
        <button
          type="button"
          id={botaoId}
          aria-expanded={aberto}
          aria-controls={painelId}
          onClick={() => onToggle(secao.chave)}
          // Estrutura fixa aqui; cor/fonte vêm do skin (faixa verde campo no
          // Brasileirão, cartão branco no resto).
          className={`w-full flex items-center gap-3 rounded-lg px-4 py-3.5 text-left shadow-soft transition-colors focus:outline-none focus-visible:ring-2 ${skin.secaoCab}`}
        >
          <Chevron aberto={aberto} cor={skin.secaoChevron} />
          <span
            className={`text-xl sm:text-2xl tracking-tight leading-none ${skin.secaoTitulo}`}
          >
            {secao.rotulo}
          </span>

          {badge && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${skin.badgeAtual}`}
            >
              {badge}
            </span>
          )}
          {aoVivo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-vermelho text-cloud text-[11px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-pill bg-cloud" aria-hidden="true" />
              ao vivo
            </span>
          )}

          <ResumoSecao resumo={resumo} skin={skin} />
        </button>
      </h2>

      {aberto && (
        <div
          id={painelId}
          role="region"
          aria-labelledby={botaoId}
          className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5"
        >
          {secao.jogos.map((m, i) => (
            <CardEntrada key={m.id} index={i}>
              {renderCard(m, {
                palpite: palpites[m.id],
                onSaved,
                recarregarMatches,
                // Prazo da rodada, pros jogos sem data marcada. Só a liga tem
                // (as seções da Copa são dia/fase, não rodada) — lá vem null e o
                // card se resolve pelo próprio data_hora.
                prazoRodada: secao.prazo ?? null,
              })}
            </CardEntrada>
          ))}
        </div>
      )}
    </section>
  )
}

// Resumo à direita do cabeçalho: "+N pts" (seção encerrada) ou "palpitou X/Y"
// (laranja = falta palpitar).
// As cores vêm do skin porque este texto fica DENTRO do cabeçalho: no Brasileirão o
// fundo é verde escuro, e o verde/laranja/cinza do visual base sumiriam ali.
function ResumoSecao({ resumo, skin }) {
  if (resumo.tipo === 'encerrado') {
    return (
      <span className={`ml-auto shrink-0 text-sm font-bold tnum ${skin.resumoPontos}`}>
        {resumo.pontos > 0 ? `+${resumo.pontos}` : resumo.pontos} pts
      </span>
    )
  }
  const incompleto = resumo.palpitados < resumo.total
  return (
    <span
      className={`ml-auto shrink-0 text-sm font-semibold tnum ${
        incompleto ? skin.resumoFalta : skin.resumoOk
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
