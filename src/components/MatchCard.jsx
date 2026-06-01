import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { classeDoGrupo } from '../lib/grupos'
import { calcularPontos, chipDePontos } from '../lib/pontos'
import Bandeira from './Bandeira'

// Formatador de data/hora em horário de Brasília (independe do fuso do device).
const fmtData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Sao_Paulo',
})
const fmtHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

function formatarDataHora(iso) {
  const d = new Date(iso)
  return `${fmtData.format(d)} · ${fmtHora.format(d)}`
}

// Normaliza input do placar: só dígitos, máx. 2 (0–99).
function sanitizarPlacar(valor) {
  return valor.replace(/\D/g, '').slice(0, 2)
}

export default function MatchCard({ match, palpite, onSaved }) {
  const { user } = useAuth()

  const trancado = new Date(match.data_hora).getTime() <= Date.now()
  const encerrado = match.gols_casa !== null && match.gols_fora !== null

  // Estado local dos inputs — começa com o palpite salvo (ou vazio).
  const [casa, setCasa] = useState(
    palpite?.palpite_casa != null ? String(palpite.palpite_casa) : '',
  )
  const [fora, setFora] = useState(
    palpite?.palpite_fora != null ? String(palpite.palpite_fora) : '',
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [okMsg, setOkMsg] = useState(null)

  const grupo = classeDoGrupo(match.grupo)

  const pontos =
    encerrado && palpite?.palpite_casa != null && palpite?.palpite_fora != null
      ? calcularPontos(
          palpite.palpite_casa,
          palpite.palpite_fora,
          match.gols_casa,
          match.gols_fora,
        )
      : null
  const chip = chipDePontos(pontos)
  const temPalpite =
    palpite?.palpite_casa != null && palpite?.palpite_fora != null

  async function salvar(e) {
    e.preventDefault()
    if (!user) return
    if (casa === '' || fora === '') {
      setErro('Coloque os dois placares.')
      return
    }
    setSalvando(true)
    setErro(null)
    setOkMsg(null)

    const { error } = await supabase
      .from('predictions')
      .upsert(
        {
          user_id: user.id,
          match_id: match.id,
          palpite_casa: Number(casa),
          palpite_fora: Number(fora),
        },
        { onConflict: 'user_id,match_id' },
      )

    setSalvando(false)

    if (error) {
      // RLS recusa quando o jogo já começou.
      const ehTrava =
        error.code === '42501' ||
        error.code === 'PGRST301' ||
        (error.message || '').toLowerCase().includes('policy') ||
        (error.message || '').toLowerCase().includes('permission')
      setErro(
        ehTrava
          ? 'O jogo já começou — palpite trancado.'
          : `Não consegui salvar: ${error.message}`,
      )
      return
    }

    setOkMsg('palpite salvo!')
    onSaved?.()
    setTimeout(() => setOkMsg(null), 1800)
  }

  const inputPlacar =
    'w-14 h-14 rounded-md border-2 border-line bg-paper text-center ' +
    'font-display text-3xl text-ink tnum leading-none ' +
    'focus:outline-none focus:border-verde focus:ring-2 focus:ring-verde/30 ' +
    'disabled:bg-line disabled:text-slate disabled:cursor-not-allowed'

  return (
    <article className="bg-cloud rounded-lg border border-line shadow-soft p-5 sm:p-6 flex flex-col gap-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Topo: badge de grupo/fase + data/hora em Brasília */}
      <header className="flex items-center justify-between gap-2">
        {match.grupo ? (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-bold uppercase tracking-wider ${grupo.bg} ${grupo.text}`}
          >
            Grupo {match.grupo}
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-pill bg-ink text-paper text-xs font-bold uppercase tracking-wider">
            {match.fase}
          </span>
        )}
        <span className="text-xs text-slate font-semibold tnum">
          {formatarDataHora(match.data_hora)}
        </span>
      </header>

      {/*
        Corpo: 3 colunas (time casa | centro | time fora).
        Bandeiras ancoram visualmente; nome embaixo, centralizado e truncado.
        Centro muda conforme estado: inputs / placar real / etiqueta "trancado".
      */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
        <ColunaTime time={match.time_casa} />

        <div className="flex items-center justify-center">
          {encerrado ? (
            <div className="font-display text-5xl tnum text-ink flex items-baseline gap-3 leading-none">
              <span>{match.gols_casa}</span>
              <span className="text-slate text-2xl">×</span>
              <span>{match.gols_fora}</span>
            </div>
          ) : trancado ? (
            <span className="px-3 py-1.5 rounded-pill bg-line text-slate text-xs font-bold uppercase tracking-wider">
              trancado
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={casa}
                onChange={(e) => setCasa(sanitizarPlacar(e.target.value))}
                disabled={salvando}
                aria-label={`palpite ${match.time_casa}`}
                className={inputPlacar}
              />
              <span className="text-slate text-xl">×</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={fora}
                onChange={(e) => setFora(sanitizarPlacar(e.target.value))}
                disabled={salvando}
                aria-label={`palpite ${match.time_fora}`}
                className={inputPlacar}
              />
            </div>
          )}
        </div>

        <ColunaTime time={match.time_fora} />
      </div>

      {/* Base: ação (aberto) ou resumo do palpite + chip (trancado/encerrado) */}
      {!trancado ? (
        <form onSubmit={salvar} className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={salvando}
            className="h-12 rounded-md bg-verde hover:bg-verde-dark text-cloud font-semibold shadow-hard transition-colors disabled:bg-line disabled:text-slate disabled:shadow-none disabled:cursor-not-allowed"
          >
            {salvando
              ? 'salvando…'
              : palpite
              ? 'atualizar palpite'
              : 'salvar palpite'}
          </button>
          {erro && <p className="text-sm text-vermelho text-center">{erro}</p>}
          {okMsg && <p className="text-sm text-verde text-center">{okMsg}</p>}
        </form>
      ) : (
        <footer className="flex flex-col items-center gap-2 text-center">
          {temPalpite ? (
            <>
              <p className="text-sm text-slate">
                seu palpite:{' '}
                <span className="text-ink font-semibold tnum">
                  {palpite.palpite_casa} × {palpite.palpite_fora}
                </span>
              </p>
              {chip && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-pill text-sm font-bold tnum ${chip.className}`}
                >
                  {chip.label}
                </span>
              )}
            </>
          ) : (
            <p className="text-sm text-slate">
              {encerrado
                ? 'você não palpitou neste jogo.'
                : 'palpite trancado · sem palpite'}
            </p>
          )}
        </footer>
      )}
    </article>
  )
}

// Coluna de um time: bandeira em cima, nome centralizado embaixo.
function ColunaTime({ time }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <Bandeira time={time} size={52} />
      <div className="font-semibold text-sm text-ink text-center truncate w-full">
        {time}
      </div>
    </div>
  )
}
