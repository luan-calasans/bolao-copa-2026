import { CountryFilterBar } from '../match/CountryFilterBar'
import { ClearFiltersButton } from '../ui/ClearFiltersButton'
import type { CountryFilterOption } from '../../utils/matchFilters'
import type { StandingsGridColumns } from '../../utils/standingsGrid'
import { StandingsGridDensityControl } from './StandingsGridDensityControl'

interface StandingsFiltersPanelProps {
  countryFilterOptions: CountryFilterOption[]
  selectedCountryId: number | null
  onCountryChange: (countryId: number | null) => void
  columnsPerRow: StandingsGridColumns
  onColumnsPerRowChange: (columns: StandingsGridColumns) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function StandingsFiltersPanel({
  countryFilterOptions,
  selectedCountryId,
  onCountryChange,
  columnsPerRow,
  onColumnsPerRowChange,
  hasActiveFilters,
  onClearFilters,
}: StandingsFiltersPanelProps) {
  const showCountryFilter = countryFilterOptions.length > 0
  const isCountrySelected = selectedCountryId != null
  const showDensityControl = !isCountrySelected

  if (!showCountryFilter) {
    return (
      <div className="mb-4">
        {showDensityControl && (
          <StandingsGridDensityControl value={columnsPerRow} onChange={onColumnsPerRowChange} />
        )}
        {hasActiveFilters && <ClearFiltersButton onClick={onClearFilters} />}
      </div>
    )
  }

  return (
    <div className="mb-4">
      <div
        className={
          showDensityControl ? 'lg:grid lg:grid-cols-2 lg:items-start lg:gap-3' : undefined
        }
      >
        <CountryFilterBar
          options={countryFilterOptions}
          selectedCountryId={selectedCountryId}
          onCountryChange={onCountryChange}
        />
        {showDensityControl && (
          <StandingsGridDensityControl value={columnsPerRow} onChange={onColumnsPerRowChange} />
        )}
      </div>
      {hasActiveFilters && <ClearFiltersButton onClick={onClearFilters} />}
    </div>
  )
}
