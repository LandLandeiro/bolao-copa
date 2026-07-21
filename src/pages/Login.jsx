import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Arte do login. Constante e não skin — ver o comentário no <main> lá embaixo.
const HERO_LOGIN = '/login-hero-brasileirao.webp'

export default function Login() {
  const { session, loading, entrar } = useAuth()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [modoCriar, setModoCriar] = useState(false)
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
      // Em modo "criar conta", manda o nome pro trigger criar o profile.
      // Em modo "entrar", manda só o email — o trigger ignora ausência com segurança.
      const nomeLimpo = modoCriar ? nome.trim() : ''
      await entrar(email.trim(), nomeLimpo || undefined)
      setEnviado(true)
    } catch (err) {
      setErro(err?.message ?? 'Não consegui enviar o link. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  function alternarModo() {
    setModoCriar((v) => !v)
    setErro(null)
    // Limpa o nome ao recolher pra não enviar valor "fantasma" depois.
    if (modoCriar) setNome('')
  }

  const inputClass =
    'w-full h-12 px-3 rounded-md border border-line bg-paper text-ink ' +
    'focus:outline-none focus:border-verde focus:ring-2 focus:ring-verde/30'

  return (
    // Tela inteira: arte de fundo cobrindo tudo, com scrim escuro por cima.
    // O cartão branco flutua centralizado — sem dois blocos empilhados.
    //
    // ⚠️ ARTE FIXA DO BRASILEIRÃO, e isso NÃO é esquecimento: o login acontece
    // ANTES de existir torneio (sem sessão, sem rota de torneio, sem contexto), então
    // não há slug pra consultar — usar o skin aqui quebraria. A escolha é o torneio
    // ATIVO. Quando o Brasileirão virar arquivo e outro torneio assumir, troque a
    // constante abaixo na mão.
    //
    // O scrim aqui é ESTÉTICO, não de leitura: todo o texto desta tela vive dentro
    // do cartão branco, sobre fundo branco. Por isso 55% basta — diferente da faixa
    // do Ranking, onde o texto fica direto sobre a arte e precisa de 70% (ver
    // lib/skin.js). Se um dia entrar texto solto por cima da arte aqui, refaça a
    // conta antes de confiar neste número.
    //
    // `bg-ink` embaixo é o fallback: sumindo o arquivo, sobra o bloco escuro e a
    // tela segue usável (background-image não deixa ícone de imagem quebrada).
    <main
      className="relative min-h-screen bg-ink bg-cover bg-center flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundImage: `url(${HERO_LOGIN})` }}
    >
      <div
        className="absolute inset-0 bg-ink/55"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[420px] bg-cloud rounded-xl shadow-hard p-8 sm:p-10 animate-fade-up">
        {enviado ? (
          <div className="text-center">
            <img
              src="/logo-bolao.png"
              alt=""
              className="w-16 h-16 mx-auto"
            />
            <h2 className="mt-4 font-display text-3xl sm:text-4xl tracking-tight">
              VERIFIQUE SEU E-MAIL
            </h2>
            <p className="mt-3 text-slate text-sm">
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
                setModoCriar(false)
              }}
              className="mt-5 text-sm font-semibold text-verde hover:text-verde-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-verde/40 rounded-sm px-1"
            >
              usar outro e-mail
            </button>
          </div>
        ) : (
          <>
            <header className="text-center">
              <img
                src="/logo-bolao.png"
                alt=""
                className="w-20 h-20 mx-auto"
              />
              <p className="mt-3 text-xs uppercase tracking-widest text-slate font-semibold">
                Bolão da Copa 2026
              </p>
              <h1 className="font-display text-4xl sm:text-5xl mt-1 tracking-tight text-ink">
                VAMOS PRA CIMA
              </h1>
              <p className="mt-2 text-sm text-slate">
                Palpite nos jogos, brigue pelo topo do ranking.
              </p>
            </header>

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-4"
              noValidate
            >
              {/* Campo de nome só aparece no modo "criar conta". */}
              {modoCriar && (
                <div className="animate-fade-up">
                  <label
                    htmlFor="nome"
                    className="block text-sm font-semibold mb-1"
                  >
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
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold mb-1"
                >
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
                {enviando
                  ? 'enviando…'
                  : modoCriar
                  ? 'criar conta'
                  : 'entrar'}
              </button>

              <p className="text-xs text-slate text-center leading-relaxed">
                Sem senha. A gente te manda um link por e-mail. Você só
                precisa fazer isso na primeira vez ou em um aparelho novo —
                depois a sessão fica salva.
              </p>
            </form>

            {/* Toggle entre "só entrar" e "criar conta". */}
            <div className="mt-5 pt-5 border-t border-line text-center">
              <button
                type="button"
                onClick={alternarModo}
                className="text-sm text-slate hover:text-ink font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-verde/40 rounded-sm px-1"
              >
                {modoCriar ? (
                  <>
                    já tenho conta —{' '}
                    <span className="text-verde">só entrar</span>
                  </>
                ) : (
                  <>
                    primeira vez?{' '}
                    <span className="text-verde">criar conta</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
