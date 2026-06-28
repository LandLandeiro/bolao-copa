import Bandeira from '../Bandeira'
import { siglaTime } from '../../lib/grupos'
import { FASES_MATA, estadoJogo, resultadoPalpite, vencedor } from '../../lib/bracket'

// Card de um confronto do chaveamento. Duas densidades (SPEC §5):
//  • variante "grande": placar 46×52 + nomes + rodapé de palpite (≤2 rodadas, col≥250)
//  • variante "compacto": sigla + bandeira + borda esq. colorida + bolinha (3+ rodadas)
// Tudo derivado de (match, palpite); estados em SPEC §7.

const fmtData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo',
})
const fmtHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
})
const dataHora = (iso) => `${fmtData.format(new Date(iso))} · ${fmtHora.format(new Date(iso))}`

const labelFase = (fase) =>
  fase === 'terceiro' ? '3º lugar' : FASES_MATA.find((f) => f.id === fase)?.col ?? fase

export default function CardChave({ match, palpite, fase, variante = 'grande', onEditar }) {
  const estado = estadoJogo(match)
  return variante === 'compacto' ? (
    <Compacto match={match} palpite={palpite} estado={estado} />
  ) : (
    <Grande match={match} palpite={palpite} fase={fase} estado={estado} onEditar={onEditar} />
  )
}

// ---------- Card grande ----------
function Grande({ match, palpite, fase, estado, onEditar }) {
  const venc = vencedor(match)
  return (
    <article className="bg-white rounded-[18px] border border-chave-borda shadow-[0_2px_6px_rgba(20,18,12,0.05)] p-[15px] flex flex-col gap-3">
      {/* Cabeçalho: pill da rodada + status */}
      <header className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center px-2 py-1 rounded-pill bg-chave-ink text-white text-[10px] font-extrabold uppercase tracking-wide leading-none">
          {labelFase(fase)}
        </span>
        <Status match={match} estado={estado} />
      </header>

      {/* Corpo: time casa | placar × placar | time fora */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2">
        <TimeGrande time={match?.time_casa} esmaecido={estado === 'encerrado' && venc === 'fora'} bold={venc === 'casa'} lado="casa" />
        <CaixaPlacar valor={match?.gols_casa} vencedor={venc === 'casa'} perdedor={estado === 'encerrado' && venc === 'fora'} />
        <span className="text-chave-sec text-base font-bold px-0.5">×</span>
        <CaixaPlacar valor={match?.gols_fora} vencedor={venc === 'fora'} perdedor={estado === 'encerrado' && venc === 'casa'} />
        <TimeGrande time={match?.time_fora} esmaecido={estado === 'encerrado' && venc === 'casa'} bold={venc === 'fora'} lado="fora" />
      </div>

      {/* Rodapé de palpite (linha tracejada) */}
      {estado !== 'adefinir' && (
        <RodapePalpite match={match} palpite={palpite} estado={estado} onEditar={onEditar} />
      )}
    </article>
  )
}

function TimeGrande({ time, esmaecido, bold, lado }) {
  const adefinir = !time
  return (
    <div className={`flex items-center gap-2 min-w-0 ${lado === 'fora' ? 'justify-end flex-row-reverse' : ''}`}>
      {adefinir ? (
        <span className="w-[30px] h-[30px] rounded-md bg-chave-placar shrink-0" aria-hidden="true" />
      ) : (
        <Bandeira time={time} size={30} />
      )}
      <span
        className={`truncate text-[12.5px] leading-tight ${
          adefinir ? 'text-chave-ph' : esmaecido ? 'text-chave-ph opacity-50' : 'text-chave-ink'
        } ${bold ? 'font-extrabold' : 'font-bold'}`}
      >
        {time ?? 'A definir'}
      </span>
    </div>
  )
}

function CaixaPlacar({ valor, vencedor, perdedor }) {
  const temValor = valor != null
  const cor = vencedor
    ? 'bg-chave-venc text-chave-verde'
    : perdedor
    ? 'bg-chave-placar text-chave-ph opacity-50'
    : 'bg-chave-placar text-chave-ink'
  return (
    <span className={`w-[46px] h-[52px] rounded-[12px] flex items-center justify-center font-extrabold text-[26px] tabular-nums leading-none ${cor}`}>
      {temValor ? valor : ''}
    </span>
  )
}

// ---------- Card compacto ----------
function Compacto({ match, palpite, estado }) {
  const venc = vencedor(match)
  const res = resultadoPalpite(match, palpite)
  const mostrarDot = res.pontos != null
  return (
    <div className={`relative bg-white rounded-[9px] border border-chave-borda border-l-4 ${res.estilo.borda} ${res.chave === 'aovivo' ? 'animate-pulse' : ''} px-1 py-1.5 flex flex-col gap-1`}>
      {mostrarDot && (
        <span className={`absolute -top-[7px] -right-[6px] min-w-[20px] h-[20px] px-1 rounded-pill flex items-center justify-center text-[10px] font-black leading-none ${res.estilo.dot}`}>
          +{res.pontos}
        </span>
      )}
      <LinhaCompacta time={match?.time_casa} valor={match?.gols_casa} vencedor={venc === 'casa'} perdedor={estado === 'encerrado' && venc === 'fora'} />
      <LinhaCompacta time={match?.time_fora} valor={match?.gols_fora} vencedor={venc === 'fora'} perdedor={estado === 'encerrado' && venc === 'casa'} />
    </div>
  )
}

function LinhaCompacta({ time, valor, vencedor, perdedor }) {
  const adefinir = !time
  return (
    <div className="flex items-center gap-[3px] min-w-0">
      {adefinir ? (
        <span className="w-[14px] h-[14px] rounded-[3px] bg-chave-placar shrink-0" aria-hidden="true" />
      ) : (
        <Bandeira time={time} size={14} />
      )}
      <span className={`flex-1 min-w-0 text-[12.5px] leading-none overflow-hidden whitespace-nowrap ${adefinir ? 'text-chave-ph' : perdedor ? 'text-chave-ph opacity-50' : vencedor ? 'text-chave-verde' : 'text-chave-ink'} ${vencedor ? 'font-extrabold' : 'font-bold'}`}>
        {adefinir ? '—' : siglaTime(time)}
      </span>
      <span className={`shrink-0 text-[13px] font-extrabold tabular-nums leading-none ${perdedor ? 'text-chave-ph opacity-50' : vencedor ? 'text-chave-verde' : 'text-chave-ink'}`}>
        {valor != null ? valor : ''}
      </span>
    </div>
  )
}

// ---------- Status (cabeçalho do card grande) ----------
function Status({ match, estado }) {
  if (estado === 'encerrado')
    return <span className="text-[11px] font-extrabold uppercase tracking-wide text-chave-sec">Encerrado</span>
  if (estado === 'aovivo')
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-chave-live">
        <span className="w-1.5 h-1.5 rounded-pill bg-chave-live animate-pulse" aria-hidden="true" />
        Ao vivo
      </span>
    )
  if (estado === 'agendado')
    return <span className="text-[11px] font-extrabold uppercase tracking-wide text-chave-sec tabular-nums">{dataHora(match.data_hora)}</span>
  return <span className="text-[11px] font-extrabold uppercase tracking-wide text-chave-label">A definir</span>
}

// ---------- Rodapé de palpite (card grande) ----------
function RodapePalpite({ match, palpite, estado, onEditar }) {
  const temPalpite = palpite && palpite.palpite_casa != null && palpite.palpite_fora != null
  const res = resultadoPalpite(match, palpite)

  // Rodada futura sem palpite → CTA (SPEC §7).
  if (estado === 'agendado' && !temPalpite) {
    return (
      <div className="pt-3 border-t border-dashed border-chave-borda">
        <button
          type="button"
          onClick={() => onEditar?.(match)}
          className="text-[14px] font-extrabold text-chave-verde hover:text-chave-verdedark"
        >
          atualizar palpite
        </button>
      </div>
    )
  }

  const label =
    estado === 'aovivo' ? 'Palpite parcial' : 'Seu palpite'

  return (
    <div className="pt-3 border-t border-dashed border-chave-borda flex items-center justify-between gap-2">
      {temPalpite ? (
        <span className="text-[11px] font-bold text-chave-sec">
          {label}{' '}
          <span className="text-[13px] font-extrabold text-chave-ink tabular-nums">
            {palpite.palpite_casa}–{palpite.palpite_fora}
          </span>
        </span>
      ) : (
        <span className="text-[11px] font-bold text-chave-ph">
          {estado === 'encerrado' ? 'sem palpite' : 'palpite em aberto'}
        </span>
      )}
      {temPalpite && res.estilo.chip && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-extrabold ${res.estilo.chip}`}>
          {res.estilo.rotulo}{res.pontos != null ? ` · +${res.pontos}` : ''}
        </span>
      )}
    </div>
  )
}
