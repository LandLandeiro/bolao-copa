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
// ⚠️ A métrica erra em escudo muito denso × muito vazado — ela mede quanta tinta
// tem, não quão grande a coisa PARECE. Os valores marcados com (manual) abaixo
// foram corrigidos no olho em /dev/escudos e NÃO devem ser sobrescritos se alguém
// rodar a medição de área de novo.
export const ESCALA_MAX = 1.25
const ESCALA_MIN = 0.78

export const ESCALAS = {
  'athletico-pr': 1.25, // no teto: a conta pedia 1.27
  'atletico-mg': 1.25,
  bahia: 1.01,
  botafogo: 0.93,
  bragantino: 0.99,
  chapecoense: 1.04,
  corinthians: 1.18,
  // (manual) 1.06 calculado → 0.98
  coritiba: 0.98,
  // (manual) 0.85 calculado → 0.80
  cruzeiro: 0.80,
  flamengo: 0.91,
  fluminense: 1.01,
  gremio: 0.99,
  // (manual) 0.85 calculado → 0.80
  internacional: 0.80,
  mirassol: 1.03,
  palmeiras: 0.99,
  remo: 0.92,
  santos: 1.07,
  'sao-paulo': 0.90,
  vasco: 0.99,
  vitoria: 1.23,
}

// POR QUE OS TRÊS OVERRIDES (cruzeiro, internacional, coritiba):
// escudo circular de traço fino tem POUCA TINTA e SILHUETA GRANDE — o disco é
// contorno e vazado, não massa cheia. A métrica soma pixel pintado, então lê "área
// pequena" e conclui que o escudo precisa crescer; o olho vê o círculo inteiro
// ocupando a caixa e pede o contrário. Daí o piso ter caído pra 0.78: os três
// precisam encolher MAIS do que a conta jamais proporia.

// Escala óptica de um time. Escudo sem medição (time novo) fica em 1 — neutro.
export function escalaTime(nome) {
  const e = ESCALAS[slugTime(nome)] ?? 1
  return Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, e))
}

// Nomes de arquivo esperados em public/escudos/ — útil pra conferir a pasta.
export const ARQUIVOS_ESPERADOS = Object.values(ESCUDOS).map(
  (s) => `${s}.${EXT_ESCUDO}`,
)
