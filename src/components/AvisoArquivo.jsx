import { useTorneio } from '../context/TorneioContext'

// Faixa fina de "somente leitura", só na rota de um torneio encerrado. É o único
// resto da antiga barra de troca de torneio: a troca virou o seletor do título
// (ver SeletorTorneio), e aqui ficou apenas o aviso.
//
// É UX. Quem realmente recusa a escrita é a RLS: o Postgres só aceita palpite
// enquanto palpite_aberto(match) for true, e os jogos da Copa já passaram.
export default function AvisoArquivo() {
  const { encerrado } = useTorneio()
  if (!encerrado) return null

  return (
    <div className="border-b border-line bg-cloud">
      <div className="max-w-[880px] mx-auto px-4 py-2 flex justify-center sm:justify-start">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-line text-slate text-[11px] font-bold uppercase tracking-wider">
          <IconeCadeado />
          Torneio encerrado · somente leitura
        </span>
      </div>
    </div>
  )
}

function IconeCadeado() {
  return (
    <svg viewBox="0 0 20 20" className="w-3 h-3" fill="currentColor" aria-hidden="true">
      <path d="M10 2a3.5 3.5 0 0 0-3.5 3.5V8H6a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 6 17h8a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 14 8h-.5V5.5A3.5 3.5 0 0 0 10 2Zm2 6H8V5.5a2 2 0 1 1 4 0V8Z" />
    </svg>
  )
}
