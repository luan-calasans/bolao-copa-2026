import { SidebarFilterSection } from '../match/SidebarFilter'
import type { StandingsGridColumns } from '../../utils/standingsGrid'

interface StandingsGridDensityControlProps {
  value: StandingsGridColumns
  onChange: (value: StandingsGridColumns) => void
}

const OPTIONS: Array<{ value: StandingsGridColumns; label: string }> = [
  { value: 1, label: '1 tabela por linha' },
  { value: 2, label: '2 tabelas por linha' },
]

export function StandingsGridDensityControl({
  value,
  onChange,
}: StandingsGridDensityControlProps) {
  return (
    <SidebarFilterSection
      title="Visualização"
      variant="card"
      className="mb-4 hidden lg:block"
    >
      <div className="flex gap-2 px-1" role="group" aria-label="Visualização">
        {OPTIONS.map((option) => {
          const isActive = value === option.value

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

function GridColumnsIcon({ columns }: { columns: StandingsGridColumns }) {
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
