import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Contexto de auth — única fonte de verdade pra session/user/profile no app.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Inscrição na sessão do Supabase (inicial + mudanças).
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setUser(data.session?.user ?? null)
      // Se não há sessão, não há profile a buscar — pode liberar a tela.
      if (!data.session) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (!newSession) {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Carrega profile (nome, is_admin) sempre que o user muda.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)

    supabase
      .from('profiles')
      .select('nome, is_admin, nome_escolhido')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('[auth] falha ao carregar profile:', error)
        setProfile(data ?? null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  // Magic link. Se `nome` for passado (modo "criar conta"), vai em options.data
  // → raw_user_meta_data → o trigger handle_new_user lê de lá pra criar a linha
  // em profiles no primeiro login. Logins seguintes não precisam mandar nome.
  async function entrar(email, nome) {
    const options = { emailRedirectTo: window.location.origin }
    if (nome) options.data = { nome }
    const { error } = await supabase.auth.signInWithOtp({ email, options })
    if (error) throw error
  }

  async function sair() {
    await supabase.auth.signOut()
  }

  // Atualiza o PRÓPRIO profile (nome e/ou flag nome_escolhido) e reflete no
  // estado local — fonte única da escrita usada pelas duas features de perfil.
  // A RLS garante que só a linha do próprio usuário é afetada (auth.uid() = id).
  async function salvarPerfil(campos) {
    if (!user) throw new Error('Sem sessão.')
    const { data, error } = await supabase
      .from('profiles')
      .update(campos)
      .eq('id', user.id)
      .select('nome, is_admin, nome_escolhido')
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, entrar, sair, salvarPerfil }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
