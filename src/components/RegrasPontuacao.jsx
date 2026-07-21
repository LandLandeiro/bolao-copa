// Painel "Como funciona a pontuação" da tela de Ranking.
// Estático: lê a regra de src/lib/pontuacao.js (espelho do banco) — NÃO chama o backend.
// Mostra os pontos base e a escada de pesos por fase, com a final como o grande prêmio.
import { chipDePontos } from '../lib/pontos'
import { PONTOS_BASE, PESOS_FASE, FASES, PESO_MAX } from '../lib/pontuacao'

// `formato` (do torneio da rota): decide se a ESCADA DE PESOS aparece.
//   • 'mata-mata'       → escada completa (grupos 1× … final 13×).
//   • 'pontos-corridos' → sem escada: numa liga não existe fase, toda rodada vale
//     igual. Mostrar uma tabela de pesos ali seria inventar uma regra que não existe.
// A regra base (5/3/1/0) é a mesma nos dois e aparece sempre.
//
// `faseAtual` (opcional): id canônico da fase a destacar na escada (ex.: 'oitavas').
// A página de Ranking não carrega os jogos, então não passa nada (sem destaque) —
// não vale um fetch novo só pra isso. Se um dia a fase atual estiver à mão no client,
// é só passar a prop que o destaque acende sozinho.
export default function RegrasPontuacao({ formato = 'mata-mata', faseAtual = null }) {
  const mostrarEscada = formato === 'mata-mata'

  return (
    <section
      aria-labelledby="regras-titulo"
      className="bg-cloud rounded-lg border border-line shadow-soft p-5 sm:p-6 animate-fade-up"
    >
      <h2
        id="regras-titulo"
        className="font-display text-2xl sm:text-3xl tracking-tight text-ink"
      >
        COMO FUNCIONA A PONTUAÇÃO
      </h2>

      {/* 1) Pontos base por palpite */}
      <p className="mt-4 text-xs uppercase tracking-widest text-slate font-semibold">
        Por palpite
      </p>
      <ul className="mt-2 space-y-2">
        {PONTOS_BASE.map(({ pontos, regra }) => (
          <li key={pontos} className="flex items-center gap-3">
            <span
              className={`inline-flex items-center justify-center min-w-[44px] px-2.5 py-1 rounded-pill text-sm font-bold tnum ${chipDePontos(pontos).className}`}
            >
              {pontos === 0 ? '0' : `+${pontos}`}
            </span>
            <span className="text-sm text-ink">{regra}</span>
          </li>
        ))}
      </ul>

      {/* 2) Liga: sem escada — a regra que falta contar é que rodada não tem peso. */}
      {!mostrarEscada && (
        <p className="mt-4 text-sm text-slate">
          <strong className="font-bold text-ink">Todas as rodadas valem igual</strong> —
          não tem peso por fase. Os pontos do jogo são os pontos do palpite.
        </p>
      )}

      {/* 3) Mata-mata: escada de pesos por fase */}
      {mostrarEscada && <EscadaDePesos faseAtual={faseAtual} />}
    </section>
  )
}

// Escada de pesos — só faz sentido em torneio de mata-mata, onde a fase multiplica
// os pontos. Largura da barra proporcional ao peso, final em destaque.
function EscadaDePesos({ faseAtual }) {
  return (
    <>
      <p className="mt-6 text-xs uppercase tracking-widest text-slate font-semibold">
        Peso por fase
      </p>
      <ul className="mt-2 space-y-1.5">
        {FASES.map((fase) => {
          const peso = PESOS_FASE[fase.id]
          const ehFinal = fase.id === 'final'
          const ehAtual = faseAtual === fase.id
          const largura = `${(peso / PESO_MAX) * 100}%`
          return (
            <li
              key={fase.id}
              className={`flex items-center gap-2 sm:gap-3 rounded-md px-1.5 py-1 ${ehAtual ? 'ring-2 ring-verde bg-verde/5' : ''}`}
            >
              <span
                className={`w-16 sm:w-20 shrink-0 text-sm text-ink ${ehFinal ? 'font-bold' : 'font-semibold'}`}
              >
                {fase.nome}
              </span>

              {/* Trilho proporcional ao peso — decorativo (a info está no texto). */}
              <span
                className="flex-1 h-2.5 rounded-pill bg-line overflow-hidden"
                aria-hidden="true"
              >
                <span
                  className={`block h-full rounded-pill ${ehFinal ? 'bg-verde' : 'bg-verde/60'}`}
                  style={{ width: largura }}
                />
              </span>

              <span
                className={`shrink-0 text-sm font-bold tnum ${ehFinal ? 'bg-verde text-cloud px-2 py-0.5 rounded-pill shadow-hard' : 'w-9 text-right text-ink'}`}
              >
                {peso}×
              </span>

              {ehAtual && (
                <span className="shrink-0 text-[10px] uppercase tracking-wider font-bold text-verde">
                  agora
                </span>
              )}
            </li>
          )
        })}
      </ul>

      {/* Narrativa: a final é a virada */}
      <p className="mt-4 text-sm text-slate">
        Os pontos de cada jogo são multiplicados pelo peso da fase. A final vale{' '}
        <strong className="font-bold text-ink">13×</strong> um jogo de grupo — dá pra
        virar o bolão até o fim.
      </p>
    </>
  )
}
