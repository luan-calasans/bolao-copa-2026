import { useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { MatchFiltersPanel } from '../components/match/MatchFiltersPanel'
import { MatchFiltersSkeleton } from '../components/match/MatchFiltersSkeleton'
import { MatchSection } from '../components/match/MatchSection'
import { MatchSectionsList } from '../components/match/MatchSectionsList'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { MatchListSkeleton } from '../components/match/MatchListSkeleton'
import { DataLastUpdated } from '../components/ui/DataLastUpdated'
import { Skeleton } from '../components/ui/Skeleton'
import { useLargeDesktop } from '../hooks/useLargeDesktop'
import { useHomeViewModel } from '../viewmodels/useHomeViewModel'
import {
  clampMatchGridColumns,
  DEFAULT_MATCH_GRID_COLUMNS,
  type MatchGridColumns,
} from '../utils/matchGrid'

export function HomeView() {
  const {
    filter,
    filterOptions,
    dateFilter,
    countryFilterOptions,
    selectedCountryId,
    visibleGroups,
    isLoading,
    isReloading,
    error,
    isEmpty,
    isFilterEmpty,
    filterEmptyMessage,
    hasActiveFilters,
    lastFetchedAt,
    reload,
    setFilter,
    setDateFilterPreset,
    setSelectedCountryId,
    clearFilters,
  } = useHomeViewModel()

  const [columnsPerRow, setColumnsPerRow] = useState<MatchGridColumns>(DEFAULT_MATCH_GRID_COLUMNS)
  const isLargeDesktop = useLargeDesktop()
  const effectiveColumns = clampMatchGridColumns(columnsPerRow, isLargeDesktop)

  function handleColumnsPerRowChange(columns: MatchGridColumns) {
    setColumnsPerRow(columns)
  }

  const hasLoadedOnce = Boolean(lastFetchedAt)
  const showFilters = !error && (!isLoading ? !isEmpty : hasLoadedOnce)
  const showFilterSkeleton = isLoading && !hasLoadedOnce
  const showListSkeleton = isLoading && !hasLoadedOnce
  const showLoadedContent = !error && !isEmpty && (hasLoadedOnce || !isLoading)
  const showMatchContent = showLoadedContent && !isFilterEmpty
  const showFilterEmptyState = showLoadedContent && isFilterEmpty
  const showSections = filter === 'all'
  const showSidebarLayout = showFilterSkeleton || showFilters
  const singleSectionTitle =
    filter === 'live'
      ? 'Ao vivo'
      : filter === 'upcoming'
        ? 'Jogos futuros'
        : filter === 'finished'
          ? 'Encerrados'
          : filter === 'undefined'
            ? 'Não definidos'
            : ''

  return (
    <AppLayout>
      <div
        className={
          showSidebarLayout
            ? 'min-w-0 max-w-full lg:grid lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] lg:items-start lg:gap-8'
            : 'min-w-0 max-w-full'
        }
      >
        {showFilterSkeleton && <MatchFiltersSkeleton />}
        {showFilters && (
          <MatchFiltersPanel
            filter={filter}
            filterOptions={filterOptions}
            dateFilter={dateFilter}
            countryFilterOptions={countryFilterOptions}
            selectedCountryId={selectedCountryId}
            columnsPerRow={columnsPerRow}
            onFilterChange={setFilter}
            onDatePresetChange={setDateFilterPreset}
            onCountryChange={setSelectedCountryId}
            onColumnsPerRowChange={handleColumnsPerRowChange}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onReload={() => void reload()}
            isReloading={isReloading}
          />
        )}

        <div className="min-w-0">
          {!error && (lastFetchedAt || showListSkeleton) && (
            <div className="mb-4 min-h-4">
              {lastFetchedAt ? (
                <DataLastUpdated lastUpdated={lastFetchedAt} />
              ) : (
                <Skeleton className="mx-auto h-4 w-48" />
              )}
            </div>
          )}
          {showListSkeleton && <MatchListSkeleton columnsPerRow={effectiveColumns} />}
          {error && (
            <ErrorState message={error.message} statusCode={error.statusCode} onRetry={reload} />
          )}
          {isEmpty && <EmptyState />}

          {showFilterEmptyState && (
            <EmptyState title="Nenhum jogo neste filtro" message={filterEmptyMessage} />
          )}

          {showMatchContent && showSections && (
            <MatchSectionsList groups={visibleGroups} columnsPerRow={effectiveColumns} />
          )}

          {showMatchContent && !showSections && (
            <MatchSection
              title={singleSectionTitle}
              variant={
                filter === 'live'
                  ? 'live'
                  : filter === 'upcoming'
                    ? 'upcoming'
                    : filter === 'finished'
                      ? 'finished'
                      : filter === 'undefined'
                        ? 'undefined'
                        : undefined
              }
              columnsPerRow={effectiveColumns}
              matches={
                filter === 'live'
                  ? visibleGroups.live
                  : filter === 'upcoming'
                    ? visibleGroups.upcoming
                    : filter === 'finished'
                      ? visibleGroups.finished
                      : visibleGroups.undefined
              }
            />
          )}
        </div>
      </div>
    </AppLayout>
  )
}
