export type TeamOutcome = 'win' | 'loss' | 'draw'

export function shouldShowMatchOutcome(
  status: string,
  home: number | null,
  away: number | null,
): boolean {
  if (home === null || away === null) return false
  return status === 'finished'
}

export function getTeamOutcome(home: number, away: number, side: 'home' | 'away'): TeamOutcome {
  if (home === away) return 'draw'

  if (side === 'home') {
    return home > away ? 'win' : 'loss'
  }

  return away > home ? 'win' : 'loss'
}

export function getTeamOutcomeClasses(outcome: TeamOutcome): string {
  const classes: Record<TeamOutcome, string> = {
    win: 'rounded-xl border-2 border-brazil-green/70 bg-brazil-green/10 p-1.5 shadow-sm shadow-brazil-green/10',
    loss: 'rounded-xl border-2 border-red-500/70 bg-red-500/10 p-1.5 shadow-sm shadow-red-500/10',
    draw: 'rounded-xl border-2 border-amber-400/60 bg-amber-400/10 p-1.5 shadow-sm shadow-amber-400/10',
  }

  return classes[outcome]
}
