import { useEffect, useState } from 'react'
import { slugTime, iniciaisTime, EXT_ESCUDO } from '../lib/escudos'

// Escudo do clube, com fallback que NUNCA quebra o card.
//
// Um arquivo em public/escudos/ pode faltar (time novo ainda sem escudo) ou falhar
// em rede. Quando isso acontece o onError troca a imagem por um círculo com as
// iniciais do time — jamais o ícone de imagem estourada do navegador.
//
// width/height FIXOS (atributo + style) reservam o espaço antes de a imagem chegar,
// então a lista não dá salto (layout shift) quando os escudos carregam.
export default function EscudoTime({ nome, tamanho = 44 }) {
  const [falhou, setFalhou] = useState(false)
  const slug = slugTime(nome)

  // Time mudou (React reaproveita o componente entre jogos) → tenta de novo, senão
  // um escudo faltando contaminaria o próximo time a cair neste slot.
  useEffect(() => {
    setFalhou(false)
  }, [slug])

  const estilo = { width: tamanho, height: tamanho }

  if (!slug || falhou) {
    return (
      <div
        role="img"
        aria-label={nome}
        title={nome}
        style={estilo}
        className="rounded-pill bg-line border border-line shadow-soft flex items-center justify-center font-bold text-xs text-slate select-none"
      >
        {iniciaisTime(nome)}
      </div>
    )
  }

  return (
    <img
      src={`/escudos/${slug}.${EXT_ESCUDO}`}
      alt={nome}
      title={nome}
      width={tamanho}
      height={tamanho}
      style={estilo}
      loading="lazy"
      onError={() => setFalhou(true)}
      className="object-contain select-none"
    />
  )
}
