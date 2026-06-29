import type { KnockoutRound } from '../../models/knockout'
import type { KnockoutSimulatorProps } from '../../utils/knockoutSimulator'
import { KnockoutBracketDesktop } from './KnockoutBracketDesktop'
import { KnockoutMatchCard } from './KnockoutMatchCard'

export type { KnockoutSimulatorProps } from '../../utils/knockoutSimulator'

interface KnockoutBracketProps {
  rounds: KnockoutRound[]
  showDesktop?: boolean
  linkTeams?: boolean
  simulator?: KnockoutSimulatorProps
}

function KnockoutBracketDetails({ rounds, linkTeams = true, simulator }: KnockoutBracketProps) {
  return (
    <div className="space-y-8">
      {rounds.map((round) => (
        <section key={round.stage}>
          <h2 className="mb-4 text-base font-bold text-white sm:text-lg">{round.label}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {round.matches.map((match, index) => (
              <KnockoutMatchCard
                key={match.key}
                match={match}
                index={index}
                linkTeams={linkTeams}
                simulator={simulator}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function KnockoutBracket({
  rounds,
  showDesktop = true,
  linkTeams = true,
  simulator,
}: KnockoutBracketProps) {
  return (
    <>
      {showDesktop && (
        <KnockoutBracketDesktop rounds={rounds} linkTeams={linkTeams} simulator={simulator} />
      )}

      <div
        className={
          showDesktop ? 'lg:mt-12 lg:border-t lg:border-slate-700/40 lg:pt-12' : undefined
        }
      >
        <KnockoutBracketDetails rounds={rounds} linkTeams={linkTeams} simulator={simulator} />
      </div>
    </>
  )
}
