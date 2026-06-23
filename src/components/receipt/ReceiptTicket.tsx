import { forwardRef } from 'react'
import type { Receipt } from '../../models/receipt'
import type { Team } from '../../models/team'
import {
  formatDateTime,
  formatMatchDate,
  formatMatchTime,
  formatStage,
} from '../../utils/dateFormatter'
import { getTeamDisplayName, isTeamDefined } from '../../utils/teamDisplay'
import { formatWinnerPickLabel } from '../../utils/winnerPickDisplay'
import { isValidWinnerPick } from '../../utils/winnerPickValidation'
import { DashedPlaceholder } from '../ui/DashedPlaceholder'
import { TeamIdentity } from '../ui/TeamIdentity'

interface ReceiptTicketProps {
  receipt: Receipt
}

export const ReceiptTicket = forwardRef<HTMLDivElement, ReceiptTicketProps>(function ReceiptTicket(
  { receipt },
  ref,
) {
  const { bet, id, generatedAt } = receipt
  const { match, homeScore, awayScore, personName, winnerPick } = bet

  if (!match) {
    return (
      <div
        ref={ref}
        className="receipt-ticket mx-auto w-[360px] max-w-full overflow-hidden rounded-3xl border-2 border-gold-500/40 bg-pitch-900 px-5 py-8 text-center text-sm text-slate-400"
      >
        Dados do jogo indisponíveis neste comprovante.
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="receipt-ticket mx-auto w-[360px] max-w-full overflow-hidden rounded-3xl border-2 border-gold-500/40 bg-pitch-900"
    >
      <div className="gradient-gold px-5 py-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/70">
          Comprovante Oficial
        </p>
        <h2 className="text-lg font-black text-black">Bolão Copa 2026</h2>
      </div>

      <div className="bg-pitch-900 px-5 py-5">
        <div className="mb-5 flex w-full flex-col items-center gap-2 text-center">
          <span className="block w-full break-all rounded-lg bg-pitch-800 px-3 py-1 font-mono text-xs text-gold-400">
            #{id}
          </span>
          <span className="block w-full text-xs leading-snug text-slate-400">
            {formatStage(match.stage)}
          </span>
        </div>

        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <TeamBlock team={match.homeTeam} />
          <div className="px-1 text-center">
            {homeScore != null && awayScore != null ? (
              <>
                <p className="text-3xl font-black tabular-nums text-white">
                  {homeScore}
                  <span className="mx-1 text-gold-400">×</span>
                  {awayScore}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">Palpite</p>
              </>
            ) : winnerPick && isValidWinnerPick(winnerPick) ? (
              <>
                <p className="text-lg font-black text-white">
                  {formatWinnerPickLabel(match, winnerPick)}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">Vencedor</p>
              </>
            ) : (
              <p className="text-sm text-slate-500">Palpite registrado</p>
            )}
          </div>
          <TeamBlock team={match.awayTeam} />
        </div>

        <div className="space-y-2.5 border-t border-dashed border-slate-600/50 pt-4 text-xs">
          {personName?.trim() && <Row label="Participante" value={personName.trim()} />}
          {winnerPick && isValidWinnerPick(winnerPick) && homeScore != null && awayScore != null && (
            <Row label="Vencedor" value={formatWinnerPickLabel(match, winnerPick)} />
          )}
          <Row
            label="Partida"
            value={
              isTeamDefined(match.homeTeam) && isTeamDefined(match.awayTeam)
                ? `${getTeamDisplayName(match.homeTeam.shortName, match.homeTeam.name)} vs ${getTeamDisplayName(match.awayTeam.shortName, match.awayTeam.name)}`
                : undefined
            }
          />
          <Row
            label="Data do jogo"
            value={`${formatMatchDate(match.utcDate)} · ${formatMatchTime(match.utcDate)}`}
          />
          <Row label="Gerado em" value={formatDateTime(generatedAt)} />
          {bet.updatedAt && <Row label="Atualizado em" value={formatDateTime(bet.updatedAt)} />}
        </div>

        <div className="mt-5 flex items-center justify-center gap-1 opacity-30">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="h-6 w-1 rounded-full bg-slate-500" />
          ))}
        </div>
      </div>

      <div className="border-t border-gold-500/20 bg-pitch-950 px-5 py-2.5 text-center">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">
          FIFA World Cup 2026 · Bolão Esportivo
        </p>
      </div>
    </div>
  )
})

interface TeamBlockProps {
  team: Team
}

function TeamBlock({ team }: TeamBlockProps) {
  return (
    <TeamIdentity
      team={team}
      align="center"
      nameClassName="w-full text-center text-[11px] font-semibold leading-tight break-words text-white"
    />
  )
}

interface RowProps {
  label: string
  value?: string
}

function Row({ label, value }: RowProps) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
      <span className="shrink-0 text-slate-500">{label}</span>
      {value ? (
        <span className="text-right leading-snug break-words text-slate-200">{value}</span>
      ) : (
        <DashedPlaceholder className="ml-auto h-3 w-20" label={`${label} indisponível`} />
      )}
    </div>
  )
}
