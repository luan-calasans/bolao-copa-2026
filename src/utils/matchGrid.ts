export type MatchGridColumns = 1 | 2 | 3

export const DEFAULT_MATCH_GRID_COLUMNS: MatchGridColumns = 3

export function getMatchGridClass(columns: MatchGridColumns): string {
  const classes: Record<MatchGridColumns, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
  }

  return classes[columns]
}

export function getMaxMatchGridColumns(isLargeDesktop: boolean): MatchGridColumns {
  return isLargeDesktop ? 3 : 2
}

export function clampMatchGridColumns(
  columns: MatchGridColumns,
  isLargeDesktop: boolean,
): MatchGridColumns {
  const max = getMaxMatchGridColumns(isLargeDesktop)
  return columns > max ? max : columns
}

export function shouldStackMatchCardActions(
  columnsPerRow: MatchGridColumns,
  isLargeDesktop: boolean,
): boolean {
  return columnsPerRow === 3 && isLargeDesktop
}
