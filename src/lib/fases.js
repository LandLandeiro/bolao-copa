// Classificação e rótulos das fases pra organizar a tela de Jogos em "pastas".
// As regras de PONTO ficam em pontuacao.js — aqui é só apresentação/ordenação.
import { FASES } from './pontuacao'

// Ordem cronológica canônica do torneio = ids do banco (matches.fase).
// Derivada de FASES pra não manter duas listas que podem desincronizar:
// ['grupos','16avos','oitavas','quartas','semis','terceiro','final'].
export const ORDEM_FASES = FASES.map((f) => f.id)

// Mata-mata = tudo que não é fase de grupos.
export function ehMataMata(fase) {
  return fase !== 'grupos'
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
