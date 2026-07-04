// ⚠️ DADOS FALSOS — SOMENTE DEV (consumidos por lib/dados.js quando DEV_BYPASS).
// Espelham a referência do chaveamento (chaveamento/) pra dar pra ver todos os
// estados de card sem login nem banco. Datas são relativas ao relógio (Date.now())
// pra os estados (encerrado/ao vivo/agendado) baterem independente do dia em que
// você roda. NUNCA é importado em produção (DEV_BYPASS é false → tree-shaken).

const DIA = 24 * 60 * 60 * 1000
const HORA = 60 * 60 * 1000
const iso = (ms) => new Date(ms).toISOString()

// ---- Fase de grupos (pra a Lista não ficar vazia em dev) ----
function grupos(agora) {
  return [
    { id: 1, time_casa: 'México', time_fora: 'África do Sul', fase: 'grupos', grupo: 'A', estadio: 'Cidade do México', data_hora: iso(agora - 6 * DIA), gols_casa: 2, gols_fora: 0 },
    { id: 2, time_casa: 'Brasil', time_fora: 'Marrocos', fase: 'grupos', grupo: 'C', estadio: 'Nova York', data_hora: iso(agora - 6 * DIA + 3 * HORA), gols_casa: 1, gols_fora: 1 },
    { id: 3, time_casa: 'Alemanha', time_fora: 'Curaçao', fase: 'grupos', grupo: 'E', estadio: 'Houston', data_hora: iso(agora - 5 * DIA), gols_casa: 3, gols_fora: 0 },
    { id: 4, time_casa: 'Espanha', time_fora: 'Cabo Verde', fase: 'grupos', grupo: 'H', estadio: 'Atlanta', data_hora: iso(agora - 5 * DIA + 3 * HORA), gols_casa: null, gols_fora: null },
    { id: 5, time_casa: 'Argentina', time_fora: 'Argélia', fase: 'grupos', grupo: 'J', estadio: 'Kansas City', data_hora: iso(agora + 1 * DIA), gols_casa: null, gols_fora: null },
    { id: 6, time_casa: 'Portugal', time_fora: 'RD Congo', fase: 'grupos', grupo: 'K', estadio: 'Houston', data_hora: iso(agora + 1 * DIA + 3 * HORA), gols_casa: null, gols_fora: null },
  ]
}

// ---- 16-avos (16 jogos, ids 73-88): todos encerrados. Os ids batem com a topologia
// do builder (bracket.js) pra a árvore montar os confrontos reais. Dois jogos foram
// decididos nos PÊNALTIS (empate nos 90') — 85 (Suíça) e 88 (Egito) — pra exercitar o
// destaque de "quem avançou" vindo da rodada seguinte, não do placar. O vencedor de
// cada jogo é o time que reaparece nas oitavas (ver oitavas() abaixo). ----
function dezesseisAvos(agora) {
  const base = agora - 3 * DIA // encerrados nos últimos dias
  const enc = (id, ca, fo, gc, gf, h) => ({
    id, time_casa: ca, time_fora: fo, fase: '16avos', grupo: null,
    estadio: 'Sede', data_hora: iso(base + h * HORA), gols_casa: gc, gols_fora: gf,
  })
  return [
    enc(73, 'Canadá', 'Costa do Marfim', 2, 1, 0),   // → oitava 90
    enc(74, 'Paraguai', 'Japão', 1, 0, 3),           // → oitava 89
    enc(75, 'Marrocos', 'Croácia', 3, 1, 6),         // → oitava 90
    enc(76, 'Brasil', 'Senegal', 2, 0, 9),           // → oitava 91
    enc(77, 'França', 'Suécia', 3, 1, 24),           // → oitava 89
    enc(78, 'Noruega', 'Gana', 2, 1, 27),            // → oitava 91
    enc(79, 'México', 'Equador', 1, 0, 30),          // → oitava 92
    enc(80, 'Inglaterra', 'RD Congo', 2, 0, 33),     // → oitava 92
    enc(81, 'Estados Unidos', 'Áustria', 2, 1, 36),  // → oitava 94
    enc(82, 'Bélgica', 'Uruguai', 2, 0, 39),         // → oitava 94
    enc(83, 'Portugal', 'Panamá', 1, 0, 42),         // → oitava 93
    enc(84, 'Espanha', 'Catar', 4, 0, 45),           // → oitava 93
    enc(85, 'Suíça', 'Argélia', 1, 1, 48),           // pênaltis → Suíça avança (oitava 96)
    enc(86, 'Argentina', 'Uzbequistão', 3, 0, 51),   // → oitava 95
    enc(87, 'Colômbia', 'Cabo Verde', 2, 1, 54),     // → oitava 96
    enc(88, 'Egito', 'Austrália', 0, 0, 57),         // pênaltis → Egito avança (oitava 95)
  ]
}

// ---- Oitavas (8 jogos, ids 89-96): os 8 confrontos reais já definidos. 90 está ao
// vivo; o resto agendado. Quartas em diante ficam "A definir". ----
function oitavas(agora) {
  const fut = agora + 3 * DIA
  const ag = (id, ca, fo, h) => ({
    id, time_casa: ca, time_fora: fo, fase: 'oitavas', grupo: null,
    estadio: 'Sede', data_hora: iso(fut + h * HORA), gols_casa: null, gols_fora: null,
  })
  return [
    ag(89, 'Paraguai', 'França', 0),
    // Ao vivo: começou há 1h, ainda sem placar.
    { id: 90, time_casa: 'Canadá', time_fora: 'Marrocos', fase: 'oitavas', grupo: null, estadio: 'Sede', data_hora: iso(agora - 1 * HORA), gols_casa: null, gols_fora: null },
    ag(91, 'Brasil', 'Noruega', 3),
    ag(92, 'México', 'Inglaterra', 24),
    ag(93, 'Portugal', 'Espanha', 27),
    ag(94, 'Estados Unidos', 'Bélgica', 30),
    ag(95, 'Argentina', 'Egito', 48),
    ag(96, 'Suíça', 'Colômbia', 51),
  ]
}

export function matchesFixture() {
  const agora = Date.now()
  // quartas/semis/final/terceiro sem linhas → o builder mostra "A definir".
  return [...grupos(agora), ...dezesseisAvos(agora), ...oitavas(agora)]
}

// ---- Confronto direto (Feature C) — perfis + pontos por jogo, SÓ EM DEV ----
// Em produção isso vem de profiles e da função get_match_points. Aqui sintetizamos
// os pontos com pontuacao.js APENAS pra preencher o mock (não é o caminho do app:
// o app sempre chama a RPC). Ver lib/dados.js.
import { calcularPontos } from './pontuacao'
import { fakeUser } from './dev-auth'

export function perfisFixture() {
  return [
    { id: fakeUser.id, nome: 'Dev' },
    { id: 'dev-amiga-1', nome: 'Ana' },
    { id: 'dev-amigo-2', nome: 'Bruno' },
    { id: 'dev-amiga-3', nome: 'Carla' },
  ]
}

// Palpites por usuário (dev). match_id → [casa, fora].
const PALPITES_DEV = {
  [fakeUser.id]: { 1: [2, 0], 3: [2, 1], 73: [2, 1], 74: [2, 0], 76: [3, 1], 78: [0, 1], 84: [4, 0], 85: [1, 1], 86: [3, 0], 90: [1, 0] },
  'dev-amiga-1': { 1: [2, 0], 3: [3, 0], 73: [1, 0], 75: [3, 1], 77: [2, 1], 84: [2, 0], 86: [3, 0], 87: [1, 2] },
  'dev-amigo-2': { 1: [1, 0], 3: [1, 1], 73: [1, 1], 76: [2, 1], 80: [1, 0], 83: [0, 0], 88: [1, 1] },
  'dev-amiga-3': { 3: [3, 0], 73: [0, 2], 82: [2, 0], 84: [4, 0], 88: [0, 0] },
}

// Sintetiza o retorno do get_match_points pro usuário (só jogos COM placar).
export function matchPointsFixture(userId) {
  const palp = PALPITES_DEV[userId] ?? {}
  const byId = Object.fromEntries(matchesFixture().map((m) => [m.id, m]))
  const rows = []
  for (const [mid, [pc, pf]] of Object.entries(palp)) {
    const m = byId[mid]
    if (!m || m.gols_casa == null || m.gols_fora == null) continue
    const { base, peso, pontos } = calcularPontos({
      palpiteCasa: pc, palpiteFora: pf, golsCasa: m.gols_casa, golsFora: m.gols_fora, fase: m.fase,
    })
    rows.push({
      match_id: Number(mid), fase: m.fase, data_hora: m.data_hora,
      palpite_casa: pc, palpite_fora: pf, gols_casa: m.gols_casa, gols_fora: m.gols_fora,
      base, peso, pontos,
    })
  }
  return rows
}

// Palpites do "usuário" dev — cobrem os chips: cravada(+5), saldo(+3), vencedor(+1),
// errou(0), parcial (oitava ao vivo, 90) e jogos sem palpite (ex.: 77).
export function palpitesFixture() {
  return [
    { match_id: 73, palpite_casa: 2, palpite_fora: 1 }, // 2x1 → cravada (+5)
    { match_id: 74, palpite_casa: 2, palpite_fora: 0 }, // 1x0 → só vencedor (+1)
    { match_id: 76, palpite_casa: 3, palpite_fora: 1 }, // 2x0 → saldo (+3)
    { match_id: 78, palpite_casa: 0, palpite_fora: 1 }, // 2x1 → errou (0)
    { match_id: 85, palpite_casa: 1, palpite_fora: 1 }, // 1x1 (pênaltis) → cravada (+5)
    { match_id: 90, palpite_casa: 1, palpite_fora: 0 }, // oitava ao vivo → "em jogo"
    // grupos
    { match_id: 1, palpite_casa: 2, palpite_fora: 0 }, // cravada
    { match_id: 3, palpite_casa: 2, palpite_fora: 1 }, // vencedor
  ]
}
