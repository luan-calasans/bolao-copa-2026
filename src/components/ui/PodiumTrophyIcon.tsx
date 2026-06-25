import type { PodiumRank } from '../../utils/podiumPlacement'

const TROPHY_COLOR: Record<PodiumRank, string> = {
  1: 'text-gold-400',
  2: 'text-slate-300',
  3: 'text-amber-500',
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={`shrink-0 ${SIZE_CLASS[size]} ${TROPHY_COLOR[rank]} ${className}`.trim()}
    >
      <path d="M6 9a6 6 0 0 0 12 0V4H6v5zM4 9a8 8 0 0 0 6.2 7.79L9 20H7v2h10v-2h-2l-1.2-3.21A8 8 0 0 0 20 9h-2a6 6 0 0 1-11.6 0H4z" />
    </svg>
  )
}
