import { useState } from 'react'
import { validarNome, NOME_MAX } from '../lib/nome'

// Campo de nome reutilizável: editar nick (Perfil) e escolher no 1º login.
// Encapsula a validação (trim, 3–30) e os estados de salvar/erro/ok — pra
// nenhuma das duas features duplicar essa lógica. `onSalvar(nomeLimpo)` é async
// e deve persistir (a UI de erro mostra o que ele lançar).
export default function NomeForm({
  valorInicial = '',
  onSalvar,
  textoBotao = 'salvar',
  textoSalvando = 'salvando…',
  textoOk = null,
  autoFocus = false,
  idCampo = 'nome',
}) {
  const [nome, setNome] = useState(valorInicial)
  const [erro, setErro] = useState(null)
  const [okMsg, setOkMsg] = useState(null)
  const [salvando, setSalvando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    const { ok, nome: limpo, erro: msg } = validarNome(nome)
    if (!ok) {
      setErro(msg)
      setOkMsg(null)
      return
    }
    setErro(null)
    setOkMsg(null)
    setSalvando(true)
    try {
      await onSalvar(limpo)
      if (textoOk) setOkMsg(textoOk)
    } catch (err) {
      setErro(err?.message ?? 'Não consegui salvar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  const idErro = `${idCampo}-erro`

  return (
    <form onSubmit={enviar} className="space-y-3" noValidate>
      <div>
        <label htmlFor={idCampo} className="block text-sm font-semibold mb-1">
          Seu nome no bolão
        </label>
        <input
          id={idCampo}
          type="text"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            setErro(null)
            setOkMsg(null)
          }}
          maxLength={NOME_MAX}
          autoComplete="name"
          autoFocus={autoFocus}
          disabled={salvando}
          aria-invalid={erro ? 'true' : undefined}
          aria-describedby={erro ? idErro : undefined}
          className="w-full h-12 px-3 rounded-md border border-line bg-paper text-ink focus:outline-none focus:border-verde focus:ring-2 focus:ring-verde/30 disabled:bg-line disabled:text-slate disabled:cursor-not-allowed"
        />
        {erro && (
          <p id={idErro} className="mt-1 text-sm text-vermelho">
            {erro}
          </p>
        )}
        {okMsg && <p className="mt-1 text-sm text-verde">{okMsg}</p>}
      </div>

      <button
        type="submit"
        disabled={salvando}
        className="w-full h-12 rounded-md bg-verde hover:bg-verde-dark text-cloud font-semibold shadow-hard transition-colors disabled:bg-line disabled:text-slate disabled:shadow-none disabled:cursor-not-allowed"
      >
        {salvando ? textoSalvando : textoBotao}
      </button>
    </form>
  )
}
