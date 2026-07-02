import { Trophy } from 'lucide-react'
import type { PodiumRank } from '../../utils/podiumPlacement'

const TROPHY_COLOR: Record<PodiumRank, string> = {
  1: 'podium-rank-first',
  2: 'podium-rank-second',
  3: 'podium-rank-third',
}

interface PodiumTrophyIconProps {
  rank: PodiumRank
  className?: string
  size?: 'sm' | 'md'
}

const SIZE_CLASS = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
} as const

export function PodiumTrophyIcon({ rank, className = '', size = 'md' }: PodiumTrophyIconProps) {
  return (
    <Trophy
      aria-hidden="true"
      strokeWidth={2}
      className={`shrink-0 ${SIZE_CLASS[size]} ${TROPHY_COLOR[rank]} ${className}`.trim()}
    />
  )
}
