const THESPORTSDB_TEAM_ALIASES: Record<string, string> = {
  'Korea Republic': 'South Korea',
  'Congo DR': 'DR Congo',
  USA: 'United States',
  'Czech Republic': 'Czechia',
  'Ivory Coast': 'Cote dIvoire',
  Türkiye: 'Turkey',
}

export function toSportsdbTeamName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''

  return THESPORTSDB_TEAM_ALIASES[trimmed] ?? trimmed
}

export function toSportsdbSearchToken(name: string): string {
  return toSportsdbTeamName(name).replace(/\s+/g, '_')
}
