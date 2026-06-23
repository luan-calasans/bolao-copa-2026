import type { MatchFilter, MatchFilterOption } from '../../utils/matchFilters'
import { SidebarFilterOption, SidebarFilterSection } from './SidebarFilter'

interface MatchFilterBarProps {
  options: MatchFilterOption[]
  activeFilter: MatchFilter
  onFilterChange: (filter: MatchFilter) => void
  layout?: 'default' | 'sidebar'
}

export function MatchFilterBar({
  options,
  activeFilter,
  onFilterChange,
  layout = 'default',
}: MatchFilterBarProps) {
  const isSidebar = layout === 'sidebar'

  return (
    <SidebarFilterSection
      title="Status"
      variant={isSidebar ? 'sidebar' : 'card'}
      className={isSidebar ? 'pb-0' : 'mb-2.5'}
    >
      {options.map((option) => (
        <SidebarFilterOption
          key={option.id}
          label={option.label}
          count={option.count}
          isActive={activeFilter === option.id}
          onClick={() => onFilterChange(option.id)}
        />
      ))}
    </SidebarFilterSection>
  )
}
