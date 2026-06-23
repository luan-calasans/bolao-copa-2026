import { useState } from 'react'
import type {
  BetDateSortPreset,
  BetMatchStatusFilter,
  BetMatchStatusFilterOption,
  BetResultFilter,
  BetResultFilterOption,
} from '../../utils/betListFilters'
import { BET_DATE_SORT_OPTIONS } from '../../utils/betListFilters'
import type { ParticipantFilterOption } from '../../utils/betListFilters'
import type { CountryFilterOption } from '../../utils/matchFilters'
import { SidebarFilterOption, SidebarFilterSection } from '../match/SidebarFilter'
import { BetsTeamParticipantFilterCard } from './BetsTeamParticipantFilterCard'
import { ClearFiltersButton } from '../ui/ClearFiltersButton'

interface BetsFilterPanelProps {
  resultFilter: BetResultFilter
  resultFilterOptions: BetResultFilterOption[]
  onResultFilterChange: (filter: BetResultFilter) => void
  statusFilter: BetMatchStatusFilter
  statusFilterOptions: BetMatchStatusFilterOption[]
  onStatusFilterChange: (filter: BetMatchStatusFilter) => void
  countryFilterOptions: CountryFilterOption[]
  selectedCountryId: number | null
  onCountryChange: (countryId: number | null) => void
  participantFilterOptions: ParticipantFilterOption[]
  selectedParticipantKey: string | null
  onParticipantChange: (personNameKey: string | null) => void
  dateSort: BetDateSortPreset
  onDateSortChange: (preset: BetDateSortPreset) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

function toggleFilter<T extends string>(current: T, next: T, allValue: T): T {
  return current === next ? allValue : next
}

export function BetsFilterPanel({
  resultFilter,
  resultFilterOptions,
  onResultFilterChange,
  statusFilter,
  statusFilterOptions,
  onStatusFilterChange,
  countryFilterOptions,
  selectedCountryId,
  onCountryChange,
  participantFilterOptions,
  selectedParticipantKey,
  onParticipantChange,
  dateSort,
  onDateSortChange,
  hasActiveFilters,
  onClearFilters,
}: BetsFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const activeCount =
    (resultFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (selectedCountryId != null ? 1 : 0) +
    (selectedParticipantKey != null ? 1 : 0) +
    (dateSort !== 'recent' ? 1 : 0)

  const filters = (
    <>
      <div className="lg:grid lg:grid-cols-2 lg:gap-3 xl:grid-cols-4">
        <SidebarFilterSection title="Resultado" variant="card">
          {resultFilterOptions.map((option) => (
            <SidebarFilterOption
              key={option.id}
              label={option.label}
              count={option.count}
              isActive={resultFilter === option.id}
              onClick={() =>
                onResultFilterChange(toggleFilter(resultFilter, option.id, 'all'))
              }
            />
          ))}
        </SidebarFilterSection>

        <SidebarFilterSection title="Status" variant="card">
          {statusFilterOptions.map((option) => (
            <SidebarFilterOption
              key={option.id}
              label={option.label}
              count={option.count}
              isActive={statusFilter === option.id}
              onClick={() =>
                onStatusFilterChange(toggleFilter(statusFilter, option.id, 'all'))
              }
            />
          ))}
        </SidebarFilterSection>

        <BetsTeamParticipantFilterCard
          countryFilterOptions={countryFilterOptions}
          selectedCountryId={selectedCountryId}
          onCountryChange={onCountryChange}
          participantFilterOptions={participantFilterOptions}
          selectedParticipantKey={selectedParticipantKey}
          onParticipantChange={onParticipantChange}
        />

        <SidebarFilterSection title="Ordem" variant="card">
          {BET_DATE_SORT_OPTIONS.map((option) => (
            <SidebarFilterOption
              key={option.id}
              label={option.label}
              isActive={dateSort === option.id}
              onClick={() => onDateSortChange(option.id)}
            />
          ))}
        </SidebarFilterSection>
      </div>

      {hasActiveFilters && (
        <ClearFiltersButton onClick={onClearFilters} />
      )}
    </>
  )

  return (
    <div className="mb-4">
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="bets-filters-panel"
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-600/40 bg-pitch-800/60 px-4 py-3.5 text-base font-semibold text-white transition hover:border-slate-500/60 hover:bg-pitch-700/60"
        >
          <span className="inline-flex items-center gap-2">
            <FilterIcon />
            Filtrar palpites
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
              id="bets-filters-panel"
              className={`mt-3 transition-all duration-300 ease-out ${
                isOpen
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none -translate-y-2 opacity-0'
              }`}
            >
              {filters}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">{filters}</div>
    </div>
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
