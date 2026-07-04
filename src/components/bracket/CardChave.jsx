import { useState } from 'react'
import Bandeira from '../Bandeira'
import { siglaTime } from '../../lib/grupos'
import { sanitizarPlacar } from '../../lib/palpite'
import { FASES_MATA, estadoJogo, resultadoPalpite } from '../../lib/bracket'

// Card de um confronto do chaveamento. Duas densidades (SPEC §5):
//  • variante "grande": placar 46×52 + nomes + rodapé de palpite (≤2 rodadas, col≥250)
//  • variante "compacto": sigla + bandeira + borda esq. colorida + bolinha (3+ rodadas)
// Edição de palpite só com o jogo ABERTO (estado 'agendado'): inline no grande,
// bottom-sheet no compacto. `onSalvar(matchId, casa, fora)` é o save da Lista
// (lib/palpite.js) — o pai (Chaveamento) cuida do otimista/rollback. Tudo o mais é
// derivado de (match, palpite); estados em SPEC §7.
// `avancou` ('casa'|'fora'|null) = lado que passou de fase, calculado pelo pai via
// ladoAvancou (quem aparece na rodada seguinte). NUNCA deduza pelo placar aqui: jogo
// decidido nos pênaltis termina empatado e o placar não diz quem avançou.

const fmtData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo',
})
const fmtHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
})
const dataHora = (iso) => `${fmtData.format(new Date(iso))} · ${fmtHora.format(new Date(iso))}`

const labelFase = (fase) =>
  fase === 'terceiro' ? '3º lugar' : FASES_MATA.find((f) => f.id === fase)?.col ?? fase

export default function CardChave({ match, palpite, fase, variante = 'grande', avancou = null, onSalvar }) {
  const estado = estadoJogo(match)
  // Editável só com palpite aberto: jogo agendado (não iniciado, não encerrado, com
  // times definidos). Tudo mais é read-only. A RLS é a trava final no servidor.
  const editavel = estado === 'agendado' && typeof onSalvar === 'function'

  return variante === 'compacto' ? (
    <Compacto match={match} palpite={palpite} estado={estado} editavel={editavel} avancou={avancou} onSalvar={onSalvar} />
  ) : (
    <Grande match={match} palpite={palpite} fase={fase} estado={estado} editavel={editavel} avancou={avancou} onSalvar={onSalvar} />
  )
}

// ---------- Card grande ----------
function Grande({ match, palpite, fase, estado, editavel, avancou, onSalvar }) {
  const venc = avancou
  const [editando, setEditando] = useState(false)
  const editMode = editavel && editando

  return (
    <article className="bg-white rounded-[18px] border border-chave-borda shadow-[0_2px_6px_rgba(20,18,12,0.05)] p-[15px] flex flex-col gap-3">
      {/* Cabeçalho: pill da rodada + status */}
      <header className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center px-2 py-1 rounded-pill bg-chave-ink text-white text-[10px] font-extrabold uppercase tracking-wide leading-none">
          {labelFase(fase)}
        </span>
        <Status match={match} estado={estado} />
      </header>

      {editMode ? (
        // Edição inline: os próprios quadrados de placar viram inputs.
        <EditorGrande
          match={match}
          palpite={palpite}
          onSalvar={onSalvar}
          onPronto={() => setEditando(false)}
          onCancelar={() => setEditando(false)}
        />
      ) : (
        <>
          {/* Corpo: time casa | placar × placar | time fora */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2">
            <TimeGrande time={match?.time_casa} esmaecido={estado === 'encerrado' && venc === 'fora'} bold={venc === 'casa'} lado="casa" />
            <CaixaPlacar valor={match?.gols_casa} vencedor={venc === 'casa'} perdedor={estado === 'encerrado' && venc === 'fora'} />
            <span className="text-chave-sec text-base font-bold px-0.5">×</span>
            <CaixaPlacar valor={match?.gols_fora} vencedor={venc === 'fora'} perdedor={estado === 'encerrado' && venc === 'casa'} />
            <TimeGrande time={match?.time_fora} esmaecido={estado === 'encerrado' && venc === 'casa'} bold={venc === 'fora'} lado="fora" />
          </div>

          {/* Rodapé de palpite (linha tracejada) */}
          {estado !== 'adefinir' && (
            <RodapePalpite
              match={match}
              palpite={palpite}
              estado={estado}
              editavel={editavel}
              onPalpitar={() => setEditando(true)}
            />
          )}
        </>
      )}
    </article>
  )
}

function TimeGrande({ time, esmaecido, bold, lado }) {
  const adefinir = !time
  return (
    <div className={`flex items-center gap-2 min-w-0 ${lado === 'fora' ? 'justify-end flex-row-reverse' : ''}`}>
      {adefinir ? (
        <span className="w-[30px] h-[30px] rounded-md bg-chave-placar shrink-0" aria-hidden="true" />
      ) : (
        <Bandeira time={time} size={30} />
      )}
      <span
        className={`truncate text-[12.5px] leading-tight ${
          adefinir ? 'text-chave-ph' : esmaecido ? 'text-chave-ph opacity-50' : 'text-chave-ink'
        } ${bold ? 'font-extrabold' : 'font-bold'}`}
      >
        {time ?? 'A definir'}
      </span>
    </div>
  )
}

function CaixaPlacar({ valor, vencedor, perdedor }) {
  const temValor = valor != null
  const cor = vencedor
    ? 'bg-chave-venc text-chave-verde'
    : perdedor
    ? 'bg-chave-placar text-chave-ph opacity-50'
    : 'bg-chave-placar text-chave-ink'
  return (
    <span className={`w-[46px] h-[52px] rounded-[12px] flex items-center justify-center font-extrabold text-[26px] tabular-nums leading-none ${cor}`}>
      {temValor ? valor : ''}
    </span>
  )
}

// ---------- Card compacto ----------
function Compacto({ match, palpite, estado, editavel, avancou, onSalvar }) {
  const [sheet, setSheet] = useState(false)
  const res = resultadoPalpite(match, palpite)
  const classe = `relative bg-white rounded-[9px] border border-chave-borda border-l-4 ${res.estilo.borda} ${
    res.chave === 'aovivo' ? 'animate-pulse' : ''
  } px-1 py-1.5 flex flex-col gap-1`

  if (!editavel) {
    return (
      <div className={classe}>
        <CorpoCompacto match={match} palpite={palpite} estado={estado} res={res} avancou={avancou} />
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setSheet(true)}
        className={`${classe} w-full text-left cursor-pointer hover:border-chave-verde transition-colors`}
        aria-label={`editar palpite ${match.time_casa} x ${match.time_fora}`}
      >
        <CorpoCompacto match={match} palpite={palpite} estado={estado} res={res} avancou={avancou} />
      </button>
      {sheet && (
        <SheetPalpite match={match} palpite={palpite} onSalvar={onSalvar} onFechar={() => setSheet(false)} />
      )}
    </>
  )
}

function CorpoCompacto({ match, palpite, estado, res, avancou }) {
  const venc = avancou
  const mostrarDot = res.pontos != null
  // Jogo aberto já palpitado: marca neutra (sem pontos ainda) pra sinalizar que tem palpite.
  const marcaAberta = res.chave === 'aguardando'
  return (
    <>
      {mostrarDot && (
        <span className={`absolute -top-[7px] -right-[6px] min-w-[20px] h-[20px] px-1 rounded-pill flex items-center justify-center text-[10px] font-black leading-none ${res.estilo.dot}`}>
          +{res.pontos}
        </span>
      )}
      {!mostrarDot && marcaAberta && (
        <span className="absolute -top-[6px] -right-[5px] w-[14px] h-[14px] rounded-pill bg-chave-wait flex items-center justify-center" aria-hidden="true">
          <span className="w-1 h-1 rounded-pill bg-white" />
        </span>
      )}
      <LinhaCompacta time={match?.time_casa} valor={match?.gols_casa} vencedor={venc === 'casa'} perdedor={estado === 'encerrado' && venc === 'fora'} />
      <LinhaCompacta time={match?.time_fora} valor={match?.gols_fora} vencedor={venc === 'fora'} perdedor={estado === 'encerrado' && venc === 'casa'} />
    </>
  )
}

function LinhaCompacta({ time, valor, vencedor, perdedor }) {
  const adefinir = !time
  return (
    <div className="flex items-center gap-[3px] min-w-0">
      {adefinir ? (
        <span className="w-[14px] h-[14px] rounded-[3px] bg-chave-placar shrink-0" aria-hidden="true" />
      ) : (
        <Bandeira time={time} size={14} />
      )}
      <span className={`flex-1 min-w-0 text-[12.5px] leading-none overflow-hidden whitespace-nowrap ${adefinir ? 'text-chave-ph' : perdedor ? 'text-chave-ph opacity-50' : vencedor ? 'text-chave-verde' : 'text-chave-ink'} ${vencedor ? 'font-extrabold' : 'font-bold'}`}>
        {adefinir ? '—' : siglaTime(time)}
      </span>
      <span className={`shrink-0 text-[13px] font-extrabold tabular-nums leading-none ${perdedor ? 'text-chave-ph opacity-50' : vencedor ? 'text-chave-verde' : 'text-chave-ink'}`}>
        {valor != null ? valor : ''}
      </span>
    </div>
  )
}

// ---------- Status (cabeçalho do card grande) ----------
function Status({ match, estado }) {
  if (estado === 'encerrado')
    return <span className="text-[11px] font-extrabold uppercase tracking-wide text-chave-sec">Encerrado</span>
  if (estado === 'aovivo')
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-chave-live">
        <span className="w-1.5 h-1.5 rounded-pill bg-chave-live animate-pulse" aria-hidden="true" />
        Ao vivo
      </span>
    )
  if (estado === 'agendado')
    return <span className="text-[11px] font-extrabold uppercase tracking-wide text-chave-sec tabular-nums">{dataHora(match.data_hora)}</span>
  return <span className="text-[11px] font-extrabold uppercase tracking-wide text-chave-label">A definir</span>
}

// ---------- Rodapé de palpite (card grande) ----------
function RodapePalpite({ match, palpite, estado, editavel, onPalpitar }) {
  const temPalpite = palpite && palpite.palpite_casa != null && palpite.palpite_fora != null
  const res = resultadoPalpite(match, palpite)

  // Jogo aberto → mostra o palpite atual + ação que liga a edição inline (nos
  // próprios quadrados de placar, via EditorGrande no card).
  if (editavel) {
    return (
      <div className="pt-3 border-t border-dashed border-chave-borda flex items-center justify-between gap-2">
        {temPalpite ? (
          <span className="text-[11px] font-bold text-chave-sec">
            Seu palpite{' '}
            <span className="text-[13px] font-extrabold text-chave-ink tabular-nums">
              {palpite.palpite_casa}–{palpite.palpite_fora}
            </span>
          </span>
        ) : (
          <span className="text-[11px] font-bold text-chave-ph">palpite em aberto</span>
        )}
        <button
          type="button"
          onClick={onPalpitar}
          className="text-[13px] font-extrabold text-chave-verde hover:text-chave-verdedark"
        >
          {temPalpite ? 'editar' : 'palpitar'}
        </button>
      </div>
    )
  }

  // Read-only (encerrado / ao vivo).
  const label = estado === 'aovivo' ? 'Palpite parcial' : 'Seu palpite'
  return (
    <div className="pt-3 border-t border-dashed border-chave-borda flex items-center justify-between gap-2">
      {temPalpite ? (
        <span className="text-[11px] font-bold text-chave-sec">
          {label}{' '}
          <span className="text-[13px] font-extrabold text-chave-ink tabular-nums">
            {palpite.palpite_casa}–{palpite.palpite_fora}
          </span>
        </span>
      ) : (
        <span className="text-[11px] font-bold text-chave-ph">
          {estado === 'encerrado' ? 'sem palpite' : 'palpite em aberto'}
        </span>
      )}
      {temPalpite && res.estilo.chip && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-extrabold ${res.estilo.chip}`}>
          {res.estilo.rotulo}{res.pontos != null ? ` · +${res.pontos}` : ''}
        </span>
      )}
    </div>
  )
}

// ---------- Editor inline do card grande: inputs OCUPAM os quadrados de placar ----------
function EditorGrande({ match, palpite, onSalvar, onPronto, onCancelar }) {
  const [casa, setCasa] = useState(palpite?.palpite_casa != null ? String(palpite.palpite_casa) : '')
  const [fora, setFora] = useState(palpite?.palpite_fora != null ? String(palpite.palpite_fora) : '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (casa === '' || fora === '') {
      setErro('Coloque os dois placares.')
      return
    }
    setSalvando(true)
    setErro(null)
    const { error, ehTrava } = await onSalvar(match.id, Number(casa), Number(fora))
    setSalvando(false)
    if (error) {
      setErro(ehTrava ? 'O jogo já começou — palpite trancado.' : 'Não consegui salvar.')
      return
    }
    onPronto?.()
  }

  const caixa =
    'w-[46px] h-[52px] rounded-[12px] bg-chave-surface border-2 border-chave-borda text-center ' +
    'font-extrabold text-[26px] text-chave-ink tabular-nums leading-none ' +
    'focus:outline-none focus:border-chave-verde disabled:opacity-60'

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {/* Mesma grade do corpo: time | input × input | time */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2">
        <TimeGrande time={match.time_casa} lado="casa" />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={casa}
          onChange={(e) => setCasa(sanitizarPlacar(e.target.value))}
          disabled={salvando}
          autoFocus
          aria-label={`palpite ${match.time_casa}`}
          className={caixa}
        />
        <span className="text-chave-sec text-base font-bold px-0.5">×</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={fora}
          onChange={(e) => setFora(sanitizarPlacar(e.target.value))}
          disabled={salvando}
          aria-label={`palpite ${match.time_fora}`}
          className={caixa}
        />
        <TimeGrande time={match.time_fora} lado="fora" />
      </div>

      <div className="pt-3 border-t border-dashed border-chave-borda flex items-center gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="flex-1 h-10 rounded-[10px] bg-chave-verde hover:bg-chave-verdedark text-white text-sm font-extrabold transition-colors disabled:opacity-60"
        >
          {salvando ? 'salvando…' : 'salvar palpite'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={salvando}
          className="px-3 h-10 text-sm font-bold text-chave-sec hover:text-chave-ink"
        >
          cancelar
        </button>
      </div>
      {erro && <p className="text-[11px] text-chave-r0 text-center font-semibold">{erro}</p>}
    </form>
  )
}

// ---------- Editor do bottom-sheet (card compacto): campos abaixo dos times ----------
function EditorPalpite({ match, palpite, onSalvar, onPronto, onCancelar, autoFocus }) {
  const [casa, setCasa] = useState(palpite?.palpite_casa != null ? String(palpite.palpite_casa) : '')
  const [fora, setFora] = useState(palpite?.palpite_fora != null ? String(palpite.palpite_fora) : '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (casa === '' || fora === '') {
      setErro('Coloque os dois placares.')
      return
    }
    setSalvando(true)
    setErro(null)
    const { error, ehTrava } = await onSalvar(match.id, Number(casa), Number(fora))
    setSalvando(false)
    if (error) {
      setErro(ehTrava ? 'O jogo já começou — palpite trancado.' : 'Não consegui salvar.')
      return
    }
    onPronto?.()
  }

  const campo =
    'w-12 h-12 rounded-[10px] border-2 border-chave-borda bg-chave-surface text-center ' +
    'font-extrabold text-[20px] text-chave-ink tabular-nums leading-none ' +
    'focus:outline-none focus:border-chave-verde'

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={casa}
          onChange={(e) => setCasa(sanitizarPlacar(e.target.value))}
          disabled={salvando}
          autoFocus={autoFocus}
          aria-label={`palpite ${match.time_casa}`}
          className={campo}
        />
        <span className="text-chave-sec font-bold">×</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={fora}
          onChange={(e) => setFora(sanitizarPlacar(e.target.value))}
          disabled={salvando}
          aria-label={`palpite ${match.time_fora}`}
          className={campo}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="flex-1 h-10 rounded-[10px] bg-chave-verde hover:bg-chave-verdedark text-white text-sm font-extrabold transition-colors disabled:opacity-60"
        >
          {salvando ? 'salvando…' : 'salvar palpite'}
        </button>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={salvando}
            className="px-3 h-10 text-sm font-bold text-chave-sec hover:text-chave-ink"
          >
            cancelar
          </button>
        )}
      </div>
      {erro && <p className="text-[11px] text-chave-r0 text-center font-semibold">{erro}</p>}
    </form>
  )
}

// ---------- Bottom-sheet / popover do card compacto ----------
function SheetPalpite({ match, palpite, onSalvar, onFechar }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full sm:max-w-[360px] bg-white rounded-t-[18px] sm:rounded-[18px] p-5 shadow-[0_-4px_24px_rgba(20,18,12,0.18)] sm:shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.06em] text-chave-label mb-3 text-center">
          {labelFase(match.fase)} · seu palpite
        </p>
        <div className="flex items-center justify-center gap-3 mb-4">
          <TimeSheet time={match.time_casa} />
          <span className="text-chave-sec font-bold">×</span>
          <TimeSheet time={match.time_fora} />
        </div>
        <EditorPalpite
          match={match}
          palpite={palpite}
          onSalvar={onSalvar}
          onPronto={onFechar}
          onCancelar={onFechar}
          autoFocus
        />
      </div>
    </div>
  )
}

function TimeSheet({ time }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Bandeira time={time} size={22} />
      <span className="text-[13px] font-bold text-chave-ink truncate">{time}</span>
    </div>
  )
}
