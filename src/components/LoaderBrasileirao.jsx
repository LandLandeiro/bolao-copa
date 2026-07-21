import { useId } from 'react'

// Loader do Brasileirão: o brasão parado, e só a BOLA girando no miolo.
//
// Geometria (do arquivo de referência, conferida — não recalcular):
//   viewBox 1280x1245 = o crest inteiro.
//   A bola é um PNG quadrado de 266x266 posto em (501,549), então seu centro cai em
//   (501+133, 549+133) = (634,682) — exatamente o centro do clipPath de r=133.
//   Isso faz duas coisas: a bola gira no próprio eixo (sem oscilar) e o recorte
//   circular come os cantos do quadrado, que são limão opaco e apareceriam.
//
// O id do clipPath é ÚNICO por instância (useId) em vez do 'brzBall' fixo da
// referência: dois loaders na mesma tela compartilhariam o id e o segundo recortaria
// pelo primeiro. Mesma razão do gradiente no <Loader/>.
//
// Os @keyframes ficam no index.css (classe .brz-ball), uma vez só, junto com o
// @media de prefers-reduced-motion.
export default function LoaderBrasileirao({ tamanho = 80, className = '' }) {
  const uid = useId().replace(/:/g, '')
  const recorte = `brz-ball-${uid}`

  return (
    <div
      role="status"
      aria-label="Carregando"
      className={`inline-block blr-surge ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1280 1245"
        width={tamanho}
        height={tamanho}
        aria-hidden="true"
        className="block"
      >
        {/* Fundo estático: o brasão completo. */}
        <image href="/loader/crest.webp" x="0" y="0" width="1280" height="1245" />

        <clipPath id={recorte}>
          <circle cx="634" cy="682" r="133" />
        </clipPath>

        {/* Só isto gira. */}
        <image
          href="/loader/ball.webp"
          x="501"
          y="549"
          width="266"
          height="266"
          clipPath={`url(#${recorte})`}
          className="brz-ball"
        />
      </svg>
    </div>
  )
}
