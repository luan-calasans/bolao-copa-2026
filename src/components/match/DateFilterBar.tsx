import type { DateFilterPreset, DateFilterState } from '../../utils/dateFilters'
import { DATE_FILTER_OPTIONS } from '../../utils/dateFilters'
import { SidebarFilterOption, SidebarFilterSection } from './SidebarFilter'

interface DateFilterBarProps {
  filter: DateFilterState
  onPresetChange: (preset: DateFilterPreset) => void
  layout?: 'default' | 'sidebar'
}

export function DateFilterBar({ filter, onPresetChange, layout = 'default' }: DateFilterBarProps) {
  const isSidebar = layout === 'sidebar'

  return (
    <SidebarFilterSection title="Data" variant={isSidebar ? 'sidebar' : 'card'}>
      {DATE_FILTER_OPTIONS.map((option) => (
        <SidebarFilterOption
          key={option.id}
          label={option.label}
          isActive={filter.preset === option.id}
          onClick={() => onPresetChange(option.id)}
        />
      ))}
    </SidebarFilterSection>
  )
}
