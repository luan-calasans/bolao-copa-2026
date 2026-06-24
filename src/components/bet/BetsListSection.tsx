import { BetsFilterPanel } from './BetsFilterPanel'
import { BetsTable } from './BetsTable'
import { EmptyState } from '../ui/EmptyState'
import { ClearFiltersButton } from '../ui/ClearFiltersButton'
import { useBetsTableFilters } from '../../hooks/useBetsTableFilters'
import type { BetResultFilter } from '../../utils/betListFilters'
import type { BetsMatchGroup } from '../../utils/matchBetRows'
import type { BetsTableItem } from '../../models/betsTable'

interface BetsListSectionProps {
  groups: BetsMatchGroup[]
  searchInputId: string
  sortable?: boolean
  showGeneratedAt?: boolean
  showFilters?: boolean
  linkParticipantProfile?: boolean
  showReceiptLink?: boolean
  showParticipantColumn?: boolean
  searchPlaceholder?: string
  deletingReceiptId?: string | null
  onDelete?: (receiptId: string, participantName?: string) => void
  canDeleteBet?: (item: BetsTableItem) => boolean
  resultFilter?: BetResultFilter
  onResultFilterChange?: (filter: BetResultFilter) => void
  showClearFilters?: boolean
}

export function BetsListSection({
  groups,
  searchInputId,
  sortable = false,
  showGeneratedAt = false,
  showFilters = true,
  linkParticipantProfile = true,
  showReceiptLink = false,
  showParticipantColumn = true,
  searchPlaceholder = 'Buscar por nome, time ou confronto...',
  deletingReceiptId = null,
  onDelete,
  canDeleteBet,
  resultFilter: controlledResultFilter,
  onResultFilterChange: onControlledResultFilterChange,
  showClearFilters = false,
}: BetsListSectionProps) {
  const {
    searchQuery,
    setSearchQuery,
    resultFilter,
    setResultFilter,
    resultFilterOptions,
    statusFilter,
    setStatusFilter,
    statusFilterOptions,
    selectedCountryId,
    setSelectedCountryId,
    countryFilterOptions,
    selectedParticipantKey,
    setSelectedParticipantKey,
    participantFilterOptions,
    dateSort,
    setDateSort,
    filteredItems,
    hasActiveFilters,
    hasClearableFilters,
    isSearchEmpty,
    isFilterEmpty,
    clearFilters,
  } = useBetsTableFilters(groups, {
    resultFilter: controlledResultFilter,
    onResultFilterChange: onControlledResultFilterChange,
  })

  return (
    <>
      {showFilters && (
        <BetsFilterPanel
          resultFilter={resultFilter}
          resultFilterOptions={resultFilterOptions}
          onResultFilterChange={setResultFilter}
          statusFilter={statusFilter}
          statusFilterOptions={statusFilterOptions}
          onStatusFilterChange={setStatusFilter}
          countryFilterOptions={countryFilterOptions}
          selectedCountryId={selectedCountryId}
          onCountryChange={setSelectedCountryId}
          participantFilterOptions={participantFilterOptions}
          selectedParticipantKey={selectedParticipantKey}
          onParticipantChange={setSelectedParticipantKey}
          dateSort={dateSort}
          onDateSortChange={setDateSort}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      )}

      <div className="mb-4">
        <label htmlFor={searchInputId} className="sr-only">
          Buscar palpites
        </label>
        <input
          id={searchInputId}
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-slate-600/50 bg-pitch-900/80 px-4 py-3.5 text-base text-white placeholder:text-slate-500 outline-none transition focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/30"
        />
      </div>

      {showClearFilters && hasClearableFilters && (
        <ClearFiltersButton onClick={clearFilters} variant="mobile" />
      )}

      {isSearchEmpty ? (
        <EmptyState
          title="Nenhum palpite encontrado"
          message="Tente buscar por outro nome, time ou confronto."
        />
      ) : isFilterEmpty ? (
        <EmptyState
          title="Nenhum palpite neste filtro"
          message="Tente outro resultado, status, seleção, participante ou limpe os filtros."
        />
      ) : (
        <BetsTable
          items={filteredItems}
          deletingReceiptId={deletingReceiptId}
          onDelete={onDelete}
          canDeleteBet={canDeleteBet}
          showMatchMeta
          showMatchTeams
          showGeneratedAt={showGeneratedAt}
          sortable={sortable}
          linkParticipantProfile={linkParticipantProfile}
          showReceiptLink={showReceiptLink}
          showParticipantColumn={showParticipantColumn}
        />
      )}
    </>
  )
}
