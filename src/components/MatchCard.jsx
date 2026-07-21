import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTorneio } from '../context/TorneioContext'
import { rotuloRodadaBadge, temBadgeDeFase } from '../lib/fases'
import { salvarPalpite, sanitizarPlacar } from '../lib/palpite'
import { calcularPontos, chipDePontos } from '../lib/pontos'
import { palpiteAberto, formatarPrazo } from '../lib/prazo'
import { SLUG_COPA } from '../lib/torneios'
import { CAZETV_URL } from '../lib/constants'
import Bandeira from './Bandeira'

// Janela do botão "Assistir na CazéTV" (em minutos).
const UM_MINUTO = 60 * 1000
const ANTECEDENCIA_MIN = 15 // aparece 15 min antes do início
const DURACAO_ESTIMADA_MIN = 150 // fim estimado (2h30 cobre prorrogação/pênaltis no mata-mata)

// Formatador de data/hora em horário de Brasília (independe do fuso do device).
const fmtData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Sao_Paulo',
})
const fmtHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

function formatarDataHora(iso) {
  const d = new Date(iso)
  return `${fmtData.format(d)} · ${fmtHora.format(d)}`
}

// `prazoRodada` (ms): início da rodada, pros jogos SEM data marcada. Vem da tela de
// Jogos, calculado a partir dos jogos já carregados daquela rodada.
export default function MatchCard({ match, palpite, onSaved, prazoRodada = null }) {
  const { user } = useAuth()
  const torneio = useTorneio()

  // Uma única referência de tempo pro card inteiro (mesmo "agora" e início).
  const agora = Date.now()
  // Jogo sem data marcada (CBF ainda não definiu): `inicio` é null e NADA que
  // dependa de horário pode rodar — nem Intl, nem "ao vivo", nem CazéTV.
  const inicio = match.data_hora ? new Date(match.data_hora).getTime() : null
  const semData = inicio === null
  const encerrado = match.gols_casa !== null && match.gols_fora !== null

  // Espelho de palpite_aberto() do banco (ver lib/prazo.js) + o modo arquivo.
  // Isto é UX: quem recusa a escrita de fato é a RLS.
  const somenteLeitura = torneio.encerrado
  const aberto = !somenteLeitura && palpiteAberto(match, prazoRodada, agora)
  const trancado = !aberto

  // Por que está trancado — o card diz, em vez de só mostrar "trancado".
  const motivoTravado = somenteLeitura
    ? 'torneio encerrado'
    : semData
    ? 'rodada já começou'
    : 'trancado'

  // "Assistir na CazéTV": de 15 min antes do início até o jogo acabar — ou seja,
  // até sair o resultado OU passar o fim estimado. "ao vivo" = já começou e ainda
  // não acabou. Sem data marcada não dá pra saber nada disso — some tudo.
  //
  // SÓ NA COPA: a CazéTV transmitiu a Copa inteira, então um link fixo servia pra
  // qualquer jogo. No Brasileirão a transmissão muda de jogo pra jogo (Globo,
  // Premiere, SporTV, Prime, Record) — link fixo mandaria a pessoa pro lugar errado.
  // Enquanto não houver emissora por jogo no banco, o botão não aparece na liga.
  const temTransmissaoFixa = torneio.slug === SLUG_COPA
  const jogoAcabou =
    encerrado || (!semData && agora >= inicio + DURACAO_ESTIMADA_MIN * UM_MINUTO)
  const aoVivo = !semData && inicio <= agora && !jogoAcabou
  const mostrarCaze =
    temTransmissaoFixa &&
    !semData &&
    agora >= inicio - ANTECEDENCIA_MIN * UM_MINUTO &&
    !jogoAcabou

  // Estado local dos inputs — começa com o palpite salvo (ou vazio).
  const [casa, setCasa] = useState(
    palpite?.palpite_casa != null ? String(palpite.palpite_casa) : '',
  )
  const [fora, setFora] = useState(
    palpite?.palpite_fora != null ? String(palpite.palpite_fora) : '',
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [okMsg, setOkMsg] = useState(null)

  const pontos =
    encerrado && palpite?.palpite_casa != null && palpite?.palpite_fora != null
      ? calcularPontos(
          palpite.palpite_casa,
          palpite.palpite_fora,
          match.gols_casa,
          match.gols_fora,
        )
      : null
  const chip = chipDePontos(pontos)
  const temPalpite =
    palpite?.palpite_casa != null && palpite?.palpite_fora != null

  async function salvar(e) {
    e.preventDefault()
    if (!user) return
    if (casa === '' || fora === '') {
      setErro('Coloque os dois placares.')
      return
    }
    setSalvando(true)
    setErro(null)
    setOkMsg(null)

    const { error, ehTrava } = await salvarPalpite({
      userId: user.id,
      matchId: match.id,
      palpiteCasa: Number(casa),
      palpiteFora: Number(fora),
    })

    setSalvando(false)

    if (error) {
      // A RLS (via palpite_aberto) recusou: ou o jogo começou, ou — em jogo sem
      // data — a rodada começou. Mostra o motivo certo pros dois casos.
      setErro(
        ehTrava
          ? semData
            ? 'A rodada já começou — palpite trancado.'
            : 'O jogo já começou — palpite trancado.'
          : `Não consegui salvar: ${error.message}`,
      )
      return
    }

    setOkMsg('palpite salvo!')
    onSaved?.()
    setTimeout(() => setOkMsg(null), 1800)
  }

  const inputPlacar =
    'w-14 h-14 rounded-md border-2 border-line bg-paper text-center ' +
    'font-display text-3xl text-ink tnum leading-none ' +
    'focus:outline-none focus:border-verde focus:ring-2 focus:ring-verde/30 ' +
    'disabled:bg-line disabled:text-slate disabled:cursor-not-allowed'

  return (
    <article className="bg-cloud rounded-lg border border-line shadow-soft p-5 sm:p-6 flex flex-col gap-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Topo: badge da fase (só no mata-mata) + data/hora em Brasília. Jogo de
          grupo e jogo de liga não levam badge — a seção ("Fase de Grupos" /
          "Rodada 21") já situa. Sem data marcada, mostra "data a definir" e o
          prazo real do palpite (início da rodada), pra ninguém ser pego de surpresa. */}
      <header className="flex items-start gap-2">
        {temBadgeDeFase(match.fase) && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-pill bg-ink text-paper text-xs font-bold uppercase tracking-wider whitespace-nowrap">
            {rotuloRodadaBadge(match.fase)}
          </span>
        )}
        <div className="ml-auto text-right min-w-0">
          <div className="text-xs text-slate font-semibold tnum">
            {semData ? 'data a definir' : formatarDataHora(match.data_hora)}
          </div>
          {semData && aberto && prazoRodada != null && (
            <div className="text-[11px] text-slate/80 mt-0.5">
              palpite até {formatarPrazo(prazoRodada)}
            </div>
          )}
        </div>
      </header>

      {/*
        Corpo: 3 colunas (time casa | centro | time fora).
        Bandeiras ancoram visualmente; nome embaixo, centralizado e truncado.
        Centro muda conforme estado: inputs / placar real / etiqueta "trancado".
      */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
        <ColunaTime time={match.time_casa} />

        <div className="flex items-center justify-center">
          {encerrado ? (
            <div className="font-display text-5xl tnum text-ink flex items-baseline gap-3 leading-none">
              <span>{match.gols_casa}</span>
              <span className="text-slate text-2xl">×</span>
              <span>{match.gols_fora}</span>
            </div>
          ) : trancado ? (
            <span className="px-3 py-1.5 rounded-pill bg-line text-slate text-xs font-bold uppercase tracking-wider text-center">
              {motivoTravado}
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={casa}
                onChange={(e) => setCasa(sanitizarPlacar(e.target.value))}
                disabled={salvando}
                aria-label={`palpite ${match.time_casa}`}
                className={inputPlacar}
              />
              <span className="text-slate text-xl">×</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={fora}
                onChange={(e) => setFora(sanitizarPlacar(e.target.value))}
                disabled={salvando}
                aria-label={`palpite ${match.time_fora}`}
                className={inputPlacar}
              />
            </div>
          )}
        </div>

        <ColunaTime time={match.time_fora} />
      </div>

      {/* Base: ação (aberto) ou resumo do palpite + chip (trancado/encerrado) */}
      {!trancado ? (
        <form onSubmit={salvar} className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={salvando}
            className="h-12 rounded-md bg-verde hover:bg-verde-dark text-cloud font-semibold shadow-hard transition-colors disabled:bg-line disabled:text-slate disabled:shadow-none disabled:cursor-not-allowed"
          >
            {salvando
              ? 'salvando…'
              : palpite
              ? 'atualizar palpite'
              : 'salvar palpite'}
          </button>
          {mostrarCaze && <BotaoCaze match={match} aoVivo={aoVivo} />}
          {erro && <p className="text-sm text-vermelho text-center">{erro}</p>}
          {okMsg && <p className="text-sm text-verde text-center">{okMsg}</p>}
        </form>
      ) : (
        <footer className="flex flex-col items-center gap-2 text-center">
          {mostrarCaze && <BotaoCaze match={match} aoVivo={aoVivo} />}
          {temPalpite ? (
            <>
              <p className="text-sm text-slate">
                seu palpite:{' '}
                <span className="text-ink font-semibold tnum">
                  {palpite.palpite_casa} × {palpite.palpite_fora}
                </span>
              </p>
              {chip && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-pill text-sm font-bold tnum ${chip.className}`}
                >
                  {chip.label}
                </span>
              )}
            </>
          ) : (
            <p className="text-sm text-slate">
              {encerrado
                ? 'você não palpitou neste jogo.'
                : `palpite fechado (${motivoTravado}) · sem palpite`}
            </p>
          )}
        </footer>
      )}
    </article>
  )
}

// Coluna de um time: bandeira em cima, nome centralizado embaixo.
function ColunaTime({ time }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <Bandeira time={time} size={52} />
      <div className="font-semibold text-sm text-ink text-center truncate w-full">
        {time}
      </div>
    </div>
  )
}

// Ícone de "play" estilo badge do YouTube: retângulo arredondado com o triângulo
// "vazado" (fillRule evenodd). O furo mostra o fundo do botão, então o triângulo
// acompanha o hover sozinho — sem cor fixa.
function IconePlay({ className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path
        fillRule="evenodd"
        d="M6 4h12a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Zm4 4.5v7l6-3.5Z"
      />
    </svg>
  )
}

// Link (<a>) estilizado como botão — mesma forma/tamanho do verde de palpite.
// Um único CAZETV_URL cobre qualquer jogo DA COPA (a CazéTV transmitiu o torneio
// inteiro). Não vale pra outros torneios — ver `temTransmissaoFixa` acima.
function BotaoCaze({ match, aoVivo }) {
  return (
    <a
      href={CAZETV_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Assistir ${match.time_casa} x ${match.time_fora} na CazéTV (YouTube)`}
      className="h-12 w-full px-3 rounded-md bg-caze hover:bg-caze-dark text-cloud font-semibold shadow-hard transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
    >
      <IconePlay className="w-5 h-5" />
      <span>Assistir na CazéTV</span>
      {aoVivo && (
        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-cloud animate-pulse" aria-hidden="true" />
          ao vivo
        </span>
      )}
    </a>
  )
}
