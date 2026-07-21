import { createContext, useContext, useEffect, useState } from 'react'
import { carregarTorneio } from '../lib/dados'
import { formatoDoTorneio } from '../lib/torneios'
import { skinDoTorneio } from '../lib/skin'
import Loader, { useCarregamentoSuave } from '../components/Loader'

// Contexto de TORNEIO — fonte única do "qual bolão estou vendo".
//
// Quem monta o provider é a rota (ver App.jsx): "/" abre o torneio ativo
// (Brasileirão) e "/copadomundo2026" abre a Copa arquivada. As MESMAS telas
// renderizam nos dois — o que muda é o torneio que vem daqui.
//
// Toda query de jogos/palpites/ranking passa pelo escopo exposto aqui. As funções
// de lib/dados.js EXIGEM esse escopo (estouram sem ele), então esquecer de filtrar
// vira erro na hora, não um ranking misturando Copa com Brasileirão.
// Exportado pro <LoaderTorneio/> poder ler o contexto de forma TOLERANTE (useContext
// direto), já que ele também renderiza fora do provider. Fora esse caso, use os hooks
// abaixo — ninguém mais deve tocar no contexto cru.
//
// ⚠️ Este módulo importa o <Loader/> BASE de propósito: enquanto o torneio carrega
// ainda não se sabe qual é, e importar o LoaderTorneio aqui faria import circular.
export const TorneioContext = createContext(null)

export function TorneioProvider({ slug, base = '', children }) {
  const [torneio, setTorneio] = useState(null)
  const [erro, setErro] = useState(null)
  const carregandoSuave = useCarregamentoSuave(!torneio)

  useEffect(() => {
    let cancelado = false
    setTorneio(null)
    setErro(null)
    async function carregar() {
      const { data, error } = await carregarTorneio(slug)
      if (cancelado) return
      if (error) return setErro(error.message)
      if (!data) return setErro(`Torneio "${slug}" não existe.`)
      setTorneio({
        id: data.id,
        slug: data.slug,
        nome: data.nome,
        encerrado: data.encerrado === true,
        // `formato` não vem do banco — é derivado do slug (ver lib/torneios.js).
        formato: formatoDoTorneio(data.slug),
        // Prefixo de rota do torneio ('' na raiz, '/copadomundo2026' na Copa).
        // Os links das telas montam a URL a partir daqui pra não sair do torneio.
        base,
      })
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [slug, base])

  if (erro) {
    return (
      <main className="max-w-[880px] mx-auto px-4 py-16">
        <p className="text-vermelho">Não consegui carregar o torneio: {erro}</p>
      </main>
    )
  }

  // Segura a árvore até o torneio existir: assim nenhuma tela filha roda uma query
  // sem escopo (e ninguém precisa tratar `torneio == null`).
  if (carregandoSuave) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <Loader size={72} />
      </div>
    )
  }

  return <TorneioContext.Provider value={torneio}>{children}</TorneioContext.Provider>
}

export function useTorneio() {
  const ctx = useContext(TorneioContext)
  if (!ctx) throw new Error('useTorneio precisa estar dentro de <TorneioProvider>')
  return ctx
}

// Skin do torneio da rota, sem precisar passar prop. Tolera ficar FORA do provider
// (Login, gate de escolher nome, /dev/escudos) devolvendo o visual base — essas
// telas existem antes de haver torneio, e não podem quebrar por causa disso.
export function useSkin() {
  return skinDoTorneio(useContext(TorneioContext)?.slug)
}

// Monta uma URL DENTRO do torneio atual: rota('/ranking') → '/ranking' no torneio
// ativo e '/copadomundo2026/ranking' na Copa. Use sempre que criar um <Link>.
export function useRotaTorneio() {
  const { base } = useTorneio()
  return (caminho = '/') => {
    if (caminho === '/') return base || '/'
    return `${base}${caminho}`
  }
}
