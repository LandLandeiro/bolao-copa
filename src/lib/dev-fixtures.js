// ⚠️ DADOS FALSOS — SOMENTE DEV (consumidos por lib/dados.js quando DEV_BYPASS).
// Espelham a referência do chaveamento (chaveamento/) pra dar pra ver todos os
// estados de card sem login nem banco. Datas são relativas ao relógio (Date.now())
// pra os estados (encerrado/ao vivo/agendado) baterem independente do dia em que
// você roda. NUNCA é importado em produção (DEV_BYPASS é false → tree-shaken).
//
// Multi-torneio: os fixtures cobrem os DOIS torneios, com os mesmos ids do banco
// (copa-2026 = 1, brasileirao-2026 = 2). Sem isto não dá pra ver a tela do
// Brasileirão em dev — em produção ela nasce vazia até o seed dos jogos entrar.

const DIA = 24 * 60 * 60 * 1000
const HORA = 60 * 60 * 1000
const iso = (ms) => new Date(ms).toISOString()

// ---- Torneios (espelham as linhas reais da tabela `torneios`) ----
const TORNEIOS = [
  { id: 1, slug: 'copa-2026', nome: 'Copa do Mundo 2026', encerrado: true },
  { id: 2, slug: 'brasileirao-2026', nome: 'Brasileirão 2026 · Returno', encerrado: false },
]

export function torneioFixture(slug) {
  return TORNEIOS.find((t) => t.slug === slug) ?? null
}

const idDoSlug = (slug) => torneioFixture(slug)?.id ?? null

// ---- COPA (torneio_id 1) ------------------------------------------------------
// `rodada` é sempre null na Copa (o CHECK do banco exige isso).

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

function matchesCopa(agora) {
  // quartas/semis/final/terceiro sem linhas → o builder mostra "A definir".
  return [...grupos(agora), ...dezesseisAvos(agora), ...oitavas(agora)].map((m) => ({
    ...m,
    torneio_id: 1,
    rodada: null,
  }))
}

// ---- BRASILEIRÃO (torneio_id 2) -----------------------------------------------
// fase = 'rodada' em todos; `rodada` de 20 a 38 (CHECK do banco). Ids na faixa 200+
// pra não colidir com a Copa. O recorte cobre os três estados que a tela precisa
// mostrar: rodada encerrada (resumo "+N pts"), rodada ATUAL (tem jogo sem placar →
// é ela que abre por padrão) e rodadas futuras (recolhidas, mas liberadas pra palpite).
// `quando = null` → jogo SEM data marcada (a CBF ainda não definiu). O prazo do
// palpite passa a ser o início da rodada — ver lib/prazo.js / palpite_aberto().
function matchesBrasileirao(agora) {
  const jogo = (id, rodada, ca, fo, quando, gc = null, gf = null) => ({
    id, time_casa: ca, time_fora: fo, fase: 'rodada', rodada, grupo: null,
    estadio: 'A definir', data_hora: quando == null ? null : iso(quando),
    gols_casa: gc, gols_fora: gf, torneio_id: 2,
  })
  const r20 = agora - 8 * DIA
  const r21 = agora - 1 * DIA
  const r22 = agora + 5 * DIA
  return [
    // Rodada 20 — encerrada.
    jogo(201, 20, 'Flamengo', 'Palmeiras', r20, 2, 1),
    jogo(202, 20, 'Corinthians', 'São Paulo', r20 + 2 * HORA, 0, 0),
    jogo(203, 20, 'Grêmio', 'Internacional', r20 + 1 * DIA, 1, 3),
    jogo(204, 20, 'Fluminense', 'Botafogo', r20 + 1 * DIA + 2 * HORA, 2, 2),
    // Rodada 21 — ATUAL: dois já saíram, um ao vivo, e um SEM DATA cuja rodada já
    // começou → palpite fechado com o motivo "rodada já começou".
    jogo(211, 21, 'Atlético-MG', 'Cruzeiro', r21, 1, 0),
    jogo(212, 21, 'Bahia', 'Vasco', r21 + 2 * HORA, 3, 1),
    jogo(213, 21, 'Santos', 'Bragantino', agora - 1 * HORA), // ao vivo
    jogo(214, 21, 'Fortaleza', 'Ceará', null), // sem data, rodada já começou
    // Rodada 22 — futura. Dois com data e dois SEM data: os "a definir" caem no fim
    // do grupo e seguem palpitáveis até o início da rodada (menor data_hora dela).
    jogo(221, 22, 'Palmeiras', 'Corinthians', r22),
    jogo(222, 22, 'São Paulo', 'Flamengo', r22 + 2 * HORA),
    jogo(223, 22, 'Internacional', 'Fluminense', null),
    jogo(224, 22, 'Botafogo', 'Grêmio', null),
    // Rodada 23 — futura e com a tabela INTEIRA por definir: sem prazo conhecido,
    // segue toda aberta (o 'infinity' do palpite_aberto).
    jogo(231, 23, 'Cruzeiro', 'Bahia', null),
    jogo(232, 23, 'Vasco', 'Atlético-MG', null),
    jogo(233, 23, 'Bragantino', 'Fortaleza', null),
    jogo(234, 23, 'Ceará', 'Santos', null),
  ]
}

// Recebe o torneio_id (lib/dados.js já exige o escopo) e devolve só os jogos dele —
// igual ao .eq('torneio_id', …) que roda em produção.
export function matchesFixture(torneioId) {
  const agora = Date.now()
  const todos = [...matchesCopa(agora), ...matchesBrasileirao(agora)]
  return todos.filter((m) => m.torneio_id === Number(torneioId))
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

// Palpites por usuário (dev). match_id → [casa, fora]. Ids 2xx = Brasileirão.
const PALPITES_DEV = {
  [fakeUser.id]: { 1: [2, 0], 3: [2, 1], 73: [2, 1], 74: [2, 0], 76: [3, 1], 78: [0, 1], 84: [4, 0], 85: [1, 1], 86: [3, 0], 90: [1, 0], 201: [2, 1], 202: [1, 0], 203: [1, 2], 204: [2, 2], 211: [1, 0], 213: [2, 1], 221: [1, 1] },
  'dev-amiga-1': { 1: [2, 0], 3: [3, 0], 73: [1, 0], 75: [3, 1], 77: [2, 1], 84: [2, 0], 86: [3, 0], 87: [1, 2], 201: [1, 1], 202: [0, 0], 203: [0, 2], 211: [2, 0], 212: [3, 1] },
  'dev-amigo-2': { 1: [1, 0], 3: [1, 1], 73: [1, 1], 76: [2, 1], 80: [1, 0], 83: [0, 0], 88: [1, 1], 201: [3, 1], 204: [1, 1], 212: [2, 2] },
  'dev-amiga-3': { 3: [3, 0], 73: [0, 2], 82: [2, 0], 84: [4, 0], 88: [0, 0], 202: [0, 0], 203: [1, 3] },
}

// Todos os jogos dos dois torneios, indexados por id (pros fixtures cruzarem
// palpite × jogo sem se importar com torneio).
function todosOsJogos() {
  const agora = Date.now()
  return Object.fromEntries(
    [...matchesCopa(agora), ...matchesBrasileirao(agora)].map((m) => [m.id, m]),
  )
}

// Sintetiza o retorno do get_match_points pro usuário NO TORNEIO pedido (só jogos
// COM placar) — mesmo recorte que a função do banco faz com o p_torneio.
export function matchPointsFixture(userId, torneioSlug) {
  const alvo = idDoSlug(torneioSlug)
  const palp = PALPITES_DEV[userId] ?? {}
  const byId = todosOsJogos()
  const rows = []
  for (const [mid, [pc, pf]] of Object.entries(palp)) {
    const m = byId[mid]
    if (!m || m.torneio_id !== alvo) continue
    if (m.gols_casa == null || m.gols_fora == null) continue
    const { base, peso, pontos } = calcularPontos({
      palpiteCasa: pc, palpiteFora: pf, golsCasa: m.gols_casa, golsFora: m.gols_fora, fase: m.fase,
    })
    rows.push({
      match_id: Number(mid), fase: m.fase, rodada: m.rodada, data_hora: m.data_hora,
      palpite_casa: pc, palpite_fora: pf, gols_casa: m.gols_casa, gols_fora: m.gols_fora,
      base, peso, pontos,
    })
  }
  return rows
}

// Ranking do torneio — mesma agregação do get_leaderboard, em cima do fixture.
export function leaderboardFixture(torneioSlug) {
  return perfisFixture()
    .map(({ id, nome }) => {
      const rows = matchPointsFixture(id, torneioSlug)
      return {
        user_id: id,
        nome,
        pontos: rows.reduce((s, r) => s + (r.pontos ?? 0), 0),
        cravadas: rows.filter((r) => r.base === 5).length,
      }
    })
    .sort((a, b) => b.pontos - a.pontos || b.cravadas - a.cravadas)
}

// Palpites do "usuário" dev NO TORNEIO pedido — derivados do mesmo PALPITES_DEV que
// alimenta o ranking, pra as duas telas contarem a mesma história. Na Copa cobrem os
// chips (cravada/saldo/vencedor/errou/ao vivo/sem palpite); no Brasileirão cobrem
// rodada encerrada + rodada atual com jogo em aberto.
export function palpitesFixture(torneioId) {
  const palp = PALPITES_DEV[fakeUser.id] ?? {}
  const byId = todosOsJogos()
  return Object.entries(palp)
    .filter(([mid]) => byId[mid]?.torneio_id === Number(torneioId))
    .map(([mid, [casa, fora]]) => ({
      match_id: Number(mid),
      palpite_casa: casa,
      palpite_fora: fora,
    }))
}
