import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { session, loading, entrar } = useAuth()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState(null)

  // Evita flash do form antes do AuthContext resolver a sessão inicial.
  if (loading) return null
  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await entrar(email.trim(), nome.trim())
      setEnviado(true)
    } catch (err) {
      setErro(err?.message ?? 'Não consegui enviar o link. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  const inputClass =
    'w-full h-12 px-3 rounded-md border border-line bg-paper text-ink ' +
    'focus:outline-none focus:border-verde focus:ring-2 focus:ring-verde/30'

  return (
    <main className="min-h-screen">
      {/*
        Hero com a arte de gradiente da Copa como fundo.
        Regra do DESIGN.md §5: texto importante SEMPRE em bloco sólido por cima.
      */}
      <section
        className="relative py-16 px-4 flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: 'url(/login-hero.jpg)' }}
      >
        <div className="relative bg-ink text-paper rounded-xl p-8 max-w-md w-full text-center shadow-hard">
          <p className="text-xs uppercase tracking-widest text-amarelo font-semibold">
            Bolão da Copa 2026
          </p>
          <h1 className="font-display text-5xl mt-2 tracking-tight">
            VAMOS PRA CIMA
          </h1>
          <p className="mt-3 text-sm text-line">
            Palpite nos jogos, brigue pelo topo do ranking.
          </p>
        </div>
      </section>

      <section className="max-w-md mx-auto px-4 -mt-10 pb-16">
        <div className="bg-cloud rounded-lg border border-line shadow-soft p-6 animate-fade-up">
          {enviado ? (
            <div className="text-center py-4">
              <h2 className="font-display text-3xl tracking-tight">
                VERIFIQUE SEU E-MAIL
              </h2>
              <p className="mt-3 text-slate">
                Mandamos um link de acesso pra{' '}
                <strong className="text-ink">{email}</strong>. Abra no mesmo
                navegador.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEnviado(false)
                  setEmail('')
                  setNome('')
                }}
                className="mt-4 text-sm font-semibold text-verde hover:text-verde-dark"
              >
                usar outro e-mail
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="nome" className="block text-sm font-semibold mb-1">
                  Seu nome
                </label>
                <input
                  id="nome"
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={inputClass}
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-1">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              {erro && <p className="text-sm text-vermelho">{erro}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="w-full h-12 rounded-md bg-verde hover:bg-verde-dark text-cloud font-semibold shadow-hard transition-colors disabled:bg-line disabled:text-slate disabled:shadow-none disabled:cursor-not-allowed"
              >
                {enviando ? 'enviando…' : 'enviar link de acesso'}
              </button>

              <p className="text-xs text-slate text-center">
                Sem senha. A gente só te manda um link por e-mail.
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
