// Camada de leitura de jogos/palpites. Em produção bate no Supabase (com RLS); em
// DEV com bypass ligado, serve um fixture local (a RLS de matches exige sessão real,
// então sem isto as telas viriam vazias em dev). Ver lib/dev-auth.js.
import { supabase } from './supabase'
import { DEV_BYPASS } from './dev-auth'
import { matchesFixture, palpitesFixture, perfisFixture, matchPointsFixture } from './dev-fixtures'

// Mesmo formato { data, error } do supabase-js, pros chamadores não mudarem nada.
export async function carregarMatches() {
  if (DEV_BYPASS) return { data: matchesFixture(), error: null }
  return supabase.from('matches').select('*').order('data_hora', { ascending: true })
}

export async function carregarPalpites(userId) {
  if (DEV_BYPASS) return { data: palpitesFixture(), error: null }
  return supabase
    .from('predictions')
    .select('match_id, palpite_casa, palpite_fora')
    .eq('user_id', userId)
}

// Lista de participantes (pro seletor de adversário do confronto direto).
export async function carregarPerfis() {
  if (DEV_BYPASS) return { data: perfisFixture(), error: null }
  return supabase.from('profiles').select('id, nome').order('nome', { ascending: true })
}

// Pontos POR JOGO de um usuário — vêm da função do banco get_match_points (FONTE
// ÚNICA, mesma fórmula do get_leaderboard). NUNCA recalcular pontos no JS. Respeita
// a RLS (só jogos já iniciados/com placar). Retorna linhas:
// {match_id, fase, data_hora, palpite_casa, palpite_fora, gols_casa, gols_fora, base, peso, pontos}
export async function getMatchPoints(userId) {
  if (DEV_BYPASS) return { data: matchPointsFixture(userId), error: null }
  return supabase.rpc('get_match_points', { p_user: userId })
}
