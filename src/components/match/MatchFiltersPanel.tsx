import { useState } from 'react'
import type { DateFilterState, DateFilterPreset } from '../../utils/dateFilters'
import type { MatchFilter, MatchFilterOption, CountryFilterOption } from '../../utils/matchFilters'
import { CountryFilterBar } from './CountryFilterBar'
import { DateFilterBar } from './DateFilterBar'
import { MatchFilterBar } from './MatchFilterBar'
import { MatchGridDensityControl } from './MatchGridDensityControl'
import { DataReloadButton } from '../ui/DataReloadButton'
import { ClearFiltersButton } from '../ui/ClearFiltersButton'
import type { MatchGridColumns } from '../../utils/matchGrid'

interface MatchFiltersPanelProps {
  filter: MatchFilter
  filterOptions: MatchFilterOption[]
  dateFilter: DateFilterState
  countryFilterOptions: CountryFilterOption[]
  selectedCountryId: number | null
  columnsPerRow: MatchGridColumns
  onFilterChange: (filter: MatchFilter) => void
  onDatePresetChange: (preset: DateFilterPreset) => void
  onCountryChange: (countryId: number | null) => void
  onColumnsPerRowChange: (columns: MatchGridColumns) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  onReload?: () => void
  isReloading?: boolean
}

function countActiveFilters(
  filter: MatchFilter,
  dateFilter: DateFilterState,
  selectedCountryId: number | null,
): number {
  let count = 0
  if (filter !== 'all') count += 1
  if (dateFilter.preset !== 'all') count += 1
  if (selectedCountryId != null) count += 1
  return count
}

export function MatchFiltersPanel({
  filter,
  filterOptions,
  dateFilter,
  countryFilterOptions,
  selectedCountryId,
  columnsPerRow,
  onFilterChange,
  onDatePresetChange,
  onCountryChange,
  onColumnsPerRowChange,
  hasActiveFilters,
  onClearFilters,
  onReload,
  isReloading = false,
}: MatchFiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeCount = countActiveFilters(filter, dateFilter, selectedCountryId)
  const showMatchFilter = filterOptions.length > 1

  const mobileFilters = (
    <>
      <DateFilterBar filter={dateFilter} onPresetChange={onDatePresetChange} />
      <CountryFilterBar
        options={countryFilterOptions}
        selectedCountryId={selectedCountryId}
        onCountryChange={onCountryChange}
      />
      {showMatchFilter && (
        <MatchFilterBar
          options={filterOptions}
          activeFilter={filter}
          onFilterChange={onFilterChange}
        />
      )}
      <MatchGridDensityControl value={columnsPerRow} onChange={onColumnsPerRowChange} />
      {onReload && (
        <div className="mb-3 lg:hidden">
          <DataReloadButton onReload={onReload} isReloading={isReloading} size="md" />
        </div>
      )}
      {hasActiveFilters && <ClearFiltersButton onClick={onClearFilters} variant="mobile" />}
    </>
  )

  const desktopFilters = (
    <>
      <DateFilterBar filter={dateFilter} onPresetChange={onDatePresetChange} layout="sidebar" />
      <CountryFilterBar
        options={countryFilterOptions}
        selectedCountryId={selectedCountryId}
        onCountryChange={onCountryChange}
        layout="sidebar"
      />
      {showMatchFilter && (
        <MatchFilterBar
          options={filterOptions}
          activeFilter={filter}
          onFilterChange={onFilterChange}
          layout="sidebar"
        />
      )}
      <MatchGridDensityControl
        value={columnsPerRow}
        onChange={onColumnsPerRowChange}
        layout="sidebar"
      />
      {onReload && (
        <div className="mt-3">
          <DataReloadButton onReload={onReload} isReloading={isReloading} size="md" />
        </div>
      )}
      {hasActiveFilters && <ClearFiltersButton onClick={onClearFilters} variant="sidebar" />}
    </>
  )

  return (
    <aside className="lg:sticky lg:top-[calc(var(--app-header-height,6rem)+var(--app-main-padding-top,2rem)-0.5rem)] lg:z-10 lg:self-start">
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="mobile-filters-panel"
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-600/40 bg-pitch-800/60 px-4 py-3.5 text-base font-semibold text-white transition hover:border-slate-500/60 hover:bg-pitch-700/60"
        >
          <span className="inline-flex items-center gap-2">
            <FilterIcon />
            Filtrar
            {activeCount > 0 && (
              <span className="rounded-full bg-gold-500 px-2 py-0.5 text-xs font-bold text-pitch-950">
                {activeCount}
              </span>
            )}
          </span>
          <ChevronIcon open={isOpen} />
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
          aria-hidden={!isOpen}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              id="mobile-filters-panel"
              className={`mt-3 transition-all duration-300 ease-out ${
                isOpen
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none -translate-y-2 opacity-0'
              }`}
            >
              {mobileFilters}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:pr-2">{desktopFilters}</div>
    </aside>
  )
}

function FilterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-gold-400"
      aria-hidden="true"
    >
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 text-slate-400 transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
