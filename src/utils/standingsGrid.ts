export type StandingsGridColumns = 1 | 2

export const DEFAULT_STANDINGS_GRID_COLUMNS: StandingsGridColumns = 1

export function getStandingsGridClass(columns: StandingsGridColumns): string {
  return columns === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
}
