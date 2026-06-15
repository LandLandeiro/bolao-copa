// ⚠️ ESPELHO da migration add_phase_weights_to_leaderboard — se mudar o peso lá,
//    mude aqui. O get_leaderboard() no banco é a FONTE DE VERDADE (o ranking usa os
//    pontos que vêm de lá); este arquivo existe só pra EXIBIR a regra na UI.
//    Os pontos base (5/3/1/0) também espelham a regra de pontos.js / do banco.
//
// Pontos finais por jogo = base × peso da fase.

// Pontos base por palpite (idêntico a calcularPontos em pontos.js e ao CASE do banco).
// A ordem importa: cravou > saldo > resultado.
export const PONTOS_BASE = [
  { pontos: 5, regra: 'Cravou o placar exato' },
  { pontos: 3, regra: 'Acertou o saldo de gols' },
  { pontos: 1, regra: 'Acertou só quem venceu (ou o empate)' },
  { pontos: 0, regra: 'Errou' },
]

// Multiplicador por fase: string canônica do banco (= matches.fase) → peso.
// MESMOS valores do CASE m.fase em get_leaderboard.
export const PESOS_FASE = {
  grupos: 1,
  '16avos': 2,
  oitavas: 3,
  quartas: 5,
  semis: 8,
  terceiro: 5,
  final: 13,
}

// Ordem de exibição da escada (cronológica do torneio) + rótulo amigável em PT.
// `id` = string canônica do banco (bate com PESOS_FASE e com matches.fase).
export const FASES = [
  { id: 'grupos', nome: 'Grupos' },
  { id: '16avos', nome: '16-avos' },
  { id: 'oitavas', nome: 'Oitavas' },
  { id: 'quartas', nome: 'Quartas' },
  { id: 'semis', nome: 'Semis' },
  { id: 'terceiro', nome: '3º lugar' },
  { id: 'final', nome: 'Final' },
]

// Maior peso (final = 13) — base pra largura proporcional das barras da escada.
export const PESO_MAX = Math.max(...Object.values(PESOS_FASE))
