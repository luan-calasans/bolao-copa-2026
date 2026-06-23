const STAT_LABELS_PT: Record<string, string> = {
  'Ball Possession': 'Posse de bola',
  'Shots on Goal': 'Chutes no gol',
  'Shots off Goal': 'Chutes para fora',
  'Total Shots': 'Total de chutes',
  'Blocked Shots': 'Chutes bloqueados',
  'Shots insidebox': 'Chutes dentro da área',
  'Shots outsidebox': 'Chutes fora da área',
  'Corner Kicks': 'Escanteios',
  Fouls: 'Faltas',
  Offsides: 'Impedimentos',
  'Yellow Cards': 'Cartões amarelos',
  'Red Cards': 'Cartões vermelhos',
  'Goalkeeper Saves': 'Defesas do goleiro',
  'Total passes': 'Passes totais',
  'Passes accurate': 'Passes certos',
  'Passes %': 'Precisão de passes',
}

function parseStatNumber(value: string | null | undefined): number | null {
  if (!value?.trim()) return null

  const normalized = value.trim().replace('%', '')
  const parsed = Number.parseFloat(normalized)

  return Number.isFinite(parsed) ? parsed : null
}

export function translateStatLabel(label: string): string {
  return STAT_LABELS_PT[label.trim()] ?? label.trim()
}

export function isPercentageStat(label: string): boolean {
  return /possession|passes %/i.test(label)
}

export function mapEventStats(
  entries: Array<{
    idStatistic: string
    strStat: string
    intHome: string | null
    intAway: string | null
  }> | null | undefined,
) {
  if (!entries?.length) return []

  return entries.map((entry) => {
    const label = translateStatLabel(entry.strStat)
    const homeValue = entry.intHome?.trim() || '0'
    const awayValue = entry.intAway?.trim() || '0'

    return {
      id: entry.idStatistic,
      label,
      homeValue: isPercentageStat(entry.strStat) ? `${homeValue}%` : homeValue,
      awayValue: isPercentageStat(entry.strStat) ? `${awayValue}%` : awayValue,
      homeNumeric: parseStatNumber(homeValue),
      awayNumeric: parseStatNumber(awayValue),
      isPercentage: isPercentageStat(entry.strStat),
    }
  })
}
