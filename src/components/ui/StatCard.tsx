interface StatCardProps {
  label: string
  value: string
  highlight?: boolean
  active?: boolean
  clickable?: boolean
  onClick?: () => void
}

export function StatCard({
  label,
  value,
  highlight = false,
  active = false,
  clickable = true,
  onClick,
}: StatCardProps) {
  const isInteractive = clickable && onClick != null

  const className = [
    'rounded-2xl border px-4 py-3 text-center transition',
    active
      ? 'border-brazil-yellow/50 bg-brazil-yellow/10'
      : 'border-slate-700/50 bg-pitch-800/40',
    isInteractive
      ? 'cursor-pointer hover:border-brazil-yellow/35 hover:bg-pitch-700/50'
      : 'cursor-default',
  ].join(' ')

  if (!isInteractive) {
    return (
      <div className={className} aria-disabled="true">
        <p className={`text-2xl font-bold ${highlight ? 'text-gold-400' : 'text-white'}`}>
          {value}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{label}</p>
      </div>
    )
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={className}>
      <p className={`text-2xl font-bold ${highlight ? 'text-gold-400' : 'text-white'}`}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{label}</p>
    </button>
  )
}
