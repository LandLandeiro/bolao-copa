// Skin visual por torneio — camada de ESTRUTURA.
//
// Trabalha em dupla com src/index.css, e a divisão é a seguinte:
//
//   • COR e TIPOGRAFIA vão por variável CSS. `bg-verde` e `font-display` continuam
//     escritos igual no JSX de toda tela e passam a valer o que o torneio manda.
//     Nenhuma tela precisa saber que existe skin — por isso é impossível esquecer
//     uma. Não repita esse trabalho aqui.
//
//   • O QUE MUDA DE ESPÉCIE vem daqui. O header da Copa é uma barra clara com
//     sublinhado verde; o do Brasileirão é uma faixa verde escura com sublinhado
//     amarelo e texto branco. Isso não é "o mesmo elemento noutro tom", é outro
//     desenho — variável de cor não resolve, slot resolve.
//
// REGRA DE OURO: só o Brasileirão tem skin próprio. Qualquer outro torneio — a Copa
// inclusive — recebe SKIN_BASE, cópia literal das classes que já estavam no código.
// A aba da Copa não muda porque continua passando pelas MESMAS strings de sempre.
//
// Cada chave é um "slot": a parte VARIÁVEL das classes de um elemento. O que é
// estrutural (padding, raio, flex, sombra) fica no componente, porque não muda entre
// skins — misturar os dois é o que faz skin vazar.
//
// ⚠️ Escreva sempre a classe INTEIRA. Nada de `bg-${cor}`: o Tailwind lê estes
// arquivos como texto e monta o CSS a partir do que encontra literalmente — classe
// montada em runtime some no build (ver CLAUDE.md).
import { SLUG_PADRAO, SLUG_COPA } from './torneios'

const SKIN_BASE = {
  // --- Marca: a bola do bolão. Mesmo espaço reservado nos dois, pro menu não dançar.
  marca: { src: '/logo-bolao.png', alt: 'Bolão' },

  // --- Header
  headerBarra: 'bg-paper border-b border-line',
  headerMarca: 'text-ink',
  headerNav: 'text-slate hover:text-ink',
  headerNavAtivo: 'text-ink after:bg-verde',
  headerSec: 'text-slate hover:text-ink',
  headerFoco: 'focus-visible:ring-verde/40',
  headerChevron: 'text-slate',

  // --- Faixa do Ranking: arte de fundo + scrim que garante o contraste do texto.
  // Os dois andam juntos de propósito: arte mais clara exige scrim mais forte, e
  // trocar uma sem a outra é como o texto some. O número saiu de medição, não de
  // gosto — ver o comentário no SKIN_BRASILEIRAO.
  faixaRanking: { url: '/ranking-faixa.webp', scrim: 'bg-ink/60' },

  // --- Cabeçalho de seção (dia / fase / rodada)
  secaoCab: 'border border-line bg-cloud hover:bg-paper focus-visible:ring-verde',
  secaoTitulo: 'text-ink',
  secaoChevron: 'text-slate',
  // Badge "hoje" / "atual" / "rodada atual"
  badgeAtual: 'bg-verde text-cloud',
  // Resumo à direita do cabeçalho
  resumoPontos: 'text-verde',
  resumoFalta: 'text-laranja',
  resumoOk: 'text-slate',
}

// Brasileirão: faixa verde campo no header, sublinhado amarelo no item ativo,
// texto branco. A logo do campeonato entra no lugar da bola.
//
// ⚠️ CONTRASTE — o amarelo #FFCD00 NUNCA vira texto sobre fundo claro (reprova no
// WCAG). Os usos aqui são fundo, ou texto sobre o verde escuro. Medidos:
//   • grafite #0E1A12 sobre amarelo   → 11.9:1 (AAA)
//   • branco sobre verde campo        →  8.0:1 (AAA)
//   • branco 80% sobre verde campo    →  5.1:1 (AA)
//   • amarelo sobre verde campo       →  5.3:1 (AA)
const SKIN_BRASILEIRAO = {
  marca: { src: '/brasileirao-logo.webp', alt: 'Brasileirão' },

  headerBarra: 'bg-bra-campo border-b border-bra-campo-dark',
  headerMarca: 'text-white',
  headerNav: 'text-white/80 hover:text-white',
  headerNavAtivo: 'text-white after:bg-bra-amarelo',
  headerSec: 'text-white/80 hover:text-white',
  headerFoco: 'focus-visible:ring-bra-amarelo/60',
  headerChevron: 'text-white/80',

  // Arte de raios concêntricos limão. MEDIDO: o ponto mais claro dela é #CFFF1E,
  // e o gargalo não é o h1 e sim o subtítulo, que é `text-paper/80` — texto com
  // opacidade se mistura com o fundo, então contrasta bem menos que branco puro.
  // Contra o pixel mais claro: 60% dá 3.8:1 no subtítulo (reprova AA), 65% dá
  // 4.4:1 (ainda reprova), 70% dá 5.1:1 ✓. Daí o 70 — abaixo disso o subtítulo
  // sai fora da norma no pior ponto da imagem.
  //
  // Scrim CHAPADO, não gradiente: a imagem entra com bg-cover/bg-center, então o
  // recorte muda por breakpoint e o núcleo claro passeia. Gradiente afinado pro
  // desktop deixaria o mobile descoberto justo onde o texto cai.
  faixaRanking: { url: '/ranking-faixa-brasileirao.webp', scrim: 'bg-ink/70' },

  secaoCab: 'bg-bra-campo hover:bg-bra-campo-dark focus-visible:ring-bra-amarelo',
  secaoTitulo: 'text-white',
  secaoChevron: 'text-white/70',
  badgeAtual: 'bg-bra-amarelo text-bra-grafite',
  resumoPontos: 'text-bra-amarelo',
  resumoFalta: 'text-white',
  resumoOk: 'text-white/70',
}

// Copa: visual base em tudo, MENOS a marca — leva o emblema oficial da Copa 2026 no
// mesmo slot em que o Brasileirão leva o dele.
//
// ⚠️ Isto é uma EXCEÇÃO autorizada pelo dono do projeto (jul/2026) a uma regra que
// o próprio projeto tinha escrito: CLAUDE.md e DESIGN.md §9 proibiam reproduzir o
// emblema "26"+taça da FIFA, por ser marca registrada. As duas docs foram
// atualizadas registrando a decisão — se for revertida, some com esta entrada e o
// SKIN_BASE (logo do bolão) volta a valer sozinho.
const SKIN_COPA = {
  ...SKIN_BASE,
  marca: { src: '/copa-logo.webp', alt: 'Copa do Mundo 2026' },
}

// Lista explícita, não um `!== copa`: torneio novo entra no base (= não muda nada) até
// alguém lhe dar um skin de propósito. Errar pro lado de "não mexer no visual".
const SKINS = {
  [SLUG_PADRAO]: SKIN_BRASILEIRAO,
  [SLUG_COPA]: SKIN_COPA,
}

export function skinDoTorneio(slug) {
  return SKINS[slug] ?? SKIN_BASE
}
