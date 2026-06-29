interface ClearFiltersButtonProps {
  onClick: () => void
  className?: string
  variant?: 'card' | 'mobile' | 'sidebar'
  label?: string
}

export function ClearFiltersButton({
  onClick,
  className = '',
  variant = 'card',
  label = 'Limpar filtros',
}: ClearFiltersButtonProps) {
  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`clear-filters-btn mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs text-red-400 transition hover:text-red-300 ${className}`}
      >
        <span>{label}</span>
        <TrashIcon />
      </button>
    )
  }

  const marginClass = variant === 'mobile' ? 'mb-4' : 'mt-3'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`clear-filters-btn ${marginClass} flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300 ${className}`}
    >
      <span>{label}</span>
      <TrashIcon />
    </button>
  )
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 opacity-80"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4.8A1.8 1.8 0 0 1 9.8 3h4.4A1.8 1.8 0 0 1 16 4.8V6" />
      <path d="M19 6l-.8 14.2A1.8 1.8 0 0 1 16.4 22H7.6a1.8 1.8 0 0 1-1.8-1.8L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  )
}
