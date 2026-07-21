import { useEffect, useState } from 'react'
import { useTorneio } from '../context/TorneioContext'
import { carregarClassificacao } from '../lib/dados'
import MarcaTime from '../components/MarcaTime'
import EmptyPanel from '../components/EmptyPanel'
import LoaderTorneio from '../components/LoaderTorneio'
import { useCarregamentoSuave } from '../components/Loader'

// Tabela do campeonato — ocupa, no Brasileirão, o lugar do Chaveamento na Copa.
//
// ⚠️ A tela só LÊ e EXIBE. Os pontos vêm prontos da tabela `classificacao`, que a
// automação preenche com a classificação OFICIAL do campeonato inteiro. Nada é
// calculado aqui: somar 3/1/0 no front daria uma segunda fonte de verdade que ia
// divergir da oficial no primeiro caso de W.O., punição ou ponto perdido em
// tribunal. A ordem também vem do banco (`posicao`) — reordenar por pontos aqui
// seria recriar critério de desempate e brigar com a fonte.
//
// Universo diferente do resto do app, e isso é esperado: a classificação cobre o
// campeonato TODO, enquanto o bolão só acompanha as rodadas 20–38. Um time aparece
// aqui com mais jogos do que os que existem em `matches`.
const fmtAtualizado = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export default function Tabela() {
  const torneio = useTorneio()
  const [linhas, setLinhas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const carregandoSuave = useCarregamentoSuave(carregando)

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      setCarregando(true)
      setErro(null)
      const { data, error } = await carregarClassificacao(torneio.id)
      if (cancelado) return
      if (error) setErro(error.message)
      else setLinhas(data ?? [])
      setCarregando(false)
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [torneio.id])

  if (carregandoSuave) {
    return (
      <div className="py-16 flex justify-center">
        <LoaderTorneio />
      </div>
    )
  }

  if (erro) {
    return <p className="text-vermelho py-8">Não consegui carregar a tabela: {erro}</p>
  }

  // Vazia = a automação ainda não rodou. Melhor dizer isso do que exibir uma tabela
  // morta e deixar a pessoa achando que o campeonato não começou.
  if (linhas.length === 0) {
    return (
      <section className="space-y-4">
        <Cabecalho atualizadoEm={null} />
        <EmptyPanel
          titulo="CLASSIFICAÇÃO AINDA NÃO CARREGADA"
          mensagem="A tabela do campeonato entra assim que a atualização rodar."
        />
      </section>
    )
  }

  // Todas as linhas trazem o mesmo carimbo; basta olhar a primeira.
  const atualizadoEm = linhas[0]?.atualizado_em ?? null

  return (
    <section className="space-y-4">
      <Cabecalho atualizadoEm={atualizadoEm} />

      {/* `table-fixed` + larguras enxutas: em 390px são 5 colunas, e sem largura
          fixa a coluna do nome empurraria os números pra fora da tela. */}
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">
          Classificação do campeonato: posição, time, pontos, jogos e vitórias
        </caption>
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-slate">
            <th scope="col" className="w-7 py-2 font-semibold">
              #
            </th>
            <th scope="col" className="py-2 font-semibold">
              Time
            </th>
            {/* Abreviado por caber no mobile, com o nome inteiro em sr-only pra quem
                usa leitor de tela ou não conhece a sigla. */}
            <Coluna sigla="P" nome="Pontos" />
            <Coluna sigla="J" nome="Jogos" />
            <Coluna sigla="V" nome="Vitórias" />
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.time} className="border-t border-line align-middle">
              <td className="py-2 tnum text-sm text-slate">{l.posicao}</td>
              <td className="py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MarcaTime time={l.time} size={24} />
                  <span className="text-sm text-ink truncate">{l.time}</span>
                </div>
              </td>
              <td className="py-2 text-center tnum text-sm font-bold text-ink">
                {l.pontos}
              </td>
              <td className="py-2 text-center tnum text-sm text-slate">{l.jogos}</td>
              <td className="py-2 text-center tnum text-sm text-slate">{l.vitorias}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Cabecalho({ atualizadoEm }) {
  return (
    <header>
      <h1 className="font-display text-3xl sm:text-4xl tracking-tight">TABELA</h1>
      <p className="mt-1 text-slate text-sm">
        Classificação oficial do campeonato.
        {atualizadoEm && (
          <>
            {' '}
            <span className="tnum">
              Atualizada em {fmtAtualizado.format(new Date(atualizadoEm))}
            </span>
            .
          </>
        )}
      </p>
    </header>
  )
}

function Coluna({ sigla, nome }) {
  return (
    <th scope="col" className="w-9 py-2 text-center font-semibold" title={nome}>
      <span aria-hidden="true">{sigla}</span>
      <span className="sr-only">{nome}</span>
    </th>
  )
}
