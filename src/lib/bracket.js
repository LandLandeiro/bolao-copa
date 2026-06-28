// Lógica do chaveamento (bracket). Monta a ÁRVORE a partir das linhas achatadas de
// `matches` (o schema não liga jogo→próximo): por POSIÇÃO. Em cada rodada, os jogos
// ordenados por data_hora alimentam, dois a dois, o slot da rodada seguinte. Slot sem
// linha em `matches` → "A definir".
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

// Ordena por data_hora asc; sem data vai pro fim. Desempate por id pra ser estável.
function ordenarJogos(jogos) {
  return [...jogos].sort((a, b) => {
    const ta = a.data_hora ? new Date(a.data_hora).getTime() : Infinity
    const tb = b.data_hora ? new Date(b.data_hora).getTime() : Infinity
    if (ta !== tb) return ta - tb
    return (a.id ?? 0) - (b.id ?? 0)
  })
}

// Monta { rodadas: [{fase, jogos:[match|null,...]}], terceiro: match|null }.
// Cada rodada tem exatamente `slots` posições; faltando jogo, fica null (A definir).
export function montarBracket(matchesMata) {
  const porFase = new Map()
  for (const m of matchesMata) {
    if (!porFase.has(m.fase)) porFase.set(m.fase, [])
    porFase.get(m.fase).push(m)
  }
  const rodadas = FASES_MATA.map((f) => {
    const jogos = ordenarJogos(porFase.get(f.id) ?? [])
    const slots = Array.from({ length: f.slots }, (_, i) => jogos[i] ?? null)
    return { fase: f.id, jogos: slots }
  })
  const terceiro = (porFase.get('terceiro') ?? [])[0] ?? null
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
  if (estado === 'agendado') return { chave: 'aguardando', estilo: ESTILO.aguardando, pontos: null }
  return { chave: 'adefinir', estilo: ESTILO.adefinir, pontos: null }
}

// Quem venceu um jogo encerrado: 'casa' | 'fora' | 'empate' | null.
export function vencedor(match) {
  if (!match || match.gols_casa == null || match.gols_fora == null) return null
  if (match.gols_casa > match.gols_fora) return 'casa'
  if (match.gols_casa < match.gols_fora) return 'fora'
  return 'empate'
}
