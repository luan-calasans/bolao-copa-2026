import type { MatchLineupPlayer, MatchLineups, SportsdbLineupEntry } from '../models/sportsdb.types'

function mapLineupEntry(entry: SportsdbLineupEntry): MatchLineupPlayer {
  const number = entry.intSquadNumber?.trim()
  const parsedNumber = number ? Number.parseInt(number, 10) : null

  return {
    id: entry.idLineup,
    name: entry.strPlayer?.trim() || 'Jogador',
    number: parsedNumber != null && Number.isFinite(parsedNumber) ? parsedNumber : null,
    position: entry.strPosition?.trim() || null,
    isSubstitute: entry.strSubstitute?.trim().toLowerCase() === 'yes',
  }
}

function sortLineup(players: MatchLineupPlayer[]): MatchLineupPlayer[] {
  return [...players].sort((left, right) => {
    if (left.isSubstitute !== right.isSubstitute) {
      return left.isSubstitute ? 1 : -1
    }

    if (left.number != null && right.number != null) {
      return left.number - right.number
    }

    return left.name.localeCompare(right.name, 'pt-BR')
  })
}

export function mapSportsdbLineups(entries: SportsdbLineupEntry[] | null | undefined): MatchLineups | null {
  if (!entries?.length) return null

  const home = sortLineup(
    entries.filter((entry) => entry.strHome?.trim().toLowerCase() === 'yes').map(mapLineupEntry),
  )
  const away = sortLineup(
    entries.filter((entry) => entry.strHome?.trim().toLowerCase() !== 'yes').map(mapLineupEntry),
  )

  if (home.length === 0 && away.length === 0) {
    return null
  }

  return { home, away }
}
