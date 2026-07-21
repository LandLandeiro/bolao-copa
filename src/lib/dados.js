// Camada de leitura de jogos/palpites/ranking. Em produção bate no Supabase (com
// RLS); em DEV com bypass ligado, serve um fixture local (a RLS de matches exige
// sessão real, então sem isto as telas viriam vazias em dev). Ver lib/dev-auth.js.
//
// ⚠️ MULTI-TORNEIO — a regra que sustenta o resto:
// toda leitura de matches/predictions/ranking é ESCOPADA por torneio, e o escopo é
// ARGUMENTO OBRIGATÓRIO: sem ele a função ESTOURA na hora. É de propósito. Um único
// SELECT sem filtro aqui faria o ranking do Brasileirão somar os pontos da Copa.
// NÃO invente valor default — nem aqui, nem no p_torneio das RPCs (o default que
// existe no banco é compatibilidade temporária e vai ser removido).
import { supabase } from './supabase'
import { DEV_BYPASS } from './dev-auth'
import {
  matchesFixture,
  palpitesFixture,
  perfisFixture,
  matchPointsFixture,
  torneioFixture,
  leaderboardFixture,
} from './dev-fixtures'

// Falha alto e cedo quando alguém esquece de passar o torneio.
function exigeEscopo(fn, nome, valor) {
  if (valor === undefined || valor === null || valor === '') {
    throw new Error(
      `${fn}: "${nome}" é obrigatório — toda query é escopada por torneio (ver lib/dados.js).`,
    )
  }
}

// O torneio da rota, pelo slug. Alimenta o TorneioContext.
export async function carregarTorneio(slug) {
  exigeEscopo('carregarTorneio', 'slug', slug)
  if (DEV_BYPASS) return { data: torneioFixture(slug), error: null }
  return supabase
    .from('torneios')
    .select('id, slug, nome, encerrado')
    .eq('slug', slug)
    .maybeSingle()
}

// Mesmo formato { data, error } do supabase-js, pros chamadores não mudarem nada.
// Ordena por rodada e depois por horário: na liga isso deixa as rodadas em ordem;
// na Copa `rodada` é null em todos os jogos, então sobra a ordem cronológica de antes.
// `data_hora` com NULLS LAST: jogo ainda sem data marcada (a CBF não definiu) cai no
// fim da rodada, em vez de encabeçá-la.
export async function carregarMatches(torneioId) {
  exigeEscopo('carregarMatches', 'torneioId', torneioId)
  if (DEV_BYPASS) return { data: matchesFixture(torneioId), error: null }
  return supabase
    .from('matches')
    .select('*')
    .eq('torneio_id', torneioId)
    .order('rodada', { ascending: true, nullsFirst: true })
    .order('data_hora', { ascending: true, nullsFirst: false })
}

// `predictions` não tem torneio_id — o vínculo é via match. O `matches!inner` faz
// join INTERNO, então o filtro por torneio_id realmente corta as linhas do palpite
// (embed sem `!inner` filtraria só o objeto aninhado e devolveria o palpite mesmo assim).
export async function carregarPalpites(userId, torneioId) {
  exigeEscopo('carregarPalpites', 'userId', userId)
  exigeEscopo('carregarPalpites', 'torneioId', torneioId)
  if (DEV_BYPASS) return { data: palpitesFixture(torneioId), error: null }
  const { data, error } = await supabase
    .from('predictions')
    .select('match_id, palpite_casa, palpite_fora, matches!inner(torneio_id)')
    .eq('user_id', userId)
    .eq('matches.torneio_id', torneioId)
  if (error) return { data: null, error }
  // Devolve o mesmo shape de antes ({match_id, palpite_casa, palpite_fora}) —
  // o join era só pra filtrar.
  return { data: (data ?? []).map(({ matches: _m, ...p }) => p), error: null }
}

// Lista de participantes (pro seletor de adversário do confronto direto).
// NÃO é escopada por torneio de propósito: `profiles` é global, as pessoas são as
// mesmas nos dois bolões. Quem separa os pontos é o get_match_points.
export async function carregarPerfis() {
  if (DEV_BYPASS) return { data: perfisFixture(), error: null }
  return supabase.from('profiles').select('id, nome').order('nome', { ascending: true })
}

// Pontos POR JOGO de um usuário — vêm da função do banco get_match_points (FONTE
// ÚNICA, mesma fórmula do get_leaderboard). NUNCA recalcular pontos no JS. Respeita
// a RLS (só jogos já iniciados/com placar). Retorna linhas:
// {match_id, fase, rodada, data_hora, palpite_casa, palpite_fora, gols_casa, gols_fora, base, peso, pontos}
export async function getMatchPoints(userId, torneioSlug) {
  exigeEscopo('getMatchPoints', 'userId', userId)
  exigeEscopo('getMatchPoints', 'torneioSlug', torneioSlug)
  if (DEV_BYPASS) return { data: matchPointsFixture(userId, torneioSlug), error: null }
  return supabase.rpc('get_match_points', { p_user: userId, p_torneio: torneioSlug })
}

// Ranking do torneio — soma do get_match_points por pessoa, feita no banco.
export async function carregarLeaderboard(torneioSlug) {
  exigeEscopo('carregarLeaderboard', 'torneioSlug', torneioSlug)
  if (DEV_BYPASS) return { data: leaderboardFixture(torneioSlug), error: null }
  return supabase.rpc('get_leaderboard', { p_torneio: torneioSlug })
}
