// ⚠️ ESPELHO da migration add_phase_weights_to_leaderboard — se mudar o peso lá,
//    mude aqui. O get_leaderboard() no banco é a FONTE DE VERDADE (o ranking usa os
//    pontos que vêm de lá); este arquivo existe só pra EXIBIR a regra na UI.
//    Os pontos base (5/3/1/0) também espelham a regra de pontos.js / do banco.
//    A função calcularPontos() abaixo é espelho do mesmo CASE: base (delegada a
//    pontos.js) × peso da fase. Mudou o peso/regra no banco? Atualize aqui também.
//
// Pontos finais por jogo = base × peso da fase.
import { calcularPontos as calcularBase } from './pontos'

// Pontos base por palpite (idêntico a calcularPontos em pontos.js e ao CASE do banco).
// A ordem importa: cravou > saldo > resultado.
export const PONTOS_BASE = [
  { pontos: 5, regra: 'Cravou o placar exato' },
  { pontos: 3, regra: 'Acertou o saldo de gols' },
  { pontos: 1, regra: 'Acertou só quem venceu (ou o empate)' },
  { pontos: 0, regra: 'Errou' },
]

// Multiplicador por fase: string canônica do banco (= matches.fase) → peso.
// MESMOS valores do CASE da função score_peso (migration
// scope_scoring_functions_by_torneio), que é quem o get_leaderboard usa.
export const PESOS_FASE = {
  grupos: 1,
  '16avos': 2,
  oitavas: 3,
  quartas: 5,
  semis: 8,
  terceiro: 5,
  final: 13,
  // Brasileirão: fase única 'rodada'. TODAS as rodadas valem peso 1 — não existe
  // escada de pesos numa liga de pontos corridos. No banco isso cai no `else 1`
  // do score_peso; aqui é explícito pra não depender do fallback do `?? 1`.
  rodada: 1,
}

// Ordem de exibição da escada (cronológica do torneio) + rótulo amigável em PT.
// `id` = string canônica do banco (bate com PESOS_FASE e com matches.fase).
// Só o mata-mata entra: numa liga não há escada pra mostrar (ver RegrasPontuacao).
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

// Pontuação final de UM jogo, pra exibição (modal de palpites). Espelha o
// get_leaderboard: base (regra 5/3/1/0 de pontos.js — cravou > saldo > resultado)
// × peso da fase. Jogo já começou mas sem placar (gols null) → estado "aguardando":
// { base: null, peso, pontos: null }.
export function calcularPontos({ palpiteCasa, palpiteFora, golsCasa, golsFora, fase }) {
  const peso = PESOS_FASE[fase] ?? 1
  const base = calcularBase(palpiteCasa, palpiteFora, golsCasa, golsFora) // 5/3/1/0 ou null
  if (base === null) return { base: null, peso, pontos: null }
  return { base, peso, pontos: base * peso }
}
