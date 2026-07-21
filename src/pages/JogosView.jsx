import { useState } from 'react'
import { useTorneio } from '../context/TorneioContext'
import Jogos from './Jogos'
import Chaveamento from './Chaveamento'

// Tela de jogos do torneio da rota — alterna entre a Lista (Jogos) e o Chaveamento
// (bracket do mata-mata) por um toggle no topo. O seletor de fases pertence só ao
// Chaveamento (SPEC §9).
//
// O Chaveamento só existe em torneio de mata-mata: numa liga de pontos corridos não
// há árvore pra desenhar, então o toggle some e sobra a Lista.
export default function JogosView() {
  const { formato } = useTorneio()
  const temChaveamento = formato === 'mata-mata'
  const [view, setView] = useState('lista')
  const chave = temChaveamento && view === 'chaveamento'

  if (!temChaveamento) return <Jogos />

  return (
    <div className={chave ? 'bg-chave-bg min-h-[calc(100vh-4rem)]' : ''}>
      <div className={`mx-auto px-4 pt-6 ${chave ? 'max-w-[1120px]' : 'max-w-[720px]'}`}>
        <Toggle view={view} setView={setView} />
      </div>

      {chave ? (
        <main className="max-w-[1120px] mx-auto px-4 pt-5 pb-12">
          <Chaveamento />
        </main>
      ) : (
        <Jogos />
      )}
    </div>
  )
}

// Segmentado Lista ⇄ Chaveamento. Ativo = pílula escura (SPEC §1).
function Toggle({ view, setView }) {
  return (
    <div className="grid grid-cols-2 gap-1 p-1 rounded-[13px] bg-chave-borda w-full max-w-[480px] mx-auto">
      <Seg ativo={view === 'lista'} onClick={() => setView('lista')}>
        Lista
      </Seg>
      <Seg ativo={view === 'chaveamento'} onClick={() => setView('chaveamento')}>
        Chaveamento
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
