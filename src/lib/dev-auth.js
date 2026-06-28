// ⚠️⚠️ BYPASS DE AUTENTICAÇÃO — SOMENTE DESENVOLVIMENTO. NUNCA vale em produção. ⚠️⚠️
//
// Pra que serve: em dev o app prende na tela de login (e a RLS de `matches` exige
// sessão de verdade, então nem com login fake o banco devolveria jogos). Este flag
// injeta uma sessão/usuário fake pra pular o guard de rota E faz a camada de dados
// (lib/dados.js) servir um fixture local — assim dá pra ver as telas sem login.
//
// DUPLA TRAVA — só liga quando AS DUAS forem verdadeiras:
//   1) import.meta.env.DEV  → true só em `vite dev`. Em build de produção é false,
//      então este ramo é eliminado pelo bundler (dead-code). Impossível vazar.
//   2) VITE_DEV_BYPASS_AUTH === 'true'  → opt-in explícito no .env.local
//      (que está no .gitignore — não vai pro repo).
//
// Pra ativar localmente, ponha no .env.local na raiz:
//   VITE_DEV_BYPASS_AUTH=true
export const DEV_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true'

// Identidade falsa só pra destravar o guard e a UI. is_admin=true pra também poder
// abrir a área /admin em dev. Nada disto autentica no Supabase.
export const fakeUser = {
  id: '00000000-0000-0000-0000-00000000dev0',
  email: 'dev@local.test',
}

export const fakeSession = {
  user: fakeUser,
  access_token: 'dev-bypass',
  token_type: 'bearer',
}

export const fakeProfile = {
  nome: 'Dev',
  is_admin: true,
  nome_escolhido: true, // pula o gate de "escolher nome" do 1º login
}
