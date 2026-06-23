export function parseMinuteSortValue(value: string | null): number {
  if (!value?.trim()) return Number.MAX_SAFE_INTEGER

  const match = value.trim().match(/^(\d+)(?:\+(\d+))?/)
  if (!match) return Number.MAX_SAFE_INTEGER

  const base = Number.parseInt(match[1], 10)
  const added = match[2] ? Number.parseInt(match[2], 10) : 0

  return base * 100 + added
}

export function formatGoalMinute(value: string | null): string {
  if (!value?.trim()) return '0'

  const match = value.trim().match(/^(\d+)(?:\+(\d+))?$/)
  if (!match) return value.trim()

  return match[2] ? `${match[1]}+${match[2]}` : match[1]
}
