// Horário relativo curto em pt-BR ("agora", "há 5 min", "há 3 h", "há 2 dias").
// Acima de 7 dias cai pra data curta (dd/mm) no fuso de Brasília.
const fmtData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

export function tempoRelativo(iso, agora = Date.now()) {
  const ms = agora - new Date(iso).getTime()
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return 'agora'
  const min = Math.floor(s / 60)
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
  return fmtData.format(new Date(iso))
}
