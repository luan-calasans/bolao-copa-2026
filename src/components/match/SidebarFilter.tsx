import type { ReactNode } from 'react'

interface SidebarFilterSectionProps {
  title: string
  children: ReactNode
  className?: string
  variant?: 'sidebar' | 'card'
}

export function SidebarFilterSection({
  title,
  children,
  className = '',
  variant = 'sidebar',
}: SidebarFilterSectionProps) {
  if (variant === 'card') {
    return (
      <div
        className={`mb-3 rounded-2xl border border-slate-700/40 bg-pitch-800/40 p-3 sm:p-4 ${className}`}
      >
        <h3 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </h3>
        <div className="flex flex-col gap-1">{children}</div>
      </div>
    )
  }

  return (
    <section className={`py-2.5 first:pt-0 last:pb-0 ${className}`}>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">{title}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  )
}

interface SidebarFilterOptionProps {
  label: string
  isActive: boolean
  onClick: () => void
  count?: number
}

const filterOptionBaseClass =
  'flex w-full cursor-pointer items-center justify-between gap-2 border-l-2 bg-transparent py-2 text-left text-sm transition hover:bg-transparent focus:bg-transparent focus:outline-none active:bg-transparent'

export function SidebarFilterOption({ label, isActive, onClick, count }: SidebarFilterOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${filterOptionBaseClass} ${
        isActive
          ? 'border-brazil-yellow pl-3 font-semibold text-brazil-yellow'
          : 'border-transparent pl-3.5 font-medium text-slate-400 hover:text-slate-200'
      }`}
    >
      <span>{label}</span>
      {count != null && (
        <span
          className={`shrink-0 text-xs tabular-nums ${
            isActive ? 'text-brazil-yellow/70' : 'text-slate-500'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}
