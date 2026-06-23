import { useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { PageHeader } from '../components/layout/PageHeader'
import { StandingsFiltersPanel } from '../components/standings/StandingsFiltersPanel'
import { StandingsGroupStageInfo } from '../components/standings/StandingsGroupStageInfo'
import { StandingsGroupTable } from '../components/standings/StandingsGroupTable'
import { StandingsSkeleton } from '../components/standings/StandingsSkeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { ClearFiltersButton } from '../components/ui/ClearFiltersButton'
import {
  DEFAULT_STANDINGS_GRID_COLUMNS,
  getStandingsGridClass,
  type StandingsGridColumns,
} from '../utils/standingsGrid'
import { useStandingsViewModel } from '../viewmodels/useStandingsViewModel'

export function StandingsView() {
  const {
    standings,
    countryFilterOptions,
    selectedCountryId,
    isLoading,
    error,
    isEmpty,
    isFilterEmpty,
    filterEmptyMessage,
    hasActiveFilters,
    reload,
    setSelectedCountryId,
    clearFilters,
  } = useStandingsViewModel()
  const [columnsPerRow, setColumnsPerRow] = useState<StandingsGridColumns>(
    DEFAULT_STANDINGS_GRID_COLUMNS,
  )
  const effectiveColumnsPerRow: StandingsGridColumns =
    selectedCountryId != null ? 1 : columnsPerRow
  const hasActiveViewFilters =
    hasActiveFilters || columnsPerRow !== DEFAULT_STANDINGS_GRID_COLUMNS

  function handleClearFilters() {
    clearFilters()
    setColumnsPerRow(DEFAULT_STANDINGS_GRID_COLUMNS)
  }

  return (
    <AppLayout>
      <PageHeader title="Classificação" description="Tabelas dos grupos da Copa do Mundo 2026." />

      <StandingsGroupStageInfo />

      {isLoading && <StandingsSkeleton />}
      {error && (
        <ErrorState message={error.message} statusCode={error.statusCode} onRetry={reload} />
      )}
      {isEmpty && (
        <EmptyState
          title="Classificação indisponível"
          message="Não foi possível montar as tabelas dos grupos da fase de grupos."
        />
      )}

      {!isLoading && !error && !isEmpty && (
        <>
          <StandingsFiltersPanel
            countryFilterOptions={countryFilterOptions}
            selectedCountryId={selectedCountryId}
            onCountryChange={setSelectedCountryId}
            columnsPerRow={columnsPerRow}
            onColumnsPerRowChange={setColumnsPerRow}
            hasActiveFilters={hasActiveViewFilters}
            onClearFilters={handleClearFilters}
          />

          {isFilterEmpty && (
            <div>
              <EmptyState title="Nenhum grupo neste filtro" message={filterEmptyMessage} />
              {hasActiveViewFilters && (
                <ClearFiltersButton onClick={handleClearFilters} className="mt-4" />
              )}
            </div>
          )}

          {!isFilterEmpty && (
            <div className={`grid gap-6 ${getStandingsGridClass(effectiveColumnsPerRow)}`}>
              {standings.map((standing) => (
                <StandingsGroupTable key={standing.group ?? standing.stage} standing={standing} />
              ))}
            </div>
          )}
        </>
      )}
    </AppLayout>
  )
}
