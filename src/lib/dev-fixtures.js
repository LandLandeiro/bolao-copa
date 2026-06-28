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

// ---- 16-avos (16 jogos): a maioria encerrada; 1 ao vivo (sem placar) ----
function dezesseisAvos(agora) {
  const base = agora - 2 * DIA // encerrados nos últimos dias
  const enc = (id, ca, fo, gc, gf, h) => ({
    id, time_casa: ca, time_fora: fo, fase: '16avos', grupo: null,
    estadio: 'Sede', data_hora: iso(base + h * HORA), gols_casa: gc, gols_fora: gf,
  })
  return [
    enc(101, 'África do Sul', 'Canadá', 0, 2, 0),
    enc(102, 'Holanda', 'Marrocos', 0, 1, 3),
    enc(103, 'Alemanha', 'Paraguai', 3, 1, 6),
    enc(104, 'França', 'Suécia', 3, 1, 9),
    enc(105, 'Brasil', 'Japão', 2, 1, 24),
    enc(106, 'Costa do Marfim', 'Noruega', 2, 0, 27),
    // Ao vivo: começou há 1h, ainda sem placar final.
    { id: 107, time_casa: 'México', time_fora: 'Equador', fase: '16avos', grupo: null, estadio: 'Sede', data_hora: iso(agora - 1 * HORA), gols_casa: null, gols_fora: null },
    enc(108, 'Inglaterra', 'RD Congo', 1, 0, 33),
    enc(109, 'Estados Unidos', 'Bósnia e Herzegovina', 2, 1, 30),
    enc(110, 'Bélgica', 'Senegal', 2, 0, 36),
    enc(111, 'Portugal', 'Croácia', 1, 0, 39),
    enc(112, 'Espanha', 'Áustria', 4, 0, 42),
    enc(113, 'Suíça', 'Argélia', 1, 0, 45),
    enc(114, 'Colômbia', 'Cabo Verde', 1, 2, 48),
    enc(115, 'Argentina', 'Uzbequistão', 3, 0, 51),
    enc(116, 'Austrália', 'Egito', 0, 0, 54),
  ]
}

// ---- Oitavas: 3 confrontos já definidos (agendados), resto fica "A definir" ----
function oitavas(agora) {
  const fut = agora + 4 * DIA
  const ag = (id, ca, fo, h) => ({
    id, time_casa: ca, time_fora: fo, fase: 'oitavas', grupo: null,
    estadio: 'Sede', data_hora: iso(fut + h * HORA), gols_casa: null, gols_fora: null,
  })
  return [
    ag(121, 'Canadá', 'Marrocos', 0),
    ag(122, 'Alemanha', 'França', 3),
    ag(123, 'Brasil', 'Costa do Marfim', 24),
  ]
}

export function matchesFixture() {
  const agora = Date.now()
  // quartas/semis/final/terceiro sem linhas → o builder mostra "A definir".
  return [...grupos(agora), ...dezesseisAvos(agora), ...oitavas(agora)]
}

// Palpites do "usuário" dev — cobrem os chips: cravada(+5), saldo(+3), vencedor(+1),
// errou(0), parcial (ao vivo) e jogos sem palpite (106).
export function palpitesFixture() {
  return [
    { match_id: 101, palpite_casa: 0, palpite_fora: 1 }, // 0x2 → só vencedor (+1)
    { match_id: 102, palpite_casa: 1, palpite_fora: 2 }, // 0x1 → saldo (+3)
    { match_id: 103, palpite_casa: 3, palpite_fora: 1 }, // 3x1 → cravada (+5)
    { match_id: 104, palpite_casa: 1, palpite_fora: 0 }, // 3x1 → só vencedor (+1)
    { match_id: 105, palpite_casa: 0, palpite_fora: 1 }, // 2x1 → errou (0)
    { match_id: 107, palpite_casa: 2, palpite_fora: 1 }, // ao vivo → "em jogo"
    { match_id: 109, palpite_casa: 2, palpite_fora: 1 }, // 2x1 → cravada (+5)
    { match_id: 112, palpite_casa: 2, palpite_fora: 0 }, // 4x0 → saldo? diff 2 vs 4 → vencedor (+1)
    // grupos
    { match_id: 1, palpite_casa: 2, palpite_fora: 0 }, // cravada
    { match_id: 3, palpite_casa: 2, palpite_fora: 1 }, // vencedor
  ]
}
