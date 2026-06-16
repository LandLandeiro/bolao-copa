// Dialog de confirmação reutilizável (a11y: foco preso, Esc cancela, labels).
// Usado pelo Admin pra (1) avisar ao abrir palpite de outra pessoa e (2)
// confirmar antes de gravar um placar (que recalcula a pontuação de todos).
import { useEffect, useRef } from 'react'

export default function ConfirmDialog({
  titulo,
  mensagem,
  textoConfirmar = 'Continuar',
  textoCancelar = 'Cancelar',
  perigo = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null)
  const confirmarRef = useRef(null)

  useEffect(() => {
    const anterior = document.activeElement
    const node = dialogRef.current
    // Foco inicial no botão de confirmar.
    confirmarRef.current?.focus()

    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCancel()
        return
      }
      if (e.key === 'Tab' && node) {
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
    }
    document.addEventListener('keydown', onKey, true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = ''
      if (anterior instanceof HTMLElement) anterior.focus()
    }
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink/60" onClick={onCancel} aria-hidden="true" />

      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        aria-describedby="confirm-msg"
        className="relative w-full sm:max-w-[420px] bg-cloud rounded-t-xl sm:rounded-xl shadow-hard p-6 animate-fade-up"
      >
        <h2
          id="confirm-titulo"
          className="font-display text-2xl sm:text-3xl tracking-tight text-ink"
        >
          {titulo}
        </h2>
        <p id="confirm-msg" className="mt-2 text-sm text-slate">
          {mensagem}
        </p>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 px-4 rounded-md border border-line bg-cloud text-ink font-semibold hover:bg-paper transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-verde"
          >
            {textoCancelar}
          </button>
          <button
            ref={confirmarRef}
            type="button"
            onClick={onConfirm}
            className={`h-11 px-4 rounded-md text-cloud font-semibold shadow-hard transition-colors focus:outline-none focus-visible:ring-2 ${
              perigo
                ? 'bg-vermelho hover:bg-vinho focus-visible:ring-vermelho/40'
                : 'bg-verde hover:bg-verde-dark focus-visible:ring-verde/40'
            }`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
