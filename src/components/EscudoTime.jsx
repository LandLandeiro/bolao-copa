import { useEffect, useState } from 'react'
import {
  slugTime,
  iniciaisTime,
  escalaTime,
  EXT_ESCUDO,
  ESCALA_MAX,
} from '../lib/escudos'

// Escudo do clube, em caixa de tamanho FIXO, com fallback que nunca quebra o card.
//
// Dois problemas resolvidos aqui:
//
// 1. FALLBACK — um arquivo pode faltar (time novo ainda sem escudo) ou falhar em
//    rede. O onError troca a imagem por um círculo com as iniciais; jamais o ícone
//    de imagem estourada do navegador.
//
// 2. TAMANHO ÓPTICO — brasão alto e escudo redondo preenchem a caixa de formas
//    diferentes, então cada um leva uma escala própria (ver escalaTime em
//    lib/escudos.js — medição amortecida, ou valor escolhido no olho).
//
//    A caixa externa tem tamanho fixo e NÃO muda: quem escala é só o conteúdo, pra
//    o alinhamento das colunas do card não depender do escudo que caiu ali.
//
//    A imagem nasce menor que a caixa — 1/ESCALA_MAX dela — pra sobrar folga. Sem
//    isso, escala > 1 vazaria pra fora: com object-contain a imagem JÁ ocupa a maior
//    dimensão da caixa, então qualquer aumento estouraria. Com a folga, escala
//    ESCALA_MAX encosta exatamente na borda e nada nunca transborda.
export default function EscudoTime({ nome, tamanho = 44 }) {
  const [falhou, setFalhou] = useState(false)
  const slug = slugTime(nome)

  // Time mudou (React reaproveita o componente entre jogos) → tenta de novo, senão
  // um escudo faltando contaminaria o próximo time a cair neste slot.
  useEffect(() => {
    setFalhou(false)
  }, [slug])

  const caixa = { width: tamanho, height: tamanho }

  if (!slug || falhou) {
    return (
      <div
        role="img"
        aria-label={nome}
        title={nome}
        style={caixa}
        className="shrink-0 rounded-pill bg-line border border-line shadow-soft flex items-center justify-center font-bold text-xs text-slate select-none"
      >
        {iniciaisTime(nome)}
      </div>
    )
  }

  const base = tamanho / ESCALA_MAX // folga pra escala poder passar de 1

  return (
    <span style={caixa} className="shrink-0 inline-flex items-center justify-center">
      <img
        src={`/escudos/${slug}.${EXT_ESCUDO}`}
        alt={nome}
        title={nome}
        width={Math.round(base)}
        height={Math.round(base)}
        style={{ width: base, height: base, transform: `scale(${escalaTime(nome)})` }}
        loading="lazy"
        onError={() => setFalhou(true)}
        className="object-contain select-none"
      />
    </span>
  )
}
