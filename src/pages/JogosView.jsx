import { useState } from 'react'
import { useTorneio } from '../context/TorneioContext'
import Jogos from './Jogos'
import Chaveamento from './Chaveamento'
import Tabela from './Tabela'

// Tela de jogos do torneio da rota: Lista + uma SEGUNDA VISÃO que depende do formato
// do campeonato.
//
//   mata-mata (Copa)       → Chaveamento, a árvore do mata-mata
//   pontos corridos (liga) → Tabela, a classificação do returno
//
// Não é a mesma tela com nome diferente: liga não tem árvore, e mata-mata não tem
// classificação corrida. Por isso a segunda visão vem do formato, não de um `if` de
// slug espalhado.
const SEGUNDA_VISAO = {
  'mata-mata': { rotulo: 'Chaveamento', Componente: Chaveamento, largo: true },
  'pontos-corridos': { rotulo: 'Tabela', Componente: Tabela, largo: false },
}

export default function JogosView() {
  const { formato } = useTorneio()
  const [view, setView] = useState('lista')

  const segunda = SEGUNDA_VISAO[formato]
  const naSegunda = Boolean(segunda) && view === 'segunda'

  // Formato sem segunda visão cadastrada: sobra a Lista, sem toggle órfão.
  if (!segunda) return <Jogos />

  // O Chaveamento é uma tela densa e larga, com fundo próprio; a Tabela é estreita
  // como a Lista. Daí o container variar.
  const fundoLargo = naSegunda && segunda.largo

  return (
    <div className={fundoLargo ? 'bg-chave-bg min-h-[calc(100svh-4rem)]' : ''}>
      <div className={`mx-auto px-4 pt-6 ${fundoLargo ? 'max-w-[1120px]' : 'max-w-[720px]'}`}>
        <Toggle rotulo={segunda.rotulo} view={view} setView={setView} />
      </div>

      {naSegunda ? (
        <main
          className={`mx-auto px-4 pt-5 pb-12 ${segunda.largo ? 'max-w-[1120px]' : 'max-w-[720px]'}`}
        >
          <segunda.Componente />
        </main>
      ) : (
        <Jogos />
      )}
    </div>
  )
}

// Segmentado Lista ⇄ (Chaveamento | Tabela). Ativo = pílula escura (SPEC §1).
function Toggle({ rotulo, view, setView }) {
  return (
    <div className="grid grid-cols-2 gap-1 p-1 rounded-[13px] bg-chave-borda w-full max-w-[480px] mx-auto">
      <Seg ativo={view === 'lista'} onClick={() => setView('lista')}>
        Lista
      </Seg>
      <Seg ativo={view === 'segunda'} onClick={() => setView('segunda')}>
        {rotulo}
      </Seg>
    </div>
  )
}

function Seg({ ativo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-[10px] py-2.5 text-sm font-extrabold transition-colors ${
        ativo ? 'bg-chave-ink text-white shadow-sm' : 'text-chave-sec hover:text-chave-ink'
      }`}
    >
      {children}
    </button>
  )
}
