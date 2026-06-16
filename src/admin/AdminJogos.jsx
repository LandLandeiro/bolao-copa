import Jogos from '../pages/Jogos'
import AdminMatchCard from './AdminMatchCard'

// REUSO: a tela de Jogos do app (fetch + agrupamento por dia + acordeão) com o
// card trocado pelo AdminMatchCard (MatchCard + editor de placar). Não duplica
// nada da listagem.
export default function AdminJogos() {
  return (
    <Jogos
      titulo="ADMIN · JOGOS"
      subtitulo="Lance ou edite o placar oficial de cada jogo. O placar recalcula a pontuação de todos."
      renderCard={(m, { palpite, onSaved, recarregarMatches }) => (
        <AdminMatchCard
          match={m}
          palpite={palpite}
          onSaved={onSaved}
          onPlacarSalvo={recarregarMatches}
        />
      )}
    />
  )
}
