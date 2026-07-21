// Classificação DO RETURNO — calculada no front, a partir dos jogos já carregados.
//
// ⚠️ NÃO É A CLASSIFICAÇÃO OFICIAL DO BRASILEIRÃO, e a tela precisa dizer isso.
// O app só tem as rodadas 20 a 38: as rodadas 1–19 não existem no banco, então os
// pontos do turno inteiro estão de fora. É a classificação do RETURNO, montada só
// com os jogos que o bolão acompanha. Apresentar como oficial seria mentira — um
// time pode ser líder aqui e estar no meio da tabela de verdade.
//
// Nada disso vira tabela, view ou função no banco: é derivação pura do que já veio
// pra tela, então recalcula sozinho quando um placar é lançado.

const VITORIA = 3
const EMPATE = 1

// Só jogo COM placar lançado entra na conta (gols_casa/gols_fora não nulos) —
// partida futura ou sem resultado não movimenta ponto nenhum.
function temResultado(m) {
  return m.gols_casa !== null && m.gols_fora !== null
}

// Devolve a lista ordenada: [{ time, pontos, jogos, vitorias, empates, derrotas }].
//
// TODOS os times que aparecem na tabela de jogos entram, mesmo com 0 partidas
// disputadas — a lista sai dos confrontos cadastrados, não só de quem já jogou,
// senão a tabela nasceria vazia e ninguém entenderia por quê.
export function classificacaoDoReturno(matches) {
  const porTime = new Map()
  const garante = (time) => {
    if (!porTime.has(time)) {
      porTime.set(time, {
        time,
        pontos: 0,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
      })
    }
    return porTime.get(time)
  }

  for (const m of matches ?? []) {
    const casa = garante(m.time_casa)
    const fora = garante(m.time_fora)
    if (!temResultado(m)) continue

    casa.jogos += 1
    fora.jogos += 1

    if (m.gols_casa > m.gols_fora) {
      casa.vitorias += 1
      casa.pontos += VITORIA
      fora.derrotas += 1
    } else if (m.gols_casa < m.gols_fora) {
      fora.vitorias += 1
      fora.pontos += VITORIA
      casa.derrotas += 1
    } else {
      casa.empates += 1
      fora.empates += 1
      casa.pontos += EMPATE
      fora.pontos += EMPATE
    }
  }

  // Desempate: pontos, vitórias, nome. Sem saldo de gols de propósito — a tabela
  // mostra só P/J/V, e critério invisível ao usuário confunde mais que ajuda.
  return [...porTime.values()].sort(
    (a, b) =>
      b.pontos - a.pontos ||
      b.vitorias - a.vitorias ||
      a.time.localeCompare(b.time, 'pt-BR'),
  )
}

// Nenhum jogo pontuado ainda (a rodada 20 não começou). A tela troca a tabela morta
// por um aviso em vez de mostrar vinte linhas de zero sem explicação.
export function returnoNaoComecou(linhas) {
  return linhas.length > 0 && linhas.every((l) => l.jogos === 0)
}
