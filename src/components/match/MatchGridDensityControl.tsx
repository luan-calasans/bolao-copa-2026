import type { MatchGridColumns } from '../../utils/matchGrid'
import { clampMatchGridColumns, getMaxMatchGridColumns } from '../../utils/matchGrid'
import { useLargeDesktop } from '../../hooks/useLargeDesktop'
import { SidebarFilterSection } from './SidebarFilter'

interface MatchGridDensityControlProps {
  value: MatchGridColumns
  onChange: (value: MatchGridColumns) => void
  layout?: 'default' | 'sidebar'
}

const ALL_OPTIONS: Array<{ value: MatchGridColumns; label: string }> = [
  { value: 1, label: '1 jogo por linha' },
  { value: 2, label: '2 jogos por linha' },
  { value: 3, label: '3 jogos por linha' },
]

export function MatchGridDensityControl({
  value,
  onChange,
  layout = 'default',
}: MatchGridDensityControlProps) {
  const isLargeDesktop = useLargeDesktop()
  const maxColumns = getMaxMatchGridColumns(isLargeDesktop)
  const options = ALL_OPTIONS.filter((option) => option.value <= maxColumns)
  const displayValue = clampMatchGridColumns(value, isLargeDesktop)
  const isSidebar = layout === 'sidebar'

  return (
    <SidebarFilterSection
      title="Visualização"
      variant={isSidebar ? 'sidebar' : 'card'}
      className={`hidden min-[426px]:block ${isSidebar ? '' : 'mb-2.5'}`}
    >
      <div className="flex gap-2 px-1" role="group" aria-label="Visualização">
        {options.map((option) => {
          const isActive = displayValue === option.value

          return (
            <button
              key={option.value}
              type="button"
              aria-label={option.label}
              aria-pressed={isActive}
              title={option.label}
              onClick={() => onChange(option.value)}
              className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 transition ${
                isActive
                  ? 'border-brazil-yellow/50 bg-pitch-700/80 text-brazil-yellow'
                  : 'border-slate-600/40 bg-pitch-900/40 text-slate-400 hover:border-slate-500/60 hover:bg-pitch-800/60 hover:text-slate-200'
              }`}
            >
              <GridColumnsIcon columns={option.value} />
            </button>
          )
        })}
      </div>
    </SidebarFilterSection>
  )
}

function GridColumnsIcon({ columns }: { columns: MatchGridColumns }) {
  if (columns === 1) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 12"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="10" rx="1.5" fill="currentColor" />
      </svg>
    )
  }

  if (columns === 2) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 12"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="6.5" height="10" rx="1.5" fill="currentColor" />
        <rect x="8.5" y="1" width="6.5" height="10" rx="1.5" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="4" height="10" rx="1" fill="currentColor" />
      <rect x="6" y="1" width="4" height="10" rx="1" fill="currentColor" />
      <rect x="11" y="1" width="4" height="10" rx="1" fill="currentColor" />
    </svg>
  )
}
