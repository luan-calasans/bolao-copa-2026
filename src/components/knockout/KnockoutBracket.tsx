import type { KnockoutRound } from '../../models/knockout'
import { KnockoutMatchCard } from './KnockoutMatchCard'

interface KnockoutBracketProps {
  rounds: KnockoutRound[]
}

export function KnockoutBracket({ rounds }: KnockoutBracketProps) {
  return (
    <div className="space-y-8">
      {rounds.map((round) => (
        <section key={round.stage}>
          <h2 className="mb-4 text-base font-bold text-white sm:text-lg">{round.label}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {round.matches.map((match, index) => (
              <KnockoutMatchCard key={match.key} match={match} index={index} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
