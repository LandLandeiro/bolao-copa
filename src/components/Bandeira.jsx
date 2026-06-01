import { bandeira } from '../lib/grupos'

// Ícone quadrado da bandeira do país.
// Usa flagcdn (CDN público, sem chave). Pede w80 e oferece w160 pra @2x (retina).
// Sem código? Cai num quadrado bg-line com as 3 primeiras letras do nome.
export default function Bandeira({ time, size = 44 }) {
  const codigo = bandeira(time)
  const estilo = { width: size, height: size }
  const moldura = 'rounded-md overflow-hidden border border-line shadow-soft'

  if (!codigo) {
    const letras = (time || '').slice(0, 3).toUpperCase()
    return (
      <div
        role="img"
        aria-label={time}
        title={time}
        style={estilo}
        className={`${moldura} bg-line flex items-center justify-center font-bold text-xs text-slate select-none`}
      >
        {letras}
      </div>
    )
  }

  return (
    <div style={estilo} className={moldura}>
      <img
        src={`https://flagcdn.com/w80/${codigo}.png`}
        srcSet={`https://flagcdn.com/w160/${codigo}.png 2x`}
        alt={time}
        loading="lazy"
        className="w-full h-full object-cover"
      />
    </div>
  )
}
