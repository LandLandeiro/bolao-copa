import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTorneio } from '../context/TorneioContext'
import { carregarLeaderboard } from '../lib/dados'
import EmptyPanel from '../components/EmptyPanel'
import RegrasPontuacao from '../components/RegrasPontuacao'
import PalpitesUsuario from '../components/PalpitesUsuario'
import Loader from '../components/Loader'

const MEDALHAS = ['🥇', '🥈', '🥉']

export default function Ranking() {
  const { user } = useAuth()
  const torneio = useTorneio()
  const [linhas, setLinhas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  // Usuário cujos palpites estão abertos no modal ({ id, nome }) — ou null.
  const [verPalpites, setVerPalpites] = useState(null)

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      setCarregando(true)
      setErro(null)
      // Sempre com o slug do torneio da rota — nunca no default do banco.
      const { data, error } = await carregarLeaderboard(torneio.slug)
      if (cancelado) return
      if (error) {
        setErro(error.message)
        setCarregando(false)
        return
      }
      // Garante ordem por pontos desc caso a RPC mude no futuro.
      const ordenado = (data ?? [])
        .slice()
        .sort((a, b) => (b.pontos ?? 0) - (a.pontos ?? 0))
      setLinhas(ordenado)
      setCarregando(false)
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [torneio.slug])

  if (carregando) {
    return (
      <main className="max-w-[880px] mx-auto px-4 py-16 flex justify-center">
        <Loader />
      </main>
    )
  }

  if (erro) {
    return (
      <main className="max-w-[880px] mx-auto px-4 py-8">
        <p className="text-vermelho">Não consegui carregar o ranking: {erro}</p>
      </main>
    )
  }

  return (
    <main className="max-w-[880px] mx-auto px-4 py-8 space-y-8">
      {/*
        Faixa fina com a arte da Copa de fundo + scrim escuro.
        Altura contida — não rouba foco da lista logo abaixo.
      */}
      <header
        className="relative rounded-xl overflow-hidden bg-ink bg-cover bg-center"
        style={{ backgroundImage: 'url(/ranking-faixa.webp)' }}
      >
        <div className="absolute inset-0 bg-ink/60" aria-hidden="true" />
        <div className="relative p-6 sm:p-8">
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-paper">
            RANKING
          </h1>
          <p className="mt-1 text-paper/80 text-sm">
            {torneio.nome} · {torneio.encerrado
              ? 'classificação final.'
              : 'só conta jogo encerrado.'}
          </p>
        </div>
      </header>

      {/* Atalho pro confronto direto (você vs amigo). Só na árvore da raiz: o
          arquivo da Copa tem só jogos + ranking (ver App.jsx). */}
      {torneio.base === '' && (
        <Link
          to="/confronto"
          className="flex items-center justify-between gap-3 bg-ink text-paper rounded-lg px-5 py-4 shadow-hard hover:-translate-y-0.5 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-verde"
        >
          <span className="font-semibold">⚔️ Confronto direto — você vs um amigo</span>
          <span aria-hidden="true" className="font-display text-xl">→</span>
        </Link>
      )}

      {linhas.length === 0 ? (
        <EmptyPanel
          titulo="AINDA EM BRANCO"
          mensagem="Ninguém pontuou ainda. Vai lá palpitar nos jogos!"
        />
      ) : (
        <ol className="space-y-2">
          {linhas.map((linha, i) => (
            <LinhaRanking
              key={linha.user_id ?? i}
              posicao={i + 1}
              linha={linha}
              ehVoce={user?.id === linha.user_id}
              onAbrir={setVerPalpites}
            />
          ))}
        </ol>
      )}

      <RegrasPontuacao formato={torneio.formato} />

      {verPalpites && (
        <PalpitesUsuario
          userId={verPalpites.id}
          nome={verPalpites.nome}
          onClose={() => setVerPalpites(null)}
        />
      )}
    </main>
  )
}

function LinhaRanking({ posicao, linha, ehVoce, onAbrir }) {
  const ehPrimeiro = posicao === 1
  const medalha = MEDALHAS[posicao - 1] ?? null

  const base =
    'flex items-center gap-3 sm:gap-4 bg-cloud rounded-lg border border-line shadow-soft p-3 sm:p-4 animate-fade-up cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-verde'
  const realceOuro = ehPrimeiro ? 'border-l-4 border-l-ouro bg-ouro/10' : ''
  const realceVoce = ehVoce ? 'ring-2 ring-verde' : ''

  const abrir = () => onAbrir({ id: linha.user_id, nome: linha.nome })

  return (
    <li
      role="button"
      tabIndex={0}
      aria-haspopup="dialog"
      aria-label={`Ver palpites de ${linha.nome ?? 'jogador'}`}
      onClick={abrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          abrir()
        }
      }}
      className={`${base} ${realceOuro} ${realceVoce}`}
      style={{ animationDelay: `${Math.min(posicao - 1, 12) * 30}ms` }}
    >
      {/* Posição: número em Anton + medalha (top 3) */}
      <div className="flex items-center gap-1 min-w-[56px]">
        <span className="font-display text-3xl sm:text-4xl tnum leading-none text-ink">
          {posicao}
        </span>
        {medalha && (
          <span className="text-xl sm:text-2xl leading-none" aria-hidden="true">
            {medalha}
          </span>
        )}
      </div>

      {/* Nome + cravadas */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-base sm:text-lg text-ink truncate">
          {linha.nome ?? 'sem nome'}
          {ehVoce && (
            <span className="ml-2 text-xs font-normal text-verde">(você)</span>
          )}
        </div>
        <div className="text-xs sm:text-sm text-slate tnum">
          {(linha.cravadas ?? 0)} {linha.cravadas === 1 ? 'cravada' : 'cravadas'}
        </div>
      </div>

      {/* Pontos em destaque */}
      <div className="text-right">
        <span className="font-display text-3xl sm:text-4xl tnum leading-none text-ink">
          {linha.pontos ?? 0}
        </span>
        <span className="ml-1 text-xs sm:text-sm text-slate font-semibold">
          pts
        </span>
      </div>
    </li>
  )
}
