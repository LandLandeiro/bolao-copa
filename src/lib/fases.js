// Classificação e rótulos das fases pra organizar a tela de Jogos em "pastas".
// As regras de PONTO ficam em pontuacao.js — aqui é só apresentação/ordenação.
import { FASES } from './pontuacao'

// Ordem cronológica canônica do torneio = ids do banco (matches.fase).
// Derivada de FASES pra não manter duas listas que podem desincronizar:
// ['grupos','16avos','oitavas','quartas','semis','terceiro','final'].
export const ORDEM_FASES = FASES.map((f) => f.id)

// Mata-mata = fase do bracket da Copa. Testa contra a lista canônica em vez de
// "tudo que não é grupos": a fase 'rodada' do Brasileirão não é mata-mata nenhum.
export function ehMataMata(fase) {
  return fase !== 'grupos' && ORDEM_FASES.includes(fase)
}

// Rótulos LONGOS pros cabeçalhos das pastas (mais formais que os curtos de FASES,
// que são usados na escada de pesos). 'grupos' não entra: vira o bloco "Fase de Grupos".
const ROTULOS_RODADA = {
  '16avos': '16 avos de final',
  oitavas: 'Oitavas de final',
  quartas: 'Quartas de final',
  semis: 'Semifinais',
  terceiro: 'Disputa de 3º lugar',
  final: 'Final',
}

export function rotuloRodada(fase) {
  return ROTULOS_RODADA[fase] ?? fase
}

// Rótulo da rodada pro BADGE do card (pill apertado, ainda mais no mobile): igual ao
// rotuloRodada, mas encurta o que não cabe. "Disputa de 3º lugar" → "3º lugar".
const ROTULOS_BADGE = {
  terceiro: '3º lugar',
}

export function rotuloRodadaBadge(fase) {
  return ROTULOS_BADGE[fase] ?? rotuloRodada(fase)
}

// O card só leva badge de fase quando a fase acrescenta informação: jogo de grupo
// já está sob "Fase de Grupos", e jogo do Brasileirão já está sob "Rodada N".
export function temBadgeDeFase(fase) {
  return fase !== 'grupos' && fase !== 'rodada'
}

// Rótulo curto de UM jogo, pra listas que misturam torneios (palpites de um usuário,
// confronto direto): "Rodada 21" na liga, nome da fase no mata-mata.
export function rotuloDoJogo({ fase, rodada }) {
  if (rodada != null) return `Rodada ${rodada}`
  return FASES.find((f) => f.id === fase)?.nome ?? fase
}
