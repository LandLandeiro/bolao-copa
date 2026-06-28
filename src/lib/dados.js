// Camada de leitura de jogos/palpites. Em produção bate no Supabase (com RLS); em
// DEV com bypass ligado, serve um fixture local (a RLS de matches exige sessão real,
// então sem isto as telas viriam vazias em dev). Ver lib/dev-auth.js.
import { supabase } from './supabase'
import { DEV_BYPASS } from './dev-auth'
import { matchesFixture, palpitesFixture } from './dev-fixtures'

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
