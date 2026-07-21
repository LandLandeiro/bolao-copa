import { useTorneio } from '../context/TorneioContext'
import { SLUG_COPA } from '../lib/torneios'
import Bandeira from './Bandeira'
import EscudoTime from './EscudoTime'

// O símbolo de um time — bandeira ou escudo — decidido pelo TORNEIO, não por quem
// chama. A Copa é de seleções (bandeira do país); o Brasileirão é de clubes (escudo).
// Mesmo slot, mesmo tamanho nos dois, então trocar um pelo outro não mexe no layout.
//
// Existe pra a decisão ficar em UM lugar: sem isto, cada tela que mostra um time
// (card, modal de palpites, confronto) repetiria o mesmo `if` — e uma delas ia
// esquecer, mostrando bandeira pra clube brasileiro.
export default function MarcaTime({ time, size = 44 }) {
  const { slug } = useTorneio()

  if (slug === SLUG_COPA) return <Bandeira time={time} size={size} />
  return <EscudoTime nome={time} tamanho={size} />
}
