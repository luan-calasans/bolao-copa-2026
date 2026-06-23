import { getStatusLabel } from '../../utils/matchStatus'

interface MatchStatusBadgeProps {
  rawStatus: string
  minute: number | null
  isLive: boolean
  variant?: 'default' | 'corner' | 'pill'
  size?: 'sm' | 'md'
}

function getPillShellClass(size: 'sm' | 'md') {
  const textClass = size === 'md' ? 'text-sm' : 'text-xs'
  return `inline-flex rounded-full border px-2.5 py-1 font-semibold ${textClass}`
}

const cornerColorMap: Record<string, string> = {
  FINISHED: 'border-red-400 bg-red-700 text-white',
  AWARDED: 'border-red-400 bg-red-700 text-white',
  SCHEDULED: 'border-blue-400 bg-blue-700 text-white',
  TIMED: 'border-blue-400 bg-blue-700 text-white',
  POSTPONED: 'border-amber-400 bg-amber-600 text-white',
  CANCELLED: 'border-red-500 bg-red-800 text-white',
}

const defaultColorMap: Record<string, string> = {
  FINISHED: 'bg-red-500/20 text-red-300 ring-red-500/30',
  AWARDED: 'bg-red-500/20 text-red-300 ring-red-500/30',
  SCHEDULED: 'bg-blue-500/20 text-blue-300 ring-blue-500/30',
  TIMED: 'bg-blue-500/20 text-blue-300 ring-blue-500/30',
  POSTPONED: 'bg-amber-500/20 text-amber-300 ring-amber-500/30',
  CANCELLED: 'bg-red-500/20 text-red-300 ring-red-500/30',
}

export function MatchStatusBadge({
  rawStatus,
  minute,
  isLive,
  variant = 'default',
  size = 'sm',
}: MatchStatusBadgeProps) {
  const label = getStatusLabel(rawStatus, minute)
  const pillShellClass = getPillShellClass(size)

  if (variant === 'pill') {
    if (isLive) {
      return (
        <span
          className={`${pillShellClass} items-center gap-1.5 border-emerald-400 bg-emerald-700 text-white`}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-200 live-pulse" />
          {label}
        </span>
      )
    }

    const colorClass = cornerColorMap[rawStatus] ?? 'border-slate-500 bg-slate-700 text-white'

    return <span className={`${pillShellClass} ${colorClass}`}>{label}</span>
  }

  const isCorner = variant === 'corner'
  const shapeClass = isCorner ? 'rounded-lg' : 'rounded-full'
  const sizeClass = isCorner
    ? 'px-2.5 py-1 text-[10px] shadow-lg shadow-black/35 sm:text-[11px]'
    : 'px-3 py-1 text-xs'
  const outlineClass = isCorner ? 'border' : 'ring-1'

  if (isLive) {
    const liveClass = isCorner
      ? 'border-emerald-400 bg-emerald-700 text-white'
      : 'bg-brazil-green/20 text-emerald-300 ring-brazil-green/40'

    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold ${outlineClass} ${liveClass} ${shapeClass} ${sizeClass}`}
      >
        <span className="h-2 w-2 rounded-full bg-emerald-200 live-pulse" />
        {label}
      </span>
    )
  }

  if (isCorner && (rawStatus === 'SCHEDULED' || rawStatus === 'TIMED')) {
    return (
      <span className="inline-flex px-2.5 py-1 text-[10px] font-semibold text-blue-400 sm:text-[11px]">
        {label}
      </span>
    )
  }

  if (isCorner && (rawStatus === 'FINISHED' || rawStatus === 'AWARDED')) {
    return (
      <span className="inline-flex px-2.5 py-1 text-[10px] font-semibold text-red-400 sm:text-[11px]">
        {label}
      </span>
    )
  }

  const colorClass = isCorner
    ? (cornerColorMap[rawStatus] ?? 'border-slate-500 bg-slate-700 text-white')
    : (defaultColorMap[rawStatus] ?? 'bg-slate-600/30 text-slate-300 ring-slate-500/30')

  return (
    <span
      className={`inline-flex font-medium ${outlineClass} ${colorClass} ${shapeClass} ${sizeClass}`}
    >
      {label}
    </span>
  )
}
