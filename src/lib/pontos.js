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
//
// Recebe a BASE (5/3/1/0), não o ponto final: cor e termo descrevem a QUALIDADE do
// palpite, que não muda com o peso da fase. O NÚMERO é montado por quem chama, a
// partir de base × peso (lib/pontuacao). Por isso não há mais `label` pronto aqui —
// ele embutia o número da base e mentia em fase com peso > 1.
export function chipDePontos(base) {
  if (base === null || base === undefined) return null
  if (base === 5) return { termo: 'cravou',    className: 'bg-verde text-cloud' }
  if (base === 3) return { termo: 'saldo',     className: 'bg-amarelo text-ink' }
  if (base === 1) return { termo: 'resultado', className: 'bg-azul text-cloud' }
  return                 { termo: 'pts',       className: 'bg-line text-slate' }
}
