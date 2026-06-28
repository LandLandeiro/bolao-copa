import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { carregarMatches, carregarPalpites } from '../lib/dados'

// Banner de lembrete: jogos ABERTOS (kickoff no futuro) que o usuário ainda não
// palpitou. Só aparece se N > 0. Dispensável na sessão (estado de UI, não de
// domínio — por isso sessionStorage é ok aqui; ver CLAUDE.md regra 4).
const CHAVE_DISMISS = 'lembrete-jogos-abertos-dispensado'

export default function LembreteJogos() {
  const { user } = useAuth()
  const [n, setN] = useState(0)
  const [dispensado, setDispensado] = useState(
    () => sessionStorage.getItem(CHAVE_DISMISS) === '1',
  )

  useEffect(() => {
    if (!user || dispensado) return
    let cancelado = false
    async function calcular() {
      const [resM, resP] = await Promise.all([
        carregarMatches(),
        carregarPalpites(user.id),
      ])
      if (cancelado || resM.error || resP.error) return
      const agora = Date.now()
      const palpitados = new Set((resP.data ?? []).map((p) => p.match_id))
      // Aberto = kickoff no futuro E sem palpite desse usuário pra esse jogo.
      const abertos = (resM.data ?? []).filter(
        (m) => new Date(m.data_hora).getTime() > agora && !palpitados.has(m.id),
      )
      if (!cancelado) setN(abertos.length)
    }
    calcular()
    return () => {
      cancelado = true
    }
  }, [user, dispensado])

  function dispensar() {
    sessionStorage.setItem(CHAVE_DISMISS, '1')
    setDispensado(true)
  }

  function compartilhar() {
    const url = window.location.origin
    const texto = `🏆 Tô no bolão da Copa 2026! Dá teus palpites e vem disputar o ranking: ${url}`
    if (navigator.share) {
      navigator.share({ title: 'Bolão da Copa 2026', text: texto, url }).catch(() => {})
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
    }
  }

  if (dispensado || n === 0) return null

  return (
    <div className="bg-verde text-cloud">
      <div className="max-w-[880px] mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        {/* No mobile: texto + ✕ na 1ª linha. No desktop: viram itens da mesma linha
            (display:contents) e o ✕ vai pro fim. */}
        <div className="flex items-center gap-2 sm:contents">
          <span className="flex-1 min-w-0 text-sm font-semibold">
            ⚽ Você tem <span className="tnum">{n}</span>{' '}
            {n === 1 ? 'jogo aberto' : 'jogos abertos'} sem palpite
          </span>
          <button
            type="button"
            onClick={dispensar}
            aria-label="Dispensar lembrete"
            className="shrink-0 sm:order-last w-9 h-9 inline-flex items-center justify-center rounded-md text-cloud/90 hover:bg-cloud/10 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Botões: lado a lado e ocupando a largura no mobile; tamanho natural no desktop. */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/"
            className="flex-1 sm:flex-none justify-center px-3 h-9 inline-flex items-center rounded-md bg-cloud text-verde text-sm font-bold shadow-hard hover:bg-paper transition-colors whitespace-nowrap"
          >
            Palpitar agora
          </Link>
          <button
            type="button"
            onClick={compartilhar}
            className="flex-1 sm:flex-none justify-center px-3 h-9 inline-flex items-center gap-1.5 rounded-md border border-cloud/70 text-cloud text-sm font-semibold hover:bg-cloud/10 transition-colors whitespace-nowrap"
          >
            <ZapIcon /> Chamar a galera
          </button>
        </div>
      </div>
    </div>
  )
}

function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 00-8.5 15.3L2 22l4.8-1.5A10 10 0 1012 2zm0 2a8 8 0 11-4.1 14.9l-.3-.2-2.8.9.9-2.7-.2-.3A8 8 0 0112 4zm-2.2 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1 0 1.3.9 2.5 1 2.6.1.2 1.8 2.9 4.5 3.9 2.2.9 2.7.7 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.6-.3-.3-.2-1.5-.8-1.7-.9-.2-.1-.4-.1-.6.1-.2.3-.6.9-.8 1.1-.1.1-.3.2-.5.1-.3-.1-1.1-.4-2-1.2-.7-.6-1.2-1.4-1.4-1.7-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.3 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.2z"/>
    </svg>
  )
}
