import { useContext } from 'react'
import { TorneioContext } from '../context/TorneioContext'
import { SLUG_PADRAO } from '../lib/torneios'
import Loader from './Loader'
import LoaderBrasileirao from './LoaderBrasileirao'

// Loader DO TORNEIO DA ROTA: brasão com a bola girando no Brasileirão, spinner de
// sempre em qualquer outro torneio (a Copa não muda).
//
// Existe pra a escolha ficar num lugar só, em vez de cada tela repetir o mesmo `if`.
// Não é um segundo sistema de loading: os dois componentes compartilham o anti-flash
// (.blr-surge + useCarregamentoSuave) — ver Loader.jsx.
//
// Lê o contexto de forma TOLERANTE (useContext direto, sem o useTorneio que estoura):
// telas fora do provider — o guard de sessão, o próprio provider enquanto carrega —
// também mostram loader, e nessas não há torneio pra consultar. Sem torneio, spinner
// base.
//
// `size` mantém o nome da prop do <Loader/> pros call sites não mudarem de assinatura.
export default function LoaderTorneio({ size = 64, className = '' }) {
  const torneio = useContext(TorneioContext)

  if (torneio?.slug === SLUG_PADRAO) {
    return <LoaderBrasileirao tamanho={size} className={className} />
  }
  return <Loader size={size} className={className} />
}
