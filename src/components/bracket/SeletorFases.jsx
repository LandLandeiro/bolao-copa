import { useRef } from 'react'
import { FASES_MATA } from '../../lib/bracket'

// Seletor de fases (inspirado no Apple Sports) — SPEC §4.
// Trilha de 5 fases (sem grupos). Uma janela contígua redimensionável seleciona o
// intervalo de rodadas: alça ‹ move o início, › move o fim, corpo arrasta o conjunto;
// tocar numa fase foca nela (janela de 1 rodada). Snap SEMPRE por fase (discreto).
// Gestos com Pointer Events nativos (touch + mouse), zero dependência.
const N = FASES_MATA.length // 5

export default function SeletorFases({ janela, onChange }) {
  const trilhaRef = useRef(null)
  const drag = useRef(null)

  // Índice de fase (0..4) sob o ponteiro.
  function idxFromX(clientX) {
    const r = trilhaRef.current.getBoundingClientRect()
    const i = Math.floor((clientX - r.left) / (r.width / N))
    return Math.max(0, Math.min(N - 1, i))
  }

  function startDrag(mode, e) {
    e.preventDefault()
    e.stopPropagation()
    drag.current = { mode, startIdx: idxFromX(e.clientX), start: { ...janela }, moved: false }
    trilhaRef.current.setPointerCapture(e.pointerId)
  }

  function onMove(e) {
    const d = drag.current
    if (!d) return
    const i = idxFromX(e.clientX)
    if (i !== d.startIdx) d.moved = true
    if (d.mode === 'left') {
      onChange({ inicio: Math.min(i, janela.fim), fim: janela.fim })
    } else if (d.mode === 'right') {
      onChange({ inicio: janela.inicio, fim: Math.max(i, janela.inicio) })
    } else if (d.mode === 'body') {
      const len = d.start.fim - d.start.inicio
      let ni = d.start.inicio + (i - d.startIdx)
      ni = Math.max(0, Math.min(N - 1 - len, ni))
      onChange({ inicio: ni, fim: ni + len })
    }
  }

  function onUp(e) {
    const d = drag.current
    if (!d) return
    // Toque sem arraste no corpo = focar a fase tocada (janela de 1 rodada).
    if (d.mode === 'body' && !d.moved) {
      const i = idxFromX(e.clientX)
      onChange({ inicio: i, fim: i })
    }
    drag.current = null
    try {
      trilhaRef.current.releasePointerCapture(e.pointerId)
    } catch {
      /* capture já solto */
    }
  }

  const { inicio, fim } = janela
  const left = (inicio / N) * 100
  const width = ((fim - inicio + 1) / N) * 100
  const rangeTxt =
    inicio === fim
      ? FASES_MATA[inicio].col
      : `${FASES_MATA[inicio].col} → ${FASES_MATA[fim].col}`

  return (
    <section className="select-none">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[11px] font-black uppercase tracking-[0.06em] text-chave-label">Fases</span>
        <span className="text-[11px] font-extrabold text-chave-sec">{rangeTxt}</span>
      </div>

      <div
        ref={trilhaRef}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="relative rounded-[14px] bg-chave-surface border border-chave-borda p-1 touch-none"
      >
        {/* Segmentos de fundo (tap-to-focus) */}
        <div className="grid grid-cols-5">
          {FASES_MATA.map((f, i) => {
            const ativa = i >= inicio && i <= fim
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange({ inicio: i, fim: i })}
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-1"
                aria-label={`focar ${f.col}`}
              >
                <Densidade barras={f.barras} ativa={ativa} />
                <span className={`text-[11px] font-extrabold leading-none ${ativa ? 'text-chave-ink' : 'text-chave-label'}`}>
                  <span className="hidden sm:inline">{f.col}</span>
                  <span className="sm:hidden">{f.curto}</span>
                </span>
              </button>
            )
          })}
        </div>

        {/* Janela arrastável por cima */}
        <div
          onPointerDown={(e) => startDrag('body', e)}
          style={{ left: `${left}%`, width: `${width}%` }}
          className="absolute top-1 bottom-1 rounded-[12px] border-2 border-chave-ink bg-chave-verde/12 cursor-grab active:cursor-grabbing"
        >
          <Alca lado="left" onPointerDown={(e) => startDrag('left', e)} />
          <Alca lado="right" onPointerDown={(e) => startDrag('right', e)} />
        </div>
      </div>

      <p className="mt-1.5 text-[11px] text-chave-label text-center sm:hidden">
        Arraste ‹ › para abrir mais rodadas · toque numa fase para focar
      </p>
    </section>
  )
}

// Ícone de densidade: `barras` linhas horizontais empilhadas (5 → 1).
function Densidade({ barras, ativa }) {
  const cor = ativa ? 'bg-chave-verde' : 'bg-chave-label/50'
  return (
    <span className="flex flex-col items-center gap-[2px] h-4 justify-center" aria-hidden="true">
      {Array.from({ length: barras }, (_, i) => (
        <span key={i} className={`h-[2px] w-3.5 rounded-pill ${cor}`} />
      ))}
    </span>
  )
}

// Alça ‹ / › nas pontas da janela — alvo grande pro dedo (touch-first).
function Alca({ lado, onPointerDown }) {
  const pos = lado === 'left' ? '-left-3' : '-right-3'
  const seta = lado === 'left' ? '‹' : '›'
  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      aria-label={lado === 'left' ? 'mover início' : 'mover fim'}
      className={`absolute top-1/2 -translate-y-1/2 ${pos} w-7 h-9 rounded-[9px] bg-chave-ink text-white flex items-center justify-center text-lg font-black leading-none shadow-[0_2px_4px_rgba(20,18,12,0.2)] cursor-ew-resize touch-none`}
    >
      {seta}
    </button>
  )
}
