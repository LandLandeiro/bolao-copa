// Helpers de grupo (cor rotativa + classes Tailwind + bandeira por seleção).
// Nada de classe dinâmica `bg-${cor}` no JSX — Tailwind purga o que não vê literal.
// Aqui as strings ficam completas (e os bg- dos 8 também estão no safelist do config).

const CORES = ['teal', 'verde', 'amarelo', 'laranja', 'vermelho', 'vinho', 'roxo', 'azul']

// A=0, B=1, … cicla nas 8 cores (I–L repetem).
export function corDoGrupo(letra) {
  if (!letra) return 'verde'
  const i = letra.toUpperCase().charCodeAt(0) - 65
  if (i < 0) return 'verde'
  return CORES[i % CORES.length]
}

// Classes completas (bg + texto). Texto escuro nos fundos claros
// (amarelo/teal/laranja) pra cumprir o contraste do DESIGN.md §10.
const CLASSES = {
  teal:     { bg: 'bg-teal',     text: 'text-ink' },
  verde:    { bg: 'bg-verde',    text: 'text-cloud' },
  amarelo:  { bg: 'bg-amarelo',  text: 'text-ink' },
  laranja:  { bg: 'bg-laranja',  text: 'text-ink' },
  vermelho: { bg: 'bg-vermelho', text: 'text-cloud' },
  vinho:    { bg: 'bg-vinho',    text: 'text-cloud' },
  roxo:     { bg: 'bg-roxo',     text: 'text-cloud' },
  azul:     { bg: 'bg-azul',     text: 'text-cloud' },
}

export function classeDoGrupo(letra) {
  return CLASSES[corDoGrupo(letra)]
}

// Mapa time → código ISO/regional (flagcdn).
// Codes especiais: gb-sct (Escócia), gb-eng (Inglaterra) — flagcdn aceita
// as subdivisões UK além dos códigos ISO de 2 letras.
// Lista é dos 48 participantes da Copa 2026; se vier um nome fora do mapa,
// `bandeira` devolve '' e o componente <Bandeira> cai no fallback de iniciais.
const BANDEIRAS = {
  'México': 'mx', 'África do Sul': 'za', 'Coreia do Sul': 'kr', 'República Tcheca': 'cz',
  'Canadá': 'ca', 'Catar': 'qa', 'Suíça': 'ch', 'Bósnia e Herzegovina': 'ba',
  'Brasil': 'br', 'Marrocos': 'ma', 'Haiti': 'ht', 'Escócia': 'gb-sct',
  'Estados Unidos': 'us', 'Paraguai': 'py', 'Austrália': 'au', 'Turquia': 'tr',
  'Alemanha': 'de', 'Curaçao': 'cw', 'Costa do Marfim': 'ci', 'Equador': 'ec',
  'Holanda': 'nl', 'Japão': 'jp', 'Tunísia': 'tn', 'Suécia': 'se',
  'Bélgica': 'be', 'Egito': 'eg', 'Irã': 'ir', 'Nova Zelândia': 'nz',
  'Espanha': 'es', 'Cabo Verde': 'cv', 'Arábia Saudita': 'sa', 'Uruguai': 'uy',
  'França': 'fr', 'Senegal': 'sn', 'Noruega': 'no', 'Iraque': 'iq',
  'Argentina': 'ar', 'Argélia': 'dz', 'Áustria': 'at', 'Jordânia': 'jo',
  'Portugal': 'pt', 'Uzbequistão': 'uz', 'Colômbia': 'co', 'RD Congo': 'cd',
  'Inglaterra': 'gb-eng', 'Croácia': 'hr', 'Gana': 'gh', 'Panamá': 'pa',
}

export function bandeira(time) {
  return BANDEIRAS[time] ?? ''
}

// Sigla FIFA de 3 letras (trigrama), pro card compacto do chaveamento.
// É o código oficial da seleção (ex.: Alemanha = GER, Holanda = NED) — não bate
// com o ISO da bandeira. Fora do mapa (ex.: "A definir") → fallback nas iniciais.
const SIGLAS = {
  'México': 'MEX', 'África do Sul': 'RSA', 'Coreia do Sul': 'KOR', 'República Tcheca': 'CZE',
  'Canadá': 'CAN', 'Catar': 'QAT', 'Suíça': 'SUI', 'Bósnia e Herzegovina': 'BIH',
  'Brasil': 'BRA', 'Marrocos': 'MAR', 'Haiti': 'HAI', 'Escócia': 'SCO',
  'Estados Unidos': 'USA', 'Paraguai': 'PAR', 'Austrália': 'AUS', 'Turquia': 'TUR',
  'Alemanha': 'GER', 'Curaçao': 'CUW', 'Costa do Marfim': 'CIV', 'Equador': 'ECU',
  'Holanda': 'NED', 'Japão': 'JPN', 'Tunísia': 'TUN', 'Suécia': 'SWE',
  'Bélgica': 'BEL', 'Egito': 'EGY', 'Irã': 'IRN', 'Nova Zelândia': 'NZL',
  'Espanha': 'ESP', 'Cabo Verde': 'CPV', 'Arábia Saudita': 'KSA', 'Uruguai': 'URU',
  'França': 'FRA', 'Senegal': 'SEN', 'Noruega': 'NOR', 'Iraque': 'IRQ',
  'Argentina': 'ARG', 'Argélia': 'ALG', 'Áustria': 'AUT', 'Jordânia': 'JOR',
  'Portugal': 'POR', 'Uzbequistão': 'UZB', 'Colômbia': 'COL', 'RD Congo': 'COD',
  'Inglaterra': 'ENG', 'Croácia': 'CRO', 'Gana': 'GHA', 'Panamá': 'PAN',
}

export function siglaTime(time) {
  if (!time) return ''
  return SIGLAS[time] ?? time.slice(0, 3).toUpperCase()
}
