import { ESCUDOS, ESCALAS, EXT_ESCUDO, ESCALA_MAX } from '../lib/escudos'

// 🔧 PÁGINA TEMPORÁRIA DE CONFERÊNCIA — rota /dev/escudos.
//
// Serve pra olhar os 20 escudos lado a lado e corrigir na mão as escalas que a
// conta de área errou (ela mede quanta tinta tem, não quão grande a coisa PARECE).
// Cada time aparece duas vezes, na MESMA caixa: em cima sem escala, embaixo com.
//
// Como usar: ache o que está fora do time, mude o número em ESCALAS (lib/escudos.js)
// e recarregue. Some daqui quando os valores estiverem bons.
const TIMES = Object.entries(ESCUDOS).map(([nome, slug]) => ({
  nome,
  slug,
  escala: ESCALAS[slug] ?? 1,
}))

const CAIXA = 72

export default function ConferirEscudos() {
  const escalas = TIMES.map((t) => t.escala)
  const min = Math.min(...escalas)
  const max = Math.max(...escalas)

  return (
    <main className="max-w-[1120px] mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="font-display text-4xl tracking-tight">CONFERIR ESCUDOS</h1>
        <p className="mt-1 text-slate text-sm">
          Caixa de {CAIXA}px nas duas fileiras — só o conteúdo muda. Escalas de{' '}
          <strong className="text-ink tnum">{min.toFixed(2)}</strong> a{' '}
          <strong className="text-ink tnum">{max.toFixed(2)}</strong>. Ajuste em{' '}
          <code className="text-ink">ESCALAS</code> (src/lib/escudos.js). Página
          temporária — apagar quando estiver bom.
        </p>
      </header>

      <Fileira
        titulo="SEM compensação"
        descricao="Como fica cru: brasão alto some, escudo redondo domina."
        times={TIMES}
        aplicarEscala={false}
      />

      <Fileira
        titulo="COM compensação"
        descricao="Escala por massa visual. Os corpos devem parecer do mesmo tamanho."
        times={TIMES}
        aplicarEscala
      />
    </main>
  )
}

function Fileira({ titulo, descricao, times, aplicarEscala }) {
  return (
    <section>
      <h2 className="font-display text-2xl tracking-tight text-ink">{titulo}</h2>
      <p className="text-slate text-sm mb-3">{descricao}</p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-3">
        {times.map((t) => (
          <li
            key={t.slug}
            className="flex flex-col items-center gap-1 bg-cloud border border-line rounded-lg p-2"
          >
            {/* Caixa idêntica nas duas fileiras — a régua da comparação. */}
            <span
              style={{ width: CAIXA, height: CAIXA }}
              className="inline-flex items-center justify-center bg-paper rounded-md"
            >
              <img
                src={`/escudos/${t.slug}.${EXT_ESCUDO}`}
                alt={t.nome}
                style={
                  aplicarEscala
                    ? {
                        width: CAIXA / ESCALA_MAX,
                        height: CAIXA / ESCALA_MAX,
                        transform: `scale(${t.escala})`,
                      }
                    : { width: CAIXA, height: CAIXA }
                }
                className="object-contain"
              />
            </span>
            <span className="text-[11px] text-ink font-semibold text-center leading-tight">
              {t.nome}
            </span>
            <span
              className={`text-[11px] tnum ${
                aplicarEscala ? 'text-verde font-bold' : 'text-slate'
              }`}
            >
              {aplicarEscala ? t.escala.toFixed(2) : '1.00'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
