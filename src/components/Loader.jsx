import { useEffect, useId, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// ANTI-FLASH — vale pros dois torneios (o loader do Brasileirão herda igual).
//
// Metade da regra é CSS (.blr-surge no index.css): a entrada atrasa 300ms, então
// carregamento rápido nunca chega a mostrar spinner.
//
// A outra metade é este hook, porque CSS não alcança: uma vez que o loader APARECEU,
// ele tem que ficar no mínimo 400ms — senão o spinner surge e some no mesmo piscar,
// que incomoda mais do que não ter spinner nenhum. Quem desmonta o loader é o
// componente pai, então é o pai que precisa segurar o booleano.
//
// Devolve UM booleano: "ainda estou em carregamento, do ponto de vista da tela".
// Ele é true assim que `carregando` fica true (não espera os 300ms) e continua true
// depois que `carregando` já virou false, até fechar o tempo mínimo em tela.
//
// Por que não esperar os 300ms aqui: o loader precisa estar MONTADO desde o começo,
// senão a tela cairia no conteúdo vazio nesse meio tempo — lista "sem jogos", ou um
// guard de rota chutando pro login antes de saber se há sessão. Quem some nos
// primeiros 300ms é o CSS (.blr-surge), com o elemento montado e invisível.
//
// Uso — troca só a variável, o resto do componente fica igual:
//   const carregandoSuave = useCarregamentoSuave(carregando)
//   if (carregandoSuave) return <LoaderTorneio />
export const ATRASO_MS = 300 // espelha o delay do .blr-surge no index.css
export const MINIMO_MS = 400

export function useCarregamentoSuave(carregando) {
  const [suave, setSuave] = useState(carregando)
  const inicioRef = useRef(carregando ? Date.now() : null)

  useEffect(() => {
    if (carregando) {
      inicioRef.current = Date.now()
      setSuave(true)
      return
    }

    const inicio = inicioRef.current
    inicioRef.current = null
    // Nunca começou a carregar, ou terminou antes de o spinner aparecer: solta já.
    if (inicio == null || Date.now() - inicio < ATRASO_MS) {
      setSuave(false)
      return
    }
    // Já apareceu — segura o que faltar pro tempo mínimo em tela.
    const restante = ATRASO_MS + MINIMO_MS - (Date.now() - inicio)
    if (restante <= 0) {
      setSuave(false)
      return
    }
    const t = setTimeout(() => setSuave(false), restante)
    return () => clearTimeout(t)
  }, [carregando])

  // `|| suave` cobre o rabo do tempo mínimo, quando `carregando` já virou false.
  return carregando || suave
}

// Spinner oficial de carregamento (reconstrução INLINE de animation/bolao-spinner.svg).
// - Giro ~1.8s/volta, linear, loop perfeito; respeita prefers-reduced-motion.
// - Os @keyframes + o @media de reduced-motion vivem no index.css (classe .blr-spin),
//   uma única vez; a duração de cada instância vem da CSS var --blr-speed.
// - O id do gradiente é ÚNICO por instância (useId) pra não colidir quando há mais
//   de um Loader na mesma tela. A classe .blr-spin pode ser compartilhada (mesma
//   animação; só a velocidade varia, e essa é por instância via a var).
//
// Props:
//   size  – número (px) ou string CSS (default 64). Controla width/height.
//   speed – duração da volta (default '1.8s').
//   className – pra centralizar/posicionar pelo pai (fundo transparente, sem margem).
export default function Loader({ size = 64, speed = '1.8s', className = '' }) {
  const uid = useId().replace(/:/g, '')
  const grad = `blr-rb-${uid}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label="Carregando"
      className={`block blr-surge ${className}`}
    >
      <defs>
        <radialGradient id={grad} cx="50%" cy="50%" r="52%">
          <stop offset="0%" stopColor="#E0322A" />
          <stop offset="20%" stopColor="#EE5524" />
          <stop offset="38%" stopColor="#F39200" />
          <stop offset="52%" stopColor="#F4C81E" />
          <stop offset="68%" stopColor="#7FB539" />
          <stop offset="84%" stopColor="#2E9E4B" />
          <stop offset="100%" stopColor="#1C8A86" />
        </radialGradient>
      </defs>

      <g className="blr-spin" style={{ '--blr-speed': speed }}>
        <circle cx="100" cy="100" r="99" fill="#178A82" />
        <circle cx="100" cy="100" r="90.5" fill="#0F2A33" />
        <circle cx="100" cy="100" r="89" fill={`url(#${grad})`} />

        <g fill="none" stroke="#0F2A33" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">
          <path d="M139.55,45.57 L171.54,55.96 L171.54,35.17 L139.55,11.93 L119.77,18.35 Z" />
          <path d="M163.99,154.43 L183.76,148.01 L195.98,110.40 L183.76,93.58 L163.99,120.79 Z" />
          <path d="M80.23,194.50 L119.77,194.50 L131.99,177.68 L100.00,167.28 L68.01,177.68 Z" />
          <path d="M28.46,35.17 L28.46,55.96 L60.45,45.57 L80.23,18.35 L60.45,11.93 Z" />
          <path d="M16.24,148.01 L36.01,154.43 L36.01,120.79 L16.24,93.58 L4.02,110.40 Z" />
          <path d="M131.99,110.40 L163.99,120.79 L183.76,93.58 L171.54,55.96 L139.55,45.57 L119.77,72.78 Z" />
          <path d="M80.23,72.78 L119.77,72.78 L139.55,45.57 L119.77,18.35 L80.23,18.35 L60.45,45.57 Z" />
          <path d="M100.00,167.28 L131.99,177.68 L163.99,154.43 L163.99,120.79 L131.99,110.40 L100.00,133.64 Z" />
          <path d="M36.01,154.43 L68.01,177.68 L100.00,167.28 L100.00,133.64 L68.01,110.40 L36.01,120.79 Z" />
          <path d="M16.24,93.58 L36.01,120.79 L68.01,110.40 L80.23,72.78 L60.45,45.57 L28.46,55.96 Z" />
          <path d="M183.76,93.58 L195.98,110.40 L195.98,89.60 L183.76,51.99 L171.54,35.17 L171.54,55.96 Z" />
          <path d="M80.23,18.35 L119.77,18.35 L139.55,11.93 L119.77,5.50 L80.23,5.50 L60.45,11.93 Z" />
          <path d="M131.99,177.68 L119.77,194.50 L139.55,188.07 L171.54,164.83 L183.76,148.01 L163.99,154.43 Z" />
          <path d="M60.45,188.07 L80.23,194.50 L68.01,177.68 L36.01,154.43 L16.24,148.01 L28.46,164.83 Z" />
          <path d="M4.02,89.60 L4.02,110.40 L16.24,93.58 L28.46,55.96 L28.46,35.17 L16.24,51.99 Z" />
        </g>

        <path
          d="M68.01,110.40 L100.00,133.64 L131.99,110.40 L119.77,72.78 L80.23,72.78 Z"
          fill="#1C3A9C"
          stroke="#0F2A33"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}
