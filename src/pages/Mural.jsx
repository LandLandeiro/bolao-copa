import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { carregarMural, postarMural, apagarMural } from '../lib/mural'
import { tempoRelativo } from '../lib/tempo'
import EmptyPanel from '../components/EmptyPanel'
import Loader from '../components/Loader'

const LIMITE = 280

export default function Mural() {
  const { user, profile } = useAuth()
  const [recados, setRecados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [texto, setTexto] = useState('')
  const [postando, setPostando] = useState(false)
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      setCarregando(true)
      setErro(null)
      const { data, error } = await carregarMural()
      if (cancelado) return
      if (error) setErro(error.message)
      else setRecados(data ?? [])
      setCarregando(false)
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  const limpo = texto.trim()
  const excedeu = texto.length > LIMITE
  const podePostar = limpo.length > 0 && !excedeu && !postando

  async function postar(e) {
    e.preventDefault()
    if (!podePostar || !user) return
    setAviso(null)
    setPostando(true)

    // Otimista: mostra o recado na hora com id temporário; troca pelo real depois.
    const tempId = `temp-${Date.now()}`
    const otimista = {
      id: tempId,
      user_id: user.id,
      texto: limpo,
      created_at: new Date().toISOString(),
      nome: profile?.nome ?? 'você',
      _pendente: true,
    }
    setRecados((prev) => [otimista, ...prev])
    setTexto('')

    const { data, error } = await postarMural({
      userId: user.id,
      texto: limpo,
      nome: profile?.nome,
    })
    setPostando(false)

    if (error) {
      // Rollback: tira o otimista e devolve o texto pro campo.
      setRecados((prev) => prev.filter((r) => r.id !== tempId))
      setTexto(limpo)
      setAviso('Não consegui postar. Tenta de novo.')
      return
    }
    setRecados((prev) => prev.map((r) => (r.id === tempId ? data : r)))
  }

  async function apagar(id) {
    const anterior = recados
    setRecados((prev) => prev.filter((r) => r.id !== id)) // otimista
    const { error } = await apagarMural(id)
    if (error) {
      setRecados(anterior) // rollback
      setAviso('Não consegui apagar. Tenta de novo.')
    }
  }

  return (
    <main className="max-w-[720px] mx-auto px-4 py-8 sm:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight">MURAL</h1>
        <p className="mt-1 text-slate text-sm">
          Manda a real, provoca os amigos, comemora o palpite cravado.
        </p>
      </header>

      {/* Campo de novo recado */}
      <form onSubmit={postar} className="bg-cloud rounded-lg border border-line shadow-soft p-4">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          maxLength={LIMITE + 40 /* deixa digitar um pouco além só pra ver o contador vermelho */}
          placeholder="Escreve teu recado pra galera…"
          className="w-full resize-none bg-paper rounded-md border border-line p-3 text-ink placeholder:text-slate/70 focus:outline-none focus:border-verde focus:ring-2 focus:ring-verde/30"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className={`text-xs tnum ${excedeu ? 'text-vermelho font-bold' : 'text-slate'}`}>
            {texto.length}/{LIMITE}
          </span>
          <button
            type="submit"
            disabled={!podePostar}
            className="px-5 h-10 rounded-md bg-verde hover:bg-verde-dark text-cloud font-semibold shadow-hard transition-colors disabled:bg-line disabled:text-slate disabled:shadow-none disabled:cursor-not-allowed"
          >
            {postando ? 'postando…' : 'postar'}
          </button>
        </div>
        {aviso && <p className="mt-2 text-sm text-vermelho">{aviso}</p>}
      </form>

      {/* Lista */}
      {carregando ? (
        <div className="py-12 flex justify-center"><Loader /></div>
      ) : erro ? (
        <p className="text-vermelho text-sm py-6">Não consegui carregar o mural: {erro}</p>
      ) : recados.length === 0 ? (
        <EmptyPanel
          titulo="MURAL VAZIO"
          mensagem="Ninguém mandou nada ainda. Manda o primeiro recado aí em cima!"
        />
      ) : (
        <ul className="space-y-3">
          {recados.map((r) => (
            <Recado
              key={r.id}
              recado={r}
              ehMeu={user?.id === r.user_id}
              onApagar={() => apagar(r.id)}
            />
          ))}
        </ul>
      )}
    </main>
  )
}

function Recado({ recado, ehMeu, onApagar }) {
  const [confirmando, setConfirmando] = useState(false)
  return (
    <li
      className={`bg-cloud rounded-lg border border-line shadow-soft p-4 animate-fade-up ${
        recado._pendente ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-semibold text-ink truncate">{recado.nome ?? 'alguém'}</span>
          <span className="text-xs text-slate shrink-0">{tempoRelativo(recado.created_at)}</span>
        </div>
        {ehMeu && !recado._pendente && (
          confirmando ? (
            <span className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onApagar}
                className="text-xs font-bold text-vermelho hover:underline"
              >
                apagar
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="text-xs text-slate hover:text-ink"
              >
                não
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              aria-label="Apagar recado"
              className="shrink-0 text-slate hover:text-vermelho rounded-md p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-vermelho/40"
            >
              <Lixeira />
            </button>
          )
        )}
      </div>
      <p className="text-ink whitespace-pre-wrap break-words">{recado.texto}</p>
    </li>
  )
}

function Lixeira() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 6h12M8 6V4.5A1.5 1.5 0 019.5 3h1A1.5 1.5 0 0112 4.5V6m2 0v9a1 1 0 01-1 1H7a1 1 0 01-1-1V6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
