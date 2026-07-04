// Lógica do chaveamento (bracket). Monta a ÁRVORE a partir das linhas achatadas de
// `matches` (o schema não liga jogo→próximo). A estrutura vem de uma TOPOLOGIA
// explícita (ALIMENTADORES): quais 2 jogos alimentam cada jogo da rodada seguinte.
// Não pareie por posição/data — nos 16avos os confrontos cruzam (ex.: 73 e 75
// alimentam a MESMA oitava), então só o mapa dá o confronto certo. Slot sem linha em
// `matches` → "A definir". Quem avançou NUNCA vem do placar (ver ladoAvancou).
import { calcularPontos } from './pontos'

// Rodadas do mata-mata que entram no SELETOR (sem grupos; 3º lugar é à parte).
// `barras` = densidade do ícone (5→1). `curto` = rótulo mobile. `col` = label da coluna.
export const FASES_MATA = [
  { id: '16avos', curto: '16av', col: '16-avos', barras: 5, slots: 16 },
  { id: 'oitavas', curto: '8av', col: 'Oitavas', barras: 4, slots: 8 },
  { id: 'quartas', curto: '4tas', col: 'Quartas', barras: 3, slots: 4 },
  { id: 'semis', curto: 'SF', col: 'Semis', barras: 2, slots: 2 },
  { id: 'final', curto: 'F', col: 'Final', barras: 1, slots: 1 },
]

export const IDS_MATA = FASES_MATA.map((f) => f.id)

// Topologia OFICIAL (FIFA): pra cada jogo do banco, os 2 jogos que o alimentam. Os ids
// batem com a ordem de insert do seed (72 grupos → 16avos 73-88, oitavas 89-96,
// quartas 97-100, semis 101-102, 3º 103, final 104).
const ALIMENTADORES = {
  // oitavas ← 16avos
  89: [74, 77], // Paraguai × França
  90: [73, 75], // Canadá × Marrocos
  91: [76, 78], // Brasil × Noruega
  92: [79, 80], // México × Inglaterra
  93: [83, 84], // Portugal × Espanha
  94: [81, 82], // EUA × Bélgica
  95: [86, 88], // Argentina × Egito
  96: [85, 87], // Suíça × Colômbia
  // quartas ← oitavas
  97: [89, 90],
  98: [93, 94],
  99: [91, 92],
  100: [95, 96],
  // semis ← quartas
  101: [97, 98],
  102: [99, 100],
  // final e 3º lugar ← semis (a semi alimenta os dois: vencedor→final, perdedor→3º)
  104: [101, 102],
  103: [101, 102],
}

const ID_FINAL = 104
const ID_TERCEIRO = 103

// Ordem visual de cada coluna (de cima pra baixo), derivada do mapa: expande a árvore
// da final pra trás; cada nível é o flatMap dos alimentadores do nível seguinte. Assim
// o pareamento POSICIONAL dos conectores (2 filhos → 1 pai) já cai no confronto certo.
const COLUNAS = (() => {
  const niveis = []
  let nivel = [ID_FINAL]
  while (nivel.length) {
    niveis.unshift(nivel)
    nivel = nivel.flatMap((id) => ALIMENTADORES[id] ?? [])
  }
  return niveis // [16avos(16), oitavas(8), quartas(4), semis(2), final(1)]
})()

// Filho → pai (o jogo da rodada seguinte que ele alimenta). Exclui o 3º lugar: de uma
// semi, "quem avançou" é quem aparece na FINAL, não no 3º.
const PAI_POR_FILHO = (() => {
  const mapa = {}
  for (const [pai, filhos] of Object.entries(ALIMENTADORES)) {
    if (Number(pai) === ID_TERCEIRO) continue
    for (const filho of filhos) mapa[filho] = Number(pai)
  }
  return mapa
})()

// Monta { rodadas: [{fase, jogos:[match|null,...]}], terceiro: match|null }.
// Cada rodada segue a ordem topológica de COLUNAS; id sem linha em `matches` → null
// ("A definir"). A rodada seguinte NÃO é calculada por placar: os classificados já
// vêm preenchidos na própria linha da rodada seguinte no banco.
export function montarBracket(matchesMata) {
  const porId = new Map()
  for (const m of matchesMata) porId.set(m.id, m)
  const rodadas = FASES_MATA.map((f, i) => ({
    fase: f.id,
    jogos: (COLUNAS[i] ?? []).map((id) => porId.get(id) ?? null),
  }))
  const terceiro = porId.get(ID_TERCEIRO) ?? null
  return { rodadas, terceiro }
}

// Índice (0..4) da rodada "ativa": a do jogo mais próximo de agora (próximo a
// acontecer); se todos já passaram, a última com jogo; se não há jogo, 16-avos.
export function rodadaAtivaIndex(matchesMata, agora = Date.now()) {
  let idxProximo = -1
  let melhorFut = Infinity
  let idxUltimo = -1
  for (const m of matchesMata) {
    const i = IDS_MATA.indexOf(m.fase)
    if (i < 0 || !m.data_hora) continue
    const t = new Date(m.data_hora).getTime()
    if (t >= agora && t < melhorFut) {
      melhorFut = t
      idxProximo = i
    }
    if (i > idxUltimo) idxUltimo = i
  }
  if (idxProximo >= 0) return idxProximo
  if (idxUltimo >= 0) return idxUltimo
  return 0
}

// --- Estado do card (ver SPEC §7) ---
// 'adefinir' | 'encerrado' | 'aovivo' | 'agendado'
export function estadoJogo(match, agora = Date.now()) {
  if (!match || !match.time_casa || !match.time_fora) return 'adefinir'
  const encerrado = match.gols_casa != null && match.gols_fora != null
  if (encerrado) return 'encerrado'
  const inicio = match.data_hora ? new Date(match.data_hora).getTime() : Infinity
  return inicio <= agora ? 'aovivo' : 'agendado'
}

// --- Resultado do palpite → estilo (ver SPEC §1 e §6) ---
// Devolve a "chave" do resultado + pontos base (5/3/1/0) quando o jogo encerrou e há
// palpite. Caso contrário, o estado vira o próprio status (aovivo/aguardando/adefinir).
// As classes Tailwind são LITERAIS (sem interpolação) pro purge enxergar.
const ESTILO = {
  cravada:    { rotulo: 'Cravada',  borda: 'border-chave-r5',     dot: 'bg-chave-r5 text-white',          chip: 'bg-chave-r5bg text-chave-r5' },
  saldo:      { rotulo: 'Saldo',    borda: 'border-chave-r3',     dot: 'bg-chave-r3 text-white',          chip: 'bg-chave-r3bg text-chave-r3tx' },
  vencedor:   { rotulo: 'Vencedor', borda: 'border-chave-r1',     dot: 'bg-chave-r1 text-white',          chip: 'bg-chave-r1bg text-chave-r1' },
  errou:      { rotulo: 'Errou',    borda: 'border-chave-r0',     dot: 'bg-chave-r0 text-white',          chip: 'bg-chave-r0bg text-chave-r0tx' },
  aovivo:     { rotulo: 'Em jogo',  borda: 'border-chave-live',   dot: 'bg-chave-live text-white',        chip: 'bg-chave-livebg text-chave-live' },
  aguardando: { rotulo: 'Aguardando', borda: 'border-chave-neutro', dot: 'bg-chave-wait text-white',      chip: 'bg-chave-waitbg text-chave-wait' },
  aberto:     { rotulo: '',         borda: 'border-chave-neutro2', dot: '',                                chip: '' },
  adefinir:   { rotulo: '',         borda: 'border-chave-neutro2', dot: 'bg-chave-neutro2 text-chave-sec', chip: '' },
}

const CHAVE_POR_PONTOS = { 5: 'cravada', 3: 'saldo', 1: 'vencedor', 0: 'errou' }

// Resultado do palpite do usuário pra um jogo. `palpite` = {palpite_casa, palpite_fora}.
// Retorna { chave, estilo, pontos|null }. pontos só existe quando encerrado c/ palpite.
export function resultadoPalpite(match, palpite, agora = Date.now()) {
  const estado = estadoJogo(match, agora)
  const temPalpite =
    palpite && palpite.palpite_casa != null && palpite.palpite_fora != null

  if (estado === 'encerrado' && temPalpite) {
    const pts = calcularPontos(
      palpite.palpite_casa,
      palpite.palpite_fora,
      match.gols_casa,
      match.gols_fora,
    )
    const chave = CHAVE_POR_PONTOS[pts] ?? 'errou'
    return { chave, estilo: ESTILO[chave], pontos: pts }
  }
  if (estado === 'aovivo') return { chave: 'aovivo', estilo: ESTILO.aovivo, pontos: null }
  if (estado === 'agendado')
    // Com palpite → "aguardando" (borda mais definida); sem palpite → "aberto" (leve).
    return temPalpite
      ? { chave: 'aguardando', estilo: ESTILO.aguardando, pontos: null }
      : { chave: 'aberto', estilo: ESTILO.aberto, pontos: null }
  return { chave: 'adefinir', estilo: ESTILO.adefinir, pontos: null }
}

// Quem venceu um jogo encerrado: 'casa' | 'fora' | 'empate' | null.
export function vencedor(match) {
  if (!match || match.gols_casa == null || match.gols_fora == null) return null
  if (match.gols_casa > match.gols_fora) return 'casa'
  if (match.gols_casa < match.gols_fora) return 'fora'
  return 'empate'
}

// Lado que AVANÇOU de um jogo do mata-mata: 'casa' | 'fora' | null. Fonte da verdade =
// quem aparece na rodada SEGUINTE (nunca o placar): jogo decidido nos pênaltis termina
// empatado nos 90', e o placar não diz quem passou. Só cai pro placar quando a rodada
// seguinte ainda não identifica ninguém E o jogo não terminou empatado.
export function ladoAvancou(match, matchesMata) {
  if (!match || estadoJogo(match) !== 'encerrado') return null
  const paiId = PAI_POR_FILHO[match.id]
  const pai = paiId != null ? matchesMata.find((m) => m.id === paiId) : null
  const times = pai ? [pai.time_casa, pai.time_fora].filter(Boolean) : []
  if (times.includes(match.time_casa)) return 'casa'
  if (times.includes(match.time_fora)) return 'fora'
  const v = vencedor(match)
  return v === 'empate' ? null : v
}
