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
      return 'podium-name-first'
    case 2:
      return 'podium-name-second'
    case 3:
      return 'podium-name-third'
    default:
      return 'text-white'
  }
}

export function getPodiumRankClass(rank: number): string {
  switch (rank) {
    case 1:
      return 'podium-rank-first'
    case 2:
      return 'podium-rank-second'
    case 3:
      return 'podium-rank-third'
    default:
      return 'text-slate-300'
  }
}
