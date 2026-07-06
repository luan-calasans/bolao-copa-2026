import type { TeamWorldCupStats } from '../../models/historicalWorldCup'
import { HistoricalTeamCrest } from './HistoricalTeamCrest'

interface HistoricoTeamStatsTableProps {
  teamStats: TeamWorldCupStats[]
}

function formatRate(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatAverage(value: number): string {
  return value.toFixed(2)
}

export function HistoricoTeamStatsTable({ teamStats }: HistoricoTeamStatsTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-700/50 bg-pitch-800/40">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700/40 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="w-12 px-4 py-3 text-center sm:px-5">#</th>
              <th className="px-4 py-3 sm:px-5">Seleção</th>
              <th className="px-4 py-3 text-center sm:px-5">Títulos</th>
              <th className="px-4 py-3 text-center sm:px-5">Finais</th>
              <th className="px-4 py-3 text-center sm:px-5">Copas</th>
              <th className="px-4 py-3 text-center sm:px-5">% Vit.</th>
              <th className="px-4 py-3 text-center sm:px-5">Méd. GF</th>
              <th className="px-4 py-3 text-center sm:px-5">Méd. GS</th>
              <th className="hidden px-4 py-3 text-center lg:table-cell sm:px-5">Grupos</th>
              <th className="hidden px-4 py-3 text-center lg:table-cell sm:px-5">Mata-mata</th>
            </tr>
          </thead>
          <tbody>
            {teamStats.map((team, index) => (
              <tr
                key={team.canonicalName}
                className="border-b border-slate-700/20 last:border-b-0"
              >
                <td className="px-4 py-3 text-center text-slate-500 sm:px-5">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-white sm:px-5">
                  <span className="inline-flex items-center gap-2">
                    <HistoricalTeamCrest
                      teamName={team.canonicalName}
                      size="sm"
                      className="!h-8 !w-8 sm:!h-9 sm:!w-9"
                    />
                    {team.displayName}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-gold-400 sm:px-5">
                  {team.titles}
                </td>
                <td className="px-4 py-3 text-center text-slate-300 sm:px-5">{team.finalsPlayed}</td>
                <td className="px-4 py-3 text-center text-slate-300 sm:px-5">
                  {team.participations}
                </td>
                <td className="px-4 py-3 text-center text-slate-300 sm:px-5">
                  {formatRate(team.winRate)}
                </td>
                <td className="px-4 py-3 text-center text-slate-300 sm:px-5">
                  {formatAverage(team.avgGoalsFor)}
                </td>
                <td className="px-4 py-3 text-center text-slate-300 sm:px-5">
                  {formatAverage(team.avgGoalsAgainst)}
                </td>
                <td className="hidden px-4 py-3 text-center text-slate-400 lg:table-cell sm:px-5">
                  {team.groupWins}-{team.groupDraws}-{team.groupLosses}
                </td>
                <td className="hidden px-4 py-3 text-center text-slate-400 lg:table-cell sm:px-5">
                  {team.knockoutWins}-{team.knockoutDraws}-{team.knockoutLosses}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
