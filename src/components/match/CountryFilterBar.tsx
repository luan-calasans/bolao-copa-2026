import type { CountryFilterOption } from '../../utils/matchFilters'
import { SidebarFilterSection } from './SidebarFilter'

interface CountryFilterBarProps {
  options: CountryFilterOption[]
  selectedCountryId: number | null
  onCountryChange: (countryId: number | null) => void
  layout?: 'default' | 'sidebar'
  title?: string
  emptyLabel?: string
}

const selectClass =
  'w-full cursor-pointer rounded-lg border border-slate-600/50 bg-pitch-900/80 px-3.5 py-2.5 text-base text-slate-200 outline-none transition focus:border-brazil-yellow/60 focus:ring-1 focus:ring-brazil-yellow/30'

export function CountryFilterBar({
  options,
  selectedCountryId,
  onCountryChange,
  layout = 'default',
  title = 'País',
  emptyLabel = 'Todos os países',
}: CountryFilterBarProps) {
  const isSidebar = layout === 'sidebar'
  const selectId = isSidebar ? 'country-filter-sidebar' : 'country-filter'

  return (
    <SidebarFilterSection
      title={title}
      variant={isSidebar ? 'sidebar' : 'card'}
      className={isSidebar ? '' : 'mb-2.5'}
    >
      <select
        id={selectId}
        value={selectedCountryId ?? ''}
        onChange={(event) => {
          const value = event.target.value
          onCountryChange(value ? Number(value) : null)
        }}
        className={selectClass}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </SidebarFilterSection>
  )
}
