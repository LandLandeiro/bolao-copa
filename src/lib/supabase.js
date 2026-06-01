import { createClient } from '@supabase/supabase-js'

// Variáveis públicas do Supabase — vêm do .env (ver .env.example).
// A anon key é PÚBLICA de propósito; a segurança é por RLS, não por esconder a chave.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Erro claro no console pra não passar despercebido em dev.
  console.error(
    '[supabase] VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não definidas. ' +
      'Copie .env.example para .env e preencha com os valores do seu projeto Supabase.',
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')
