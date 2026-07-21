// Admin > Palpites: escolher uma pessoa e ver/editar/criar/travar o palpite dela
// em cada jogo. A RLS de admin permite SELECT/UPDATE/INSERT em qualquer
// predictions, sem trava de horário (usuário comum: só o próprio e antes do jogo).
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTorneio } from '../context/TorneioContext'
import Loader from '../components/Loader'
import ConfirmDialog from './ConfirmDialog'

const soDigitos = (v) => v.replace(/\D/g, '').slice(0, 2)

const fmtData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

export default function AdminPalpites() {
  const { user } = useAuth()
  const torneio = useTorneio()
  const [perfis, setPerfis] = useState([])
  const [matches, setMatches] = useState([])
  const [erro, setErro] = useState(null)

  const [alvoId, setAlvoId] = useState('')
  const [predsMap, setPredsMap] = useState({}) // match_id → { id, palpite_casa, palpite_fora, travado }
  const [carregandoPreds, setCarregandoPreds] = useState(false)
  const [filtroJogo, setFiltroJogo] = useState('')

  const [editando, setEditando] = useState(null) // match_id em edição
  const [confirmAlvo, setConfirmAlvo] = useState(null) // match_id aguardando confirmação (outra pessoa)

  const alvo = perfis.find((p) => p.id === alvoId) || null
  const ehOutraPessoa = alvo && alvo.id !== user?.id

  // Pessoas + jogos DO TORNEIO ATUAL.
  useEffect(() => {
    let cancelado = false
    async function carregar() {
      const [resPerfis, resMatches] = await Promise.all([
        supabase.from('profiles').select('id, nome').order('nome', { ascending: true }),
        supabase
          .from('matches')
          .select('id, time_casa, time_fora, fase, rodada, data_hora, gols_casa, gols_fora')
          .eq('torneio_id', torneio.id)
          .order('rodada', { ascending: true, nullsFirst: true })
          .order('data_hora', { ascending: true }),
      ])
      if (cancelado) return
      if (resPerfis.error || resMatches.error) {
        setErro((resPerfis.error || resMatches.error).message)
        return
      }
      setPerfis(resPerfis.data ?? [])
      setMatches(resMatches.data ?? [])
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [torneio.id])

  // Palpites da pessoa escolhida.
  useEffect(() => {
    setEditando(null)
    setConfirmAlvo(null)
    if (!alvoId) {
      setPredsMap({})
      return
    }
    let cancelado = false
    async function carregar() {
      setCarregandoPreds(true)
      // Escopado por torneio igual à listagem de jogos (`matches!inner` + filtro),
      // senão viriam junto os palpites do outro bolão.
      const { data, error } = await supabase
        .from('predictions')
        .select('match_id, palpite_casa, palpite_fora, travado, matches!inner(torneio_id)')
        .eq('user_id', alvoId)
        .eq('matches.torneio_id', torneio.id)
      if (cancelado) return
      if (error) {
        setErro(error.message)
        setCarregandoPreds(false)
        return
      }
      const mapa = {}
      // Descarta o `matches` do join: o mapa guarda o mesmo shape que o upsert
      // devolve mais abaixo.
      for (const { matches: _m, ...p } of data ?? []) mapa[p.match_id] = p
      setPredsMap(mapa)
      setCarregandoPreds(false)
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [alvoId, torneio.id])

  const jogosFiltrados = useMemo(
    () => matches.filter((m) => !filtroJogo || String(m.id) === filtroJogo),
    [matches, filtroJogo],
  )

  // AVISO OBRIGATÓRIO: abrir o editor de OUTRA pessoa passa primeiro pelo dialog.
  // Se o alvo é o próprio admin, abre direto.
  function pedirEditar(matchId) {
    if (!ehOutraPessoa) {
      setEditando(matchId)
      return
    }
    setConfirmAlvo(matchId)
  }

  async function salvarPalpite(matchId, casa, fora) {
    // update se já existe, insert se não — upsert cobre os dois. Não toca em travado.
    const { data, error } = await supabase
      .from('predictions')
      .upsert(
        {
          user_id: alvoId,
          match_id: matchId,
          palpite_casa: Number(casa),
          palpite_fora: Number(fora),
        },
        { onConflict: 'user_id,match_id' },
      )
      .select('match_id, palpite_casa, palpite_fora, travado')
      .single()
    if (!error) {
      setPredsMap((prev) => ({ ...prev, [matchId]: data }))
      setEditando(null)
    }
    return error
  }

  async function alternarTravado(matchId) {
    const atual = predsMap[matchId]
    if (!atual) return null // só trava palpite que existe
    const { data, error } = await supabase
      .from('predictions')
      .update({ travado: !atual.travado })
      .eq('user_id', alvoId)
      .eq('match_id', matchId)
      .select('match_id, palpite_casa, palpite_fora, travado')
      .single()
    if (!error) setPredsMap((prev) => ({ ...prev, [matchId]: data }))
    return error
  }

  return (
    <main className="max-w-[880px] mx-auto px-4 py-8 sm:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight">PALPITES</h1>
        <p className="mt-1 text-slate text-sm">
          Ver, editar, criar e travar o palpite de qualquer pessoa.{' '}
          <span className="text-ink font-semibold">Travado</span> = o dono não
          consegue mais editar.
        </p>
      </header>

      {erro && <p className="text-vermelho text-sm">Erro: {erro}</p>}

      {/* Filtros: pessoa (obrigatório) + jogo (opcional). */}
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="flex-1">
          <span className="block text-xs font-semibold text-slate mb-1">Pessoa</span>
          <select
            value={alvoId}
            onChange={(e) => setAlvoId(e.target.value)}
            className="w-full h-11 px-3 rounded-md border border-line bg-paper text-ink focus:outline-none focus:border-verde focus:ring-2 focus:ring-verde/30"
          >
            <option value="">Escolha uma pessoa…</option>
            {perfis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
                {p.id === user?.id ? ' (você)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="flex-1">
          <span className="block text-xs font-semibold text-slate mb-1">
            Jogo (opcional)
          </span>
          <select
            value={filtroJogo}
            onChange={(e) => setFiltroJogo(e.target.value)}
            disabled={!alvoId}
            className="w-full h-11 px-3 rounded-md border border-line bg-paper text-ink focus:outline-none focus:border-verde focus:ring-2 focus:ring-verde/30 disabled:bg-line disabled:text-slate"
          >
            <option value="">Todos os jogos</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.time_casa} × {m.time_fora}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Banner de consciência quando o alvo é outra pessoa. */}
      {ehOutraPessoa && (
        <div className="rounded-lg border border-vinho/30 bg-vinho/5 px-4 py-3 text-sm text-ink">
          Você está mexendo nos palpites de{' '}
          <strong>{alvo.nome}</strong> — outra pessoa.
        </div>
      )}

      {!alvoId ? (
        <p className="text-slate text-sm">Escolha uma pessoa pra ver os palpites.</p>
      ) : carregandoPreds ? (
        <div className="py-12 flex justify-center"><Loader /></div>
      ) : (
        <ul className="space-y-3">
          {jogosFiltrados.map((m) => (
            <LinhaPalpite
              key={m.id}
              match={m}
              pred={predsMap[m.id]}
              emEdicao={editando === m.id}
              onPedirEditar={() => pedirEditar(m.id)}
              onCancelar={() => setEditando(null)}
              onSalvar={(casa, fora) => salvarPalpite(m.id, casa, fora)}
              onAlternarTravado={() => alternarTravado(m.id)}
            />
          ))}
        </ul>
      )}

      {confirmAlvo != null && (
        <ConfirmDialog
          titulo="Palpite de outra pessoa"
          mensagem={`Você está abrindo o palpite de outra pessoa (${alvo?.nome}). Continuar?`}
          textoConfirmar="Continuar"
          onConfirm={() => {
            setEditando(confirmAlvo)
            setConfirmAlvo(null)
          }}
          onCancel={() => setConfirmAlvo(null)}
        />
      )}
    </main>
  )
}

function LinhaPalpite({
  match,
  pred,
  emEdicao,
  onPedirEditar,
  onCancelar,
  onSalvar,
  onAlternarTravado,
}) {
  const [travando, setTravando] = useState(false)
  const temPalpite = pred?.palpite_casa != null && pred?.palpite_fora != null
  const travado = pred?.travado === true

  async function toggleTravado() {
    setTravando(true)
    await onAlternarTravado()
    setTravando(false)
  }

  return (
    <li className="bg-cloud rounded-lg border border-line shadow-soft p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold text-ink">
            {match.time_casa} <span className="text-slate">×</span> {match.time_fora}
          </p>
          {/* Jogo sem data marcada: nunca formatar null (viraria "Invalid Date"). */}
          <p className="text-xs text-slate tnum">
            {match.data_hora ? fmtData.format(new Date(match.data_hora)) : 'data a definir'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate">
            palpite:{' '}
            <span className="text-ink font-semibold tnum">
              {temPalpite ? `${pred.palpite_casa} × ${pred.palpite_fora}` : 'sem palpite'}
            </span>
          </span>
          {travado && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-ink text-paper text-[10px] font-bold uppercase tracking-wider">
              travado
            </span>
          )}
        </div>
      </div>

      {emEdicao ? (
        <EditorPalpite
          pred={pred}
          timeCasa={match.time_casa}
          timeFora={match.time_fora}
          onSalvar={onSalvar}
          onCancelar={onCancelar}
        />
      ) : (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onPedirEditar}
            className="h-10 px-3 rounded-md border border-line bg-cloud text-ink text-sm font-semibold hover:bg-paper transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-verde"
          >
            {temPalpite ? 'editar palpite' : 'criar palpite'}
          </button>
          {temPalpite && (
            <button
              type="button"
              onClick={toggleTravado}
              disabled={travando}
              className="h-10 px-3 rounded-md border border-line bg-cloud text-ink text-sm font-semibold hover:bg-paper transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-verde disabled:opacity-60"
            >
              {travando ? '…' : travado ? 'destravar' : 'travar (fechar) palpite'}
            </button>
          )}
        </div>
      )}
    </li>
  )
}

// Montado só ao entrar em edição → os inputs já nascem com o palpite atual.
function EditorPalpite({ pred, timeCasa, timeFora, onSalvar, onCancelar }) {
  const [casa, setCasa] = useState(pred?.palpite_casa != null ? String(pred.palpite_casa) : '')
  const [fora, setFora] = useState(pred?.palpite_fora != null ? String(pred.palpite_fora) : '')
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    if (casa === '' || fora === '') {
      setErro('Coloque os dois placares.')
      return
    }
    setErro(null)
    setSalvando(true)
    const error = await onSalvar(casa, fora)
    setSalvando(false)
    if (error) setErro(error.message ?? 'Não consegui salvar.')
  }

  const input =
    'w-12 h-11 rounded-md border-2 border-line bg-paper text-center ' +
    'font-display text-2xl text-ink tnum leading-none ' +
    'focus:outline-none focus:border-verde focus:ring-2 focus:ring-verde/30'

  return (
    <form onSubmit={salvar} className="mt-3 flex items-center gap-2 flex-wrap">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={casa}
        onChange={(e) => setCasa(soDigitos(e.target.value))}
        disabled={salvando}
        autoFocus
        aria-label={`palpite ${timeCasa}`}
        className={input}
      />
      <span className="text-slate" aria-hidden="true">
        ×
      </span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={fora}
        onChange={(e) => setFora(soDigitos(e.target.value))}
        disabled={salvando}
        aria-label={`palpite ${timeFora}`}
        className={input}
      />
      <button
        type="submit"
        disabled={salvando}
        className="h-11 px-4 rounded-md bg-verde hover:bg-verde-dark text-cloud font-semibold shadow-hard transition-colors disabled:bg-line disabled:text-slate disabled:shadow-none"
      >
        {salvando ? 'salvando…' : 'salvar'}
      </button>
      <button
        type="button"
        onClick={onCancelar}
        disabled={salvando}
        className="h-11 px-3 rounded-md text-sm font-semibold text-slate hover:text-ink hover:bg-paper transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-verde/40"
      >
        cancelar
      </button>
      {erro && <p className="w-full text-sm text-vermelho">{erro}</p>}
    </form>
  )
}
