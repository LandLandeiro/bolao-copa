// Modal: ao tocar num usuário no Ranking, mostra os palpites dele nos jogos que
// JÁ COMEÇARAM, com resultado real e pontos (base × peso) por jogo + total no topo.
// Segurança é da RLS de predictions (só devolve palpite de outro usuário se o jogo
// já começou) — aqui não há filtro de segurança no cliente, só exibição.
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTorneio } from '../context/TorneioContext'
import { calcularPontos } from '../lib/pontuacao'
import { rotuloDoJogo } from '../lib/fases'
import { chipDePontos } from '../lib/pontos'
import Bandeira from './Bandeira'
import Loader from './Loader'

const fmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

export default function PalpitesUsuario({ userId, nome, onClose, _mockJogos }) {
  const torneio = useTorneio()
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [jogos, setJogos] = useState([])
  const dialogRef = useRef(null)

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      setCarregando(true)
      setErro(null)
      if (_mockJogos) { setJogos(_mockJogos); setCarregando(false); return }
      // `matches!inner` + filtro por torneio_id: sem o join INTERNO viriam também os
      // palpites do outro bolão (o embed sozinho filtra o objeto, não a linha).
      const { data, error } = await supabase
        .from('predictions')
        .select(
          'palpite_casa, palpite_fora, matches!inner(id, time_casa, time_fora, fase, rodada, data_hora, gols_casa, gols_fora, torneio_id)',
        )
        .eq('user_id', userId)
        .eq('matches.torneio_id', torneio.id)
      if (cancelado) return
      if (error) {
        setErro(error.message)
        setCarregando(false)
        return
      }
      // A RLS já restringe OUTROS usuários a jogos começados. Pro PRÓPRIO usuário ela
      // também devolve palpites futuros — filtro client-side por data_hora <= agora pra
      // a visão ficar idêntica à dos outros (e bater com o que o get_leaderboard conta).
      // Jogo sem data marcada não começou: fica de fora (e nunca vai pro Intl).
      const agora = Date.now()
      const lista = (data ?? [])
        .filter(
          (p) =>
            p.matches?.data_hora && new Date(p.matches.data_hora).getTime() <= agora,
        )
        .sort((a, b) => new Date(b.matches.data_hora) - new Date(a.matches.data_hora)) // mais recente primeiro
      setJogos(lista)
      setCarregando(false)
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [userId, torneio.id])

  // A11y: foco preso no modal, Esc fecha, restaura o foco ao fechar, trava scroll de fundo.
  useEffect(() => {
    const anterior = document.activeElement
    const node = dialogRef.current
    node?.focus()
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab' && node) {
        const foco = node.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (foco.length === 0) return
        const primeiro = foco[0]
        const ultimo = foco[foco.length - 1]
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault()
          ultimo.focus()
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault()
          primeiro.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey, true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = ''
      if (anterior instanceof HTMLElement) anterior.focus()
    }
  }, [onClose])

  const total = jogos.reduce((soma, p) => {
    const { pontos } = calcularPontos({
      palpiteCasa: p.palpite_casa,
      palpiteFora: p.palpite_fora,
      golsCasa: p.matches.gols_casa,
      golsFora: p.matches.gols_fora,
      fase: p.matches.fase,
    })
    return soma + (pontos ?? 0)
  }, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="palpites-titulo"
        tabIndex={-1}
        className="relative w-full sm:max-w-[560px] max-h-[90vh] sm:max-h-[85vh] bg-paper rounded-t-xl sm:rounded-xl shadow-hard flex flex-col outline-none animate-fade-up"
      >
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-line">
          <div className="min-w-0">
            <h2
              id="palpites-titulo"
              className="font-display text-2xl sm:text-3xl tracking-tight text-ink truncate"
            >
              PALPITES DE {(nome ?? 'JOGADOR').toUpperCase()}
            </h2>
            <p className="text-xs text-slate mt-0.5">Só jogos que já começaram.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 w-10 h-10 rounded-pill border border-line text-ink hover:bg-line/60 flex items-center justify-center text-lg leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-verde"
          >
            ✕
          </button>
        </header>

        {/* Total — soma dos pontos exibidos (bate com o get_leaderboard do ranking). */}
        <div className="flex items-center justify-between px-5 py-3 bg-cloud border-b border-line">
          <span className="text-xs uppercase tracking-widest text-slate font-semibold">
            Total nestes jogos
          </span>
          <span className="font-display text-2xl tnum text-ink">
            {total} <span className="text-sm text-slate">pts</span>
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {carregando ? (
            <div className="py-10 flex justify-center"><Loader /></div>
          ) : erro ? (
            <p className="text-vermelho text-sm py-10 text-center">
              Não consegui carregar: {erro}
            </p>
          ) : jogos.length === 0 ? (
            <p className="text-slate text-sm py-10 text-center">
              {nome ?? 'Esse jogador'} ainda não palpitou em nenhum jogo que já começou.
            </p>
          ) : (
            jogos.map((p) => <JogoPalpite key={p.matches.id} p={p} />)
          )}
        </div>
      </div>
    </div>
  )
}

function JogoPalpite({ p }) {
  const m = p.matches
  const temResultado = m.gols_casa !== null && m.gols_fora !== null
  const { base, peso, pontos } = calcularPontos({
    palpiteCasa: p.palpite_casa,
    palpiteFora: p.palpite_fora,
    golsCasa: m.gols_casa,
    golsFora: m.gols_fora,
    fase: m.fase,
  })
  // Cor do chip = qualidade do palpite (base 5/3/1/0); o número mostrado é o ponto final (×peso).
  const corChip = pontos === null ? null : chipDePontos(base).className

  return (
    <article className="bg-cloud rounded-lg border border-line shadow-soft p-4">
      <header className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-pill bg-ink text-paper text-xs font-bold uppercase tracking-wider">
          {rotuloDoJogo(m)}
        </span>
        <span className="text-xs text-slate font-semibold tnum">
          {fmt.format(new Date(m.data_hora))}
        </span>
      </header>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
        <TimeMini time={m.time_casa} />
        <div className="flex flex-col items-center">
          {temResultado ? (
            <div className="font-display text-3xl tnum text-ink flex items-baseline gap-2 leading-none">
              <span>{m.gols_casa}</span>
              <span className="text-slate text-lg">×</span>
              <span>{m.gols_fora}</span>
            </div>
          ) : (
            <span className="px-2.5 py-1 rounded-pill bg-line text-slate text-[11px] font-bold uppercase tracking-wider">
              aguardando
            </span>
          )}
          <span className="mt-1 text-[11px] text-slate">resultado</span>
        </div>
        <TimeMini time={m.time_fora} />
      </div>

      <footer className="mt-3 pt-3 border-t border-line flex items-center justify-between gap-3">
        <p className="text-sm text-slate">
          palpite{' '}
          <span className="text-ink font-semibold tnum">
            {p.palpite_casa} × {p.palpite_fora}
          </span>
        </p>
        <div className="text-right">
          {pontos === null ? (
            <span className="inline-flex items-center px-3 py-1 rounded-pill bg-line text-slate text-sm font-bold">
              —
            </span>
          ) : (
            <>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-pill text-sm font-bold tnum ${corChip}`}
              >
                {pontos === 0 ? '0 pts' : `+${pontos} pts`}
              </span>
              {pontos > 0 && peso > 1 && (
                <p className="text-[11px] text-slate mt-0.5 tnum">
                  {base} × {peso} ({rotuloDoJogo(m)})
                </p>
              )}
            </>
          )}
        </div>
      </footer>
    </article>
  )
}

function TimeMini({ time }) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <Bandeira time={time} size={36} />
      <span className="text-xs font-semibold text-ink text-center truncate w-full">
        {time}
      </span>
    </div>
  )
}
