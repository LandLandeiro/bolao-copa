// Skin visual por torneio.
//
// REGRA DE OURO: só o Brasileirão tem skin próprio. Qualquer outro torneio — a Copa
// inclusive — recebe SKIN_BASE, que é a cópia literal das classes que já estavam no
// código. Por isso a aba da Copa não muda de aparência: ela continua passando pelas
// MESMAS strings de sempre, só que agora vindas daqui.
//
// Cada chave é um "slot" de estilo: a parte VARIÁVEL das classes de um elemento. O
// que é estrutural (padding, raio, flex, sombra) fica no componente, porque não muda
// entre skins — misturar os dois é o que faz skin vazar.
//
// ⚠️ Escreva sempre a classe INTEIRA. Nada de `bg-${cor}`: o Tailwind lê estes
// arquivos como texto e monta o CSS a partir do que encontra literalmente — classe
// montada em runtime some no build (ver CLAUDE.md).
import { SLUG_PADRAO } from './torneios'

// Visual base do app (Copa e qualquer torneio sem skin).
const SKIN_BASE = {
  // Cabeçalho de seção (dia / fase / rodada)
  secaoCab: 'border border-line bg-cloud hover:bg-paper focus-visible:ring-verde',
  secaoTitulo: 'font-display text-ink',
  secaoChevron: 'text-slate',
  // Badge "hoje" / "atual" / "rodada atual"
  badgeAtual: 'bg-verde text-cloud',
  // Resumo à direita do cabeçalho
  resumoPontos: 'text-verde',
  resumoFalta: 'text-laranja',
  resumoOk: 'text-slate',
  // Ação primária (salvar palpite)
  botaoAcao:
    'bg-verde hover:bg-verde-dark text-cloud disabled:bg-line disabled:text-slate',
  // Foco de campo editável (input de placar)
  focoCampo: 'focus:border-verde focus:ring-verde/30',
  // Títulos de página e números grandes (placar)
  fonteDisplay: 'font-display',
}

// Skin do Brasileirão: verde campo nas faixas e ações, amarelo só como FUNDO de
// destaque (ou texto sobre o verde escuro, onde passa 5.3:1), Archivo nos títulos.
//
// ⚠️ CONTRASTE — o amarelo #FFCD00 NUNCA vira texto sobre fundo claro (reprova no
// WCAG). Os dois usos aqui são seguros e foram medidos:
//   • texto grafite #0E1A12 sobre amarelo  → 11.9:1 (AAA)
//   • texto amarelo sobre verde campo      →  5.3:1 (AA)
//   • texto branco sobre verde campo       →  8.0:1 (AAA)
const SKIN_BRASILEIRAO = {
  secaoCab: 'bg-bra-campo hover:bg-bra-campo-dark focus-visible:ring-bra-amarelo',
  secaoTitulo: 'font-brasil font-extrabold text-white',
  secaoChevron: 'text-white/70',
  badgeAtual: 'bg-bra-amarelo text-bra-grafite',
  resumoPontos: 'text-bra-amarelo',
  resumoFalta: 'text-white',
  resumoOk: 'text-white/70',
  botaoAcao:
    'bg-bra-campo hover:bg-bra-campo-dark text-white disabled:bg-line disabled:text-slate',
  focoCampo: 'focus:border-bra-campo focus:ring-bra-campo/30',
  fonteDisplay: 'font-brasil font-extrabold',
}

// Lista explícita, não um `!== copa`: torneio novo entra no base (= não muda nada) até
// alguém lhe dar um skin de propósito. Errar pro lado de "não mexer no visual".
const SKINS = { [SLUG_PADRAO]: SKIN_BRASILEIRAO }

export function skinDoTorneio(slug) {
  return SKINS[slug] ?? SKIN_BASE
}
