import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import MatchCard from '../components/MatchCard'
import EmptyPanel from '../components/EmptyPanel'

export default function Jogos() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [palpites, setPalpites] = useState({}) // map por match_id
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

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

  // Particiona em abertos (asc) e trancados (desc, mais recente primeiro).
  const agora = Date.now()
  const abertos = matches.filter((m) => new Date(m.data_hora).getTime() > agora)
  const trancados = matches
    .filter((m) => new Date(m.data_hora).getTime() <= agora)
    .slice()
    .reverse()

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

  // Tela inteira vazia: empty ilustrado no lugar das duas seções.
  if (matches.length === 0) {
    return (
      <main className="max-w-[720px] mx-auto px-4 py-8 sm:py-10 space-y-8">
        <header>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight">JOGOS</h1>
          <p className="mt-1 text-slate text-sm">
            Palpite antes do apito inicial — depois disso, trava.
          </p>
        </header>
        <EmptyPanel
          titulo="AINDA SEM JOGOS"
          mensagem="Espera o admin cadastrar os primeiros jogos."
        />
      </main>
    )
  }

  return (
    <main className="max-w-[720px] mx-auto px-4 py-8 sm:py-10 space-y-12 sm:space-y-14">
      <header>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight">JOGOS</h1>
        <p className="mt-1 text-slate text-sm">
          Palpite antes do apito inicial — depois disso, trava.
        </p>
      </header>

      <Secao
        titulo="PALPITE AÍ"
        contagem={abertos.length}
        accent="bg-verde"
        vazioMsg="Nenhum jogo aberto agora. Volta depois."
      >
        {abertos.map((m, i) => (
          <CardEntrada key={m.id} index={i}>
            <MatchCard
              match={m}
              palpite={palpites[m.id]}
              onSaved={recarregarPalpites}
            />
          </CardEntrada>
        ))}
      </Secao>

      <Secao
        titulo="JÁ ROLARAM"
        contagem={trancados.length}
        accent="bg-slate"
        vazioMsg="Ainda não rolou nenhum jogo."
      >
        {trancados.map((m, i) => (
          <CardEntrada key={m.id} index={i}>
            <MatchCard
              match={m}
              palpite={palpites[m.id]}
              onSaved={recarregarPalpites}
            />
          </CardEntrada>
        ))}
      </Secao>
    </main>
  )
}

function Secao({ titulo, contagem, accent, vazioMsg, children }) {
  const vazio = !contagem
  return (
    <section>
      <h2 className="font-display text-2xl sm:text-3xl tracking-tight mb-4 flex items-center gap-3">
        {/* Acento vertical na cor da seção — pequena assinatura visual. */}
        <span className={`inline-block w-1.5 h-7 rounded-sm ${accent}`} aria-hidden="true" />
        <span>{titulo}</span>
        <span className="text-xs font-sans font-semibold text-slate tnum ml-auto">
          {contagem} {contagem === 1 ? 'jogo' : 'jogos'}
        </span>
      </h2>

      {vazio ? (
        <div className="bg-cloud rounded-lg border border-line border-dashed p-6 text-center text-slate text-sm">
          {vazioMsg}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {children}
        </div>
      )}
    </section>
  )
}

// Wrapper só pra escalonar o fade-up sem mexer no MatchCard.
function CardEntrada({ index, children }) {
  return (
    <div
      className="animate-fade-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {children}
    </div>
  )
}
