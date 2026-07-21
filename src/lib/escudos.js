// Escudos dos clubes do Brasileirão.
//
// Os arquivos ficam em public/escudos/{slug}.webp — LOCAIS, nunca CDN de terceiros
// (ge, sofascore etc.): link externo quebra, muda de URL e é conteúdo de outro dono.
// Se algum faltar, o <EscudoTime> cai no fallback de iniciais — a tela funciona
// igual, só sem a arte.
//
// A logo do CAMPEONATO não entra aqui: ela é do Brasileirão, não de um time, e vive
// solta em public/brasileirao-logo.webp (usada no seletor de torneio do header).
//
// ⚠️ ATENÇÃO AOS DOIS ATLÉTICOS: "Athletico-PR" (Paraná, com H) e "Atlético-MG"
// (Minas, sem H) são clubes DIFERENTES de nome quase igual. Os slugs têm que sair
// distintos ('athletico-pr' × 'atletico-mg') — trocar um pelo outro põe o escudo
// errado no card. Há teste cobrindo a colisão.

// Normalização: minúsculo, sem acento, espaço vira hífen.
// "São Paulo" → "sao-paulo" · "Grêmio" → "gremio" · "Atlético-MG" → "atletico-mg"
function normalizar(nome) {
  return (nome ?? '')
    .normalize('NFD') // separa a letra do acento…
    .replace(/[̀-ͯ]/g, '') // …e joga o acento fora
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
}

// Mapa EXPLÍCITO dos 20 times da Série A — as chaves são os valores exatos de
// matches.time_casa/time_fora. Existe além da normalização automática de propósito:
// deixa o nome do arquivo à vista (dá pra conferir contra a pasta sem rodar nada) e
// blinda os casos com acento/hífen de qualquer mudança futura no normalizar().
export const ESCUDOS = {
  'Athletico-PR': 'athletico-pr',
  'Atlético-MG': 'atletico-mg',
  Bahia: 'bahia',
  Botafogo: 'botafogo',
  Bragantino: 'bragantino',
  Chapecoense: 'chapecoense',
  Corinthians: 'corinthians',
  Coritiba: 'coritiba',
  Cruzeiro: 'cruzeiro',
  Flamengo: 'flamengo',
  Fluminense: 'fluminense',
  Grêmio: 'gremio',
  Internacional: 'internacional',
  Mirassol: 'mirassol',
  Palmeiras: 'palmeiras',
  Remo: 'remo',
  Santos: 'santos',
  'São Paulo': 'sao-paulo',
  Vasco: 'vasco',
  Vitória: 'vitoria',
}

// Slug do time. Time conhecido sai do mapa; qualquer outro (time novo, nome grafado
// diferente) cai na normalização, em vez de ficar sem escudo por falta de cadastro.
export function slugTime(nome) {
  return ESCUDOS[nome] ?? normalizar(nome)
}

// Times cujas 3 primeiras letras COLIDEM com as de outro — aí a sigla automática
// não serve. Hoje só o par Corinthians × Coritiba: os dois dariam "COR", e enquanto
// os PNGs não existirem TODO time aparece pela sigla, então os dois ficariam
// idênticos no card. Coritiba usa CFC (Coritiba Foot Ball Club).
const INICIAIS = {
  Coritiba: 'CFC',
}

// Iniciais do fallback: 3 primeiras letras, SEM acento, maiúsculas.
// "Flamengo" → FLA · "São Paulo" → SAO · "Atlético-MG" → ATL · "Athletico-PR" → ATH
export function iniciaisTime(nome) {
  if (INICIAIS[nome]) return INICIAIS[nome]
  return (nome ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .slice(0, 3)
    .toUpperCase()
}

// Extensão dos arquivos de escudo. Fica numa constante porque quem monta a URL é o
// EscudoTime e quem confere a pasta é o teste — os dois têm que falar do mesmo lugar.
export const EXT_ESCUDO = 'webp'

// ---------------------------------------------------------------------------
// COMPENSAÇÃO ÓPTICA
//
// Numa caixa quadrada com object-contain, escudo alto (brasão) ocupa MENOS caixa
// que escudo redondo — e escudo com estrela/coroa em cima fica com a moldura mais
// alta, então o CORPO encolhe. O olho compara os corpos, não as caixas.
//
// Os números abaixo foram CALCULADOS, não escolhidos a dedo:
//   densidade = área de pixel não-transparente ÷ max(larg,alt)²  (a fração da caixa
//               que o escudo de fato preenche depois do object-contain — normalizar
//               pelo lado maior é o que torna comparável arquivo de 256px com um
//               de 330px)
//   escala    = √(densidade mediana ÷ densidade do escudo), limitada a [0.85, 1.25]
//   raiz quadrada porque área cresce ao quadrado da escala: metade da área pede
//   √2 ≈ 1.41, não 2.
//
// ⚠️ É ajuste ÓPTICO, não de layout: a CAIXA nunca muda de tamanho, só o conteúdo
// dentro dela. Mexer aqui não desalinha nada.
//
// ⚠️ A métrica acerta a DIREÇÃO (quem tem que crescer cresce) mas exagera a
// MAGNITUDE — na prática ela empurra longe demais pros dois lados. Por isso o
// resultado passa por um amortecimento antes de virar escala de verdade.
//
// 👉 AMORTECIMENTO é o botão pra mexer se ainda estiver forte ou fraco demais.
//    1.0 = a medição crua, sem amortecer (era assim, e ficava exagerado)
//    0.6 = atual — mantém a direção com 60% da intensidade
//    0.0 = desliga a compensação (todo escudo em 1.0)
// Efeito nos extremos: 1.27 → 1.16 · 0.85 → 0.91
const AMORTECIMENTO = 0.6

export const ESCALA_MAX = 1.2
const ESCALA_MIN = 0.85

// Valores MEDIDOS (crus, antes de amortecer) — saem da conta de área descrita acima.
// Pode reescrever este bloco inteiro numa remedição sem medo: o amortecimento e o
// clamp são aplicados na leitura, não aqui.
const ESCALAS_MEDIDAS = {
  'athletico-pr': 1.268,
  'atletico-mg': 1.249,
  bahia: 1.007,
  botafogo: 0.928,
  bragantino: 0.992,
  chapecoense: 1.035,
  corinthians: 1.184,
  coritiba: 1.06,
  cruzeiro: 0.848,
  flamengo: 0.914,
  fluminense: 1.012,
  gremio: 0.994,
  internacional: 0.846,
  mirassol: 1.028,
  palmeiras: 0.988,
  remo: 0.922,
  santos: 1.068,
  'sao-paulo': 0.9,
  vasco: 0.985,
  vitoria: 1.231,
}

// Valores escolhidos NO OLHO em /dev/escudos, para os casos em que a métrica erra a
// DIREÇÃO — não só a intensidade. Aqui já é o número final: NÃO passa pelo
// amortecimento, senão a correção seria puxada de volta pra perto de 1.0 e se
// perderia. Uma remedição também não deve sobrescrever isto.
//
// Os dois modos de falha da métrica de área, ambos por ela medir TINTA e não
// TAMANHO PERCEBIDO:
//
// • MUITA MARGEM TRANSPARENTE (os dois Atléticos). São os escudos mais alongados do
//   lote — Atlético-MG 1.49 de proporção, Athletico-PR 1.34, contra ~1.0 dos
//   redondos. Alongado sobra transparência dos lados, a área lida cai, e a conta
//   manda crescer; na tela o escudo já vinha maior que os vizinhos.
//
// • TRAÇO FINO E VAZADO (Coritiba). Disco de contorno, não massa cheia: pouca tinta,
//   silhueta grande. A conta manda crescer (1.06), o olho pede o contrário.
const ESCALAS_MANUAIS = {
  'athletico-pr': 1.0, // calculado 1.16
  'atletico-mg': 1.05, // calculado 1.15
  coritiba: 0.98, // calculado 1.04
}

const limitar = (e) => Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, e))

// Escala óptica de um time. Escudo sem medição (time novo) fica em 1 — neutro.
export function escalaTime(nome) {
  const slug = slugTime(nome)
  if (slug in ESCALAS_MANUAIS) return limitar(ESCALAS_MANUAIS[slug])

  const medida = ESCALAS_MEDIDAS[slug] ?? 1
  return limitar(1 + (medida - 1) * AMORTECIMENTO)
}

// Pra tela de conferência mostrar de onde veio cada número.
export function origemDaEscala(nome) {
  return slugTime(nome) in ESCALAS_MANUAIS ? 'manual' : 'medida'
}

// Nomes de arquivo esperados em public/escudos/ — útil pra conferir a pasta.
export const ARQUIVOS_ESPERADOS = Object.values(ESCUDOS).map(
  (s) => `${s}.${EXT_ESCUDO}`,
)
