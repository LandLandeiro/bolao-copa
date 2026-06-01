// Regra de pontuação — DEVE bater EXATAMENTE com a do banco (CLAUDE.md):
//   placar exato = 5
//   saldo de gols correto = 3
//   resultado correto (V/E/D) = 1
//   errou = 0
// A ordem importa: cravo > saldo > resultado.

export function calcularPontos(palpiteCasa, palpiteFora, golsCasa, golsFora) {
  // Sem placar real ainda → sem pontuação.
  if (golsCasa === null || golsCasa === undefined) return null
  if (golsFora === null || golsFora === undefined) return null

  const pc = Number(palpiteCasa)
  const pf = Number(palpiteFora)
  const gc = Number(golsCasa)
  const gf = Number(golsFora)

  if (pc === gc && pf === gf) return 5
  if (pc - pf === gc - gf) return 3
  if (Math.sign(pc - pf) === Math.sign(gc - gf)) return 1
  return 0
}

// Chip visual da pontuação. Classes COMPLETAS (Tailwind precisa enxergar literal).
// Cores semânticas do DESIGN.md §2: 5=verde, 3=amarelo+ink, 1=azul, 0=slate.
export function chipDePontos(pontos) {
  if (pontos === null || pontos === undefined) return null
  if (pontos === 5) return { label: '+5 cravou',     className: 'bg-verde text-cloud' }
  if (pontos === 3) return { label: '+3 saldo',      className: 'bg-amarelo text-ink' }
  if (pontos === 1) return { label: '+1 resultado',  className: 'bg-azul text-cloud' }
  return                   { label: '0 pts',         className: 'bg-line text-slate' }
}
