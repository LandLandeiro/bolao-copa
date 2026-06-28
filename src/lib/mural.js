// Mural / zoeira — leitura e escrita. Segurança é da RLS da tabela `mural`:
//   select: qualquer logado · insert/delete: só do próprio (auth.uid() = user_id).
// O nome do autor NÃO vem por embed do PostgREST (não há FK mural.user_id→profiles),
// então fazemos o join de `nome` no cliente (2 queries). Em DEV (bypass) usa um
// store em memória — ver lib/dev-auth.js.
import { supabase } from './supabase'
import { DEV_BYPASS, fakeUser, fakeProfile } from './dev-auth'

const LIMITE = 100

// ---- Store em memória pro DEV (não vai pra produção: DEV_BYPASS é false) ----
let devMural = null
function devSeed() {
  if (devMural) return devMural
  const now = Date.now()
  devMural = [
    { id: 1003, user_id: 'dev-amiga-1', texto: 'Bora Brasil! 🇧🇷 hexa vem aí', created_at: new Date(now - 5 * 60000).toISOString(), nome: 'Ana' },
    { id: 1002, user_id: 'dev-amigo-2', texto: 'quem cravar o jogo de hoje paga a próxima rodada de breja 🍻', created_at: new Date(now - 2 * 3600000).toISOString(), nome: 'Bruno' },
    { id: 1001, user_id: fakeUser.id, texto: 'testando o mural 👀', created_at: new Date(now - 26 * 3600000).toISOString(), nome: fakeProfile.nome },
  ]
  return devMural
}
const ordenar = (rows) =>
  rows.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

// Lista os recados (mais novos primeiro) já com `nome` do autor.
export async function carregarMural() {
  if (DEV_BYPASS) return { data: ordenar(devSeed()), error: null }

  const { data, error } = await supabase
    .from('mural')
    .select('id, user_id, texto, created_at')
    .order('created_at', { ascending: false })
    .limit(LIMITE)
  if (error) return { data: null, error }

  const ids = [...new Set((data ?? []).map((r) => r.user_id))]
  let nomePorId = {}
  if (ids.length) {
    const { data: perfis, error: e2 } = await supabase
      .from('profiles')
      .select('id, nome')
      .in('id', ids)
    if (e2) return { data: null, error: e2 }
    nomePorId = Object.fromEntries((perfis ?? []).map((p) => [p.id, p.nome]))
  }
  return { data: (data ?? []).map((r) => ({ ...r, nome: nomePorId[r.user_id] ?? null })), error: null }
}

// Posta um recado. user_id tem que ser o do próprio (a RLS recusa qualquer outro).
export async function postarMural({ userId, texto, nome }) {
  if (DEV_BYPASS) {
    const row = { id: Date.now(), user_id: userId, texto, created_at: new Date().toISOString(), nome: nome ?? fakeProfile.nome }
    devSeed().unshift(row)
    return { data: row, error: null }
  }
  const { data, error } = await supabase
    .from('mural')
    .insert({ user_id: userId, texto })
    .select('id, user_id, texto, created_at')
    .single()
  if (error) return { data: null, error }
  return { data: { ...data, nome: nome ?? null }, error: null }
}

// Apaga um recado próprio (a RLS garante que só a própria linha some).
export async function apagarMural(id) {
  if (DEV_BYPASS) {
    devMural = devSeed().filter((r) => r.id !== id)
    return { error: null }
  }
  return supabase.from('mural').delete().eq('id', id)
}
