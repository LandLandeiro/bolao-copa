// Admin > Usuários: renomear qualquer participante. A RLS de admin permite o
// UPDATE de profiles.nome de qualquer um (usuário comum só o próprio).
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { validarNome, NOME_MAX } from '../lib/nome'

export default function AdminUsuarios() {
  const [perfis, setPerfis] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      setCarregando(true)
      setErro(null)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, is_admin')
        .order('nome', { ascending: true })
      if (cancelado) return
      if (error) {
        setErro(error.message)
        setCarregando(false)
        return
      }
      setPerfis(data ?? [])
      setCarregando(false)
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <main className="max-w-[880px] mx-auto px-4 py-8 sm:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight">USUÁRIOS</h1>
        <p className="mt-1 text-slate text-sm">
          Renomeie qualquer participante. A permissão é da RLS de admin.
        </p>
      </header>

      {carregando ? (
        <p className="text-slate text-sm">carregando…</p>
      ) : erro ? (
        <p className="text-vermelho text-sm">Não consegui carregar: {erro}</p>
      ) : (
        <ul className="space-y-3">
          {perfis.map((p) => (
            <LinhaUsuario key={p.id} perfil={p} />
          ))}
        </ul>
      )}
    </main>
  )
}

function LinhaUsuario({ perfil }) {
  const [nome, setNome] = useState(perfil.nome ?? '')
  const [erro, setErro] = useState(null)
  const [okMsg, setOkMsg] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const mudou = nome !== (perfil.nome ?? '')
  const idErro = `usuario-erro-${perfil.id}`

  async function salvar(e) {
    e.preventDefault()
    const { ok, nome: limpo, erro: msg } = validarNome(nome) // mesma validação do app
    if (!ok) {
      setErro(msg)
      setOkMsg(null)
      return
    }
    setErro(null)
    setOkMsg(null)
    setSalvando(true)
    // NUNCA enviar is_admin — só o nome. O banco rejeita is_admin de propósito.
    const { error } = await supabase
      .from('profiles')
      .update({ nome: limpo })
      .eq('id', perfil.id)
    setSalvando(false)
    if (error) {
      setErro(error.message)
      return
    }
    setNome(limpo)
    setOkMsg('salvo!')
    setTimeout(() => setOkMsg(null), 1600)
  }

  return (
    <li className="bg-cloud rounded-lg border border-line shadow-soft p-4">
      <form onSubmit={salvar} className="flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <label
            htmlFor={`usuario-${perfil.id}`}
            className="flex items-center text-xs font-semibold text-slate mb-1"
          >
            Nome
            {perfil.is_admin && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-pill bg-ink text-paper text-[10px] font-bold uppercase tracking-wider">
                admin
              </span>
            )}
          </label>
          <input
            id={`usuario-${perfil.id}`}
            type="text"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value)
              setErro(null)
              setOkMsg(null)
            }}
            maxLength={NOME_MAX}
            disabled={salvando}
            aria-invalid={erro ? 'true' : undefined}
            aria-describedby={erro ? idErro : undefined}
            className="w-full h-11 px-3 rounded-md border border-line bg-paper text-ink focus:outline-none focus:border-verde focus:ring-2 focus:ring-verde/30 disabled:bg-line"
          />
        </div>
        <button
          type="submit"
          disabled={salvando || !mudou}
          className="h-11 px-4 rounded-md bg-verde hover:bg-verde-dark text-cloud font-semibold shadow-hard transition-colors disabled:bg-line disabled:text-slate disabled:shadow-none disabled:cursor-not-allowed"
        >
          {salvando ? 'salvando…' : 'salvar'}
        </button>
      </form>
      {erro && (
        <p id={idErro} className="mt-2 text-sm text-vermelho">
          {erro}
        </p>
      )}
      {okMsg && <p className="mt-2 text-sm text-verde">{okMsg}</p>}
    </li>
  )
}
