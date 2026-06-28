// Escrita de palpite — CAMINHO ÚNICO usado pela Lista (MatchCard) e pelo
// Chaveamento (CardChave). Não duplicar o upsert: quem precisa salvar chama daqui.
// A trava de horário é da RLS (fonte da verdade): se o jogo já começou, o Postgres
// recusa e devolvemos ehTrava=true pra UI fazer rollback e avisar.
import { supabase } from './supabase'
import { DEV_BYPASS } from './dev-auth'

// Normaliza input do placar: só dígitos, máx. 2 (0–99). Igual ao da Lista.
export function sanitizarPlacar(valor) {
  return valor.replace(/\D/g, '').slice(0, 2)
}

// Salva (insert/update) o palpite do usuário. Retorna { error, ehTrava }.
// Em DEV com bypass simula sucesso (a RLS bloquearia a anon key — ver dev-auth.js).
export async function salvarPalpite({ userId, matchId, palpiteCasa, palpiteFora }) {
  if (DEV_BYPASS) return { error: null, ehTrava: false }

  const { error } = await supabase.from('predictions').upsert(
    {
      user_id: userId,
      match_id: matchId,
      palpite_casa: palpiteCasa,
      palpite_fora: palpiteFora,
    },
    { onConflict: 'user_id,match_id' },
  )

  if (!error) return { error: null, ehTrava: false }

  // RLS recusa quando o jogo já começou (ou sem permissão).
  const ehTrava =
    error.code === '42501' ||
    error.code === 'PGRST301' ||
    (error.message || '').toLowerCase().includes('policy') ||
    (error.message || '').toLowerCase().includes('permission')
  return { error, ehTrava }
}
