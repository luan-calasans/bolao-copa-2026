interface DataReloadButtonProps {
  onReload: () => void
  isReloading?: boolean
  className?: string
  size?: 'sm' | 'md'
}

export function DataReloadButton({
  onReload,
  isReloading = false,
  className = '',
  size = 'sm',
}: DataReloadButtonProps) {
  const sizeClass = size === 'md' ? 'h-10 w-full gap-2 px-4 text-sm font-semibold' : 'h-7 w-7'

  return (
    <button
      type="button"
      onClick={onReload}
      disabled={isReloading}
      aria-label="Atualizar dados"
      title="Atualizar dados"
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-700/60 bg-pitch-900/60 text-slate-400 transition hover:border-slate-600 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${className}`.trim()}
    >
      {size === 'md' && <span>Atualizar dados</span>}
      <RefreshIcon spinning={isReloading} className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
    </button>
  )
}

function RefreshIcon({ spinning, className }: { spinning: boolean; className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} ${spinning ? 'animate-spin' : ''}`}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}
