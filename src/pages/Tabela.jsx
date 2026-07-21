import { useEffect, useMemo, useState } from 'react'
import { useTorneio } from '../context/TorneioContext'
import { carregarMatches } from '../lib/dados'
import { classificacaoDoReturno, returnoNaoComecou } from '../lib/tabela'
import MarcaTime from '../components/MarcaTime'
import EmptyPanel from '../components/EmptyPanel'
import LoaderTorneio from '../components/LoaderTorneio'
import { useCarregamentoSuave } from '../components/Loader'

// Tabela do returno — ocupa, no Brasileirão, o lugar que o Chaveamento ocupa na Copa.
//
// ⚠️ NÃO é a classificação oficial: o app só tem as rodadas 20–38. Ver lib/tabela.js.
// O subtítulo diz isso na cara, e não por acaso.
export default function Tabela() {
  const torneio = useTorneio()
  const [matches, setMatches] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const carregandoSuave = useCarregamentoSuave(carregando)

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      setCarregando(true)
      setErro(null)
      const { data, error } = await carregarMatches(torneio.id)
      if (cancelado) return
      if (error) setErro(error.message)
      else setMatches(data ?? [])
      setCarregando(false)
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [torneio.id])

  const linhas = useMemo(() => classificacaoDoReturno(matches), [matches])
  const naoComecou = returnoNaoComecou(linhas)

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

  if (linhas.length === 0) {
    return (
      <EmptyPanel
        titulo="AINDA SEM TABELA"
        mensagem="Espera o admin cadastrar os jogos do returno."
      />
    )
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight">TABELA</h1>
        {/* A ressalva é a informação mais importante desta tela. */}
        <p className="mt-1 text-slate text-sm">
          Classificação do returno — só os jogos do bolão (rodadas 20 a 38). Não é a
          tabela oficial do campeonato.
        </p>
      </header>

      {naoComecou && (
        <p className="rounded-lg border border-line bg-cloud px-4 py-3 text-sm text-ink">
          A rodada 20 ainda não começou — por isso todo mundo está zerado.
        </p>
      )}

      {/* `table-fixed` + larguras enxutas: em 390px são 5 colunas, e sem largura
          fixa a coluna do nome empurraria os números pra fora da tela. */}
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">
          Classificação do returno: posição, time, pontos, jogos e vitórias
        </caption>
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-slate">
            <th scope="col" className="w-7 py-2 font-semibold">
              #
            </th>
            <th scope="col" className="py-2 font-semibold">
              Time
            </th>
            {/* Abreviado por caber, com o nome inteiro no title/sr-only pra quem usa
                leitor de tela ou não conhece a sigla. */}
            <Coluna sigla="P" nome="Pontos" />
            <Coluna sigla="J" nome="Jogos" />
            <Coluna sigla="V" nome="Vitórias" />
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr
              key={l.time}
              className="border-t border-line align-middle"
            >
              <td className="py-2 tnum text-sm text-slate">{i + 1}</td>
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

function Coluna({ sigla, nome }) {
  return (
    <th scope="col" className="w-9 py-2 text-center font-semibold" title={nome}>
      <span aria-hidden="true">{sigla}</span>
      <span className="sr-only">{nome}</span>
    </th>
  )
}
