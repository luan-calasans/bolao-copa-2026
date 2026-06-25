export type PodiumRank = 1 | 2 | 3

export function isPodiumRank(rank: number): rank is PodiumRank {
  return rank === 1 || rank === 2 || rank === 3
}

export function getPodiumRowClass(rank: number): string {
  switch (rank) {
    case 1:
      return 'podium-row-first'
    case 2:
      return 'podium-row-second'
    case 3:
      return 'podium-row-third'
    default:
      return ''
  }
}

export function getPodiumNameClass(rank: number): string {
  switch (rank) {
    case 1:
      return 'text-gold-300'
    case 2:
      return 'text-slate-200'
    case 3:
      return 'text-amber-300'
    default:
      return 'text-white'
  }
}

export function getPodiumRankClass(rank: number): string {
  switch (rank) {
    case 1:
      return 'text-gold-400'
    case 2:
      return 'text-slate-300'
    case 3:
      return 'text-amber-400'
    default:
      return 'text-slate-300'
  }
}
