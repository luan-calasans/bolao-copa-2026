import { forwardRef } from 'react'
import type { ChampionReceipt } from '../../models/championBet'
import { CHAMPION_BET_POINTS } from '../../utils/championBet'
import { formatDateTime } from '../../utils/dateFormatter'
import { getTeamDisplayName } from '../../utils/teamDisplay'
import { TeamCrest } from '../ui/TeamCrest'

interface ChampionReceiptTicketProps {
  receipt: ChampionReceipt
}

export const ChampionReceiptTicket = forwardRef<HTMLDivElement, ChampionReceiptTicketProps>(
  function ChampionReceiptTicket({ receipt }, ref) {
    const { championBet, id, generatedAt } = receipt
    const teamName = getTeamDisplayName(championBet.team.shortName, championBet.team.name)

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
            <span className="block w-full text-xs leading-snug text-slate-400">Palpite de campeão</span>
          </div>

          <div className="mb-5 flex flex-col items-center gap-3 text-center">
            <TeamCrest
              crest={championBet.team.crest}
              name={teamName}
              size="lg"
              className="rounded-2xl bg-pitch-800/80 p-2"
            />
            <div>
              <p className="text-xl font-black text-white">{teamName}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">
                Campeão previsto
              </p>
            </div>
          </div>

          <div className="mb-5 rounded-xl border border-slate-700/40 bg-pitch-800/60 px-4 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Pontuação se acertar
            </p>
            <p className="mt-1 text-2xl font-black text-gold-400">{CHAMPION_BET_POINTS} pts</p>
          </div>

          <div className="space-y-3 border-t border-slate-700/40 pt-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Participante</span>
              <span className="font-semibold text-white">{championBet.personName}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Registrado em</span>
              <span className="text-slate-300">{formatDateTime(generatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
)
