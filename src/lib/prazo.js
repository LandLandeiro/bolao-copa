// Prazo do palpite — quando um jogo fecha.
//
// ⚠️ ESPELHO da função palpite_aberto(p_match_id) do banco. Quem REALMENTE recusa a
// escrita é a RLS (que chama essa função); aqui é só UX, pra a tela não oferecer um
// input que o Postgres vai rejeitar. Mudou a regra lá? Mude aqui junto.
//
//   jogo COM data  → aberto enquanto data_hora > agora            (regra de sempre)
//   jogo SEM data  → aberto enquanto o MENOR data_hora da rodada > agora
//                    (a CBF ainda não marcou; o prazo vira o início da rodada)
//   rodada inteira sem data → segue aberto ('infinity' no banco)
const TZ = 'America/Sao_Paulo'

// Prazo da rodada = menor data_hora NÃO-NULA entre os jogos dela. Recebe os jogos já
// carregados (nada de query nova). Devolve ms, ou null quando ninguém tem data.
export function prazoDaRodada(jogos) {
  const datas = (jogos ?? [])
    .map((m) => m.data_hora)
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
  return datas.length ? Math.min(...datas) : null
}

// O palpite deste jogo ainda está aberto? `prazoRodada` só é consultado quando o
// jogo não tem data (jogo com data se resolve sozinho).
export function palpiteAberto(match, prazoRodada, agora = Date.now()) {
  if (match.data_hora) return new Date(match.data_hora).getTime() > agora
  if (prazoRodada == null) return true // rodada inteira sem data → segue aberto
  return prazoRodada > agora
}

// Ordena jogos por horário com NULLS LAST: os "a definir" caem no fim da rodada
// (mesma ordem que o .order(...) do banco devolve).
export function ordemPorData(a, b) {
  if (!a.data_hora && !b.data_hora) return 0
  if (!a.data_hora) return 1
  if (!b.data_hora) return -1
  return new Date(a.data_hora) - new Date(b.data_hora)
}

// "qua 29/07, 19h30" — dia da semana + data + hora, sempre em Brasília.
const fmtPrazo = new Intl.DateTimeFormat('pt-BR', {
  timeZone: TZ,
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatarPrazo(ms) {
  if (ms == null) return null
  const p = Object.fromEntries(
    fmtPrazo.formatToParts(new Date(ms)).map((x) => [x.type, x.value]),
  )
  const dia = p.weekday.replace('.', '') // "qua." → "qua"
  const hora = p.minute === '00' ? `${p.hour}h` : `${p.hour}h${p.minute}`
  return `${dia} ${p.day}/${p.month}, ${hora}`
}
