// Card do Admin > Jogos: o MESMO MatchCard do app + um editor de placar oficial
// embaixo. Lançar/editar gols_casa/gols_fora (update em matches), com confirmação
// antes de gravar — porque mexer no placar recalcula a pontuação de todo mundo.
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import MatchCard from '../components/MatchCard'
import ConfirmDialog from './ConfirmDialog'

const soDigitos = (v) => v.replace(/\D/g, '').slice(0, 2) // 0–99

function EditorPlacar({ match, onSalvo }) {
  const [casa, setCasa] = useState(
    match.gols_casa != null ? String(match.gols_casa) : '',
  )
  const [fora, setFora] = useState(
    match.gols_fora != null ? String(match.gols_fora) : '',
  )
  const [erro, setErro] = useState(null)
  const [okMsg, setOkMsg] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const limpar = casa === '' && fora === ''
  const ambosPreenchidos = casa !== '' && fora !== ''

  function pedirConfirmacao(e) {
    e.preventDefault()
    setErro(null)
    setOkMsg(null)
    // Validação: ou os dois preenchidos (inteiros >= 0), ou os dois vazios
    // (limpar = desfazer, volta o placar a null).
    if (!limpar && !ambosPreenchidos) {
      setErro('Preencha os dois, ou deixe os dois vazios pra remover o placar.')
      return
    }
    setConfirmando(true)
  }

  async function confirmar() {
    setConfirmando(false)
    setSalvando(true)
    setErro(null)
    const payload = limpar
      ? { gols_casa: null, gols_fora: null }
      : { gols_casa: Number(casa), gols_fora: Number(fora) }
    const { data, error } = await supabase
      .from('matches')
      .update(payload)
      .eq('id', match.id)
      .select('*')
      .single()
    setSalvando(false)
    if (error) {
      setErro(error.message)
      return
    }
    setOkMsg(limpar ? 'placar removido' : 'placar salvo')
    onSalvo?.(data)
    setTimeout(() => setOkMsg(null), 1800)
  }

  const input =
    'w-12 h-11 rounded-md border-2 border-line bg-paper text-center ' +
    'font-display text-2xl text-ink tnum leading-none ' +
    'focus:outline-none focus:border-verde focus:ring-2 focus:ring-verde/30 ' +
    'disabled:bg-line disabled:text-slate'

  return (
    <>
      <p className="text-[11px] uppercase tracking-widest text-slate font-bold mb-2">
        Placar oficial (admin)
      </p>
      <form onSubmit={pedirConfirmacao} className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          value={casa}
          onChange={(e) => setCasa(soDigitos(e.target.value))}
          disabled={salvando}
          aria-label={`gols ${match.time_casa}`}
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
          aria-label={`gols ${match.time_fora}`}
          className={input}
        />

        <button
          type="submit"
          disabled={salvando}
          className="h-11 px-4 rounded-md bg-verde hover:bg-verde-dark text-cloud font-semibold shadow-hard transition-colors disabled:bg-line disabled:text-slate disabled:shadow-none"
        >
          {salvando ? 'salvando…' : 'salvar placar'}
        </button>
        {!limpar && (
          <button
            type="button"
            onClick={() => {
              setCasa('')
              setFora('')
              setErro(null)
            }}
            disabled={salvando}
            className="h-11 px-3 rounded-md text-sm font-semibold text-slate hover:text-ink hover:bg-paper transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-verde/40"
          >
            limpar
          </button>
        )}
      </form>
      {erro && <p className="mt-2 text-sm text-vermelho">{erro}</p>}
      {okMsg && <p className="mt-2 text-sm text-verde">{okMsg}</p>}

      {confirmando && (
        <ConfirmDialog
          titulo={limpar ? 'Remover placar?' : 'Confirmar placar?'}
          mensagem={
            limpar
              ? `Remove o resultado de ${match.time_casa} × ${match.time_fora} e recalcula a pontuação de todo mundo neste jogo.`
              : `${match.time_casa} ${casa} × ${fora} ${match.time_fora}. Isso recalcula a pontuação de todo mundo neste jogo.`
          }
          textoConfirmar={limpar ? 'Remover' : 'Salvar placar'}
          perigo={limpar}
          onConfirm={confirmar}
          onCancel={() => setConfirmando(false)}
        />
      )}
    </>
  )
}

export default function AdminMatchCard({ match, palpite, onSaved, onPlacarSalvo }) {
  // Cópia local do jogo pra refletir o placar editado na hora (o MatchCard acima
  // mostra o resultado novo sem esperar o refetch). O onPlacarSalvo recarrega a
  // lista da tela de Jogos, pra o resumo do dia e o reabrir do acordeão baterem.
  const [m, setM] = useState(match)

  return (
    <div className="space-y-2">
      <MatchCard match={m} palpite={palpite} onSaved={onSaved} />
      <div className="bg-cloud rounded-lg border border-line shadow-soft p-4">
        <EditorPlacar
          match={m}
          onSalvo={(novo) => {
            setM(novo)
            onPlacarSalvo?.()
          }}
        />
      </div>
    </div>
  )
}
