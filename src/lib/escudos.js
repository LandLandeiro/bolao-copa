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

// Nomes de arquivo esperados em public/escudos/ — útil pra conferir a pasta.
export const ARQUIVOS_ESPERADOS = Object.values(ESCUDOS).map(
  (s) => `${s}.${EXT_ESCUDO}`,
)
