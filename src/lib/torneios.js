// Catálogo de torneios do lado do front. A LISTA de torneios mora no banco (tabela
// `torneios`); aqui ficam só duas coisas que o front precisa saber ANTES de ter os
// jogos em mãos: qual é o torneio padrão e qual o FORMATO de cada um.
//
// ⚠️ ESPELHO do CHECK de `matches` (migration scope_scoring_functions_by_torneio):
//   copa-2026        → fase in (grupos,16avos,oitavas,quartas,semis,terceiro,final)
//                      E rodada IS NULL                        ⇒ formato 'mata-mata'
//   brasileirao-2026 → fase = 'rodada' E rodada entre 20 e 38  ⇒ formato 'pontos-corridos'
//
// O formato decide DUAS coisas na UI (e só elas):
//   1. como a tela de Jogos agrupa (por dia+fase no mata-mata; por rodada na liga);
//   2. se existe Chaveamento e escada de pesos por fase (só no mata-mata).
// Torneio novo no banco? Acrescente o slug aqui — senão ele cai no fallback abaixo.

// Torneio ativo: é ele que responde em "/" e nas telas da raiz.
export const SLUG_PADRAO = 'brasileirao-2026'

// Copa arquivada: mesma tela, rota própria, somente leitura.
export const SLUG_COPA = 'copa-2026'

export const FORMATOS = {
  [SLUG_COPA]: 'mata-mata',
  [SLUG_PADRAO]: 'pontos-corridos',
}

// Fallback proposital: um torneio ainda não mapeado é tratado como liga (o formato
// mais simples — sem bracket, sem escada de pesos). Nunca quebra a tela; no máximo
// mostra o torneio novo com menos enfeite até alguém acrescentar o slug ao FORMATOS.
export function formatoDoTorneio(slug) {
  return FORMATOS[slug] ?? 'pontos-corridos'
}
