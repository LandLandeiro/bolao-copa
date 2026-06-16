// Gate do 1º login: enquanto profiles.nome_escolhido === false, este modal
// BLOQUEANTE cobre o app — sem X, sem Esc, sem clicar fora. Só libera quando o
// usuário confirma o nome (que grava { nome, nome_escolhido: true } via RLS).
import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import NomeForm from './NomeForm'

export default function EscolherNome() {
  const { profile, salvarPerfil } = useAuth()
  const dialogRef = useRef(null)

  // A11y: prende o foco no modal (Tab cicla) e trava o scroll do fundo.
  // Sem atalho de fechar — é bloqueante de propósito.
  useEffect(() => {
    const node = dialogRef.current
    function onKey(e) {
      if (e.key !== 'Tab' || !node) return
      const foco = node.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (foco.length === 0) return
      const primeiro = foco[0]
      const ultimo = foco[foco.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primeiro.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink/70" aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="escolher-nome-titulo"
        aria-describedby="escolher-nome-desc"
        className="relative w-full sm:max-w-[420px] bg-cloud rounded-t-xl sm:rounded-xl shadow-hard p-6 sm:p-8 animate-fade-up"
      >
        <h2
          id="escolher-nome-titulo"
          className="font-display text-3xl sm:text-4xl tracking-tight text-ink"
        >
          ESCOLHA SEU NOME
        </h2>
        <p id="escolher-nome-desc" className="mt-2 mb-5 text-sm text-slate">
          É como você vai aparecer no ranking pra galera. Dá pra mudar depois em
          Perfil.
        </p>

        <NomeForm
          idCampo="nome-escolha"
          valorInicial={profile?.nome ?? ''}
          autoFocus
          textoBotao="começar a palpitar"
          onSalvar={(nome) => salvarPerfil({ nome, nome_escolhido: true })}
        />
      </div>
    </div>
  )
}
