import type { MatchGoal, SportsdbTimelineEntry } from '../models/sportsdb.types'
import { formatGoalMinute, parseMinuteSortValue } from './matchMinute'

function isMissedPenaltyEntry(entry: SportsdbTimelineEntry): boolean {
  const timeline = entry.strTimeline?.trim().toLowerCase() ?? ''
  const detail = entry.strTimelineDetail?.trim().toLowerCase() ?? ''
  const combined = `${timeline} ${detail}`

  if (/missed penalty|penalty missed/.test(combined)) {
    return true
  }

  if (/\bmiss\b/.test(combined) && /penalt/.test(combined)) {
    return true
  }

  return false
}

function isDisallowedGoalDetail(detail: string): boolean {
  return (
    detail.includes('disallowed') ||
    detail.includes('cancelled') ||
    detail.includes('canceled') ||
    detail.includes('anulado')
  )
}

function isGoalTimelineEntry(entry: SportsdbTimelineEntry): boolean {
  const timeline = entry.strTimeline?.trim().toLowerCase() ?? ''
  const detail = entry.strTimelineDetail?.trim().toLowerCase() ?? ''

  if (isMissedPenaltyEntry(entry)) return false
  if (isDisallowedGoalDetail(detail)) return false

  if (timeline === 'goal') return true
  if (timeline.includes('goal')) return true
  if (timeline === 'penalty' && !detail.includes('miss')) return true
  if (detail.includes('goal')) return true

  return false
}

function isOwnGoal(detail: string): boolean {
  return detail.toLowerCase().includes('own goal')
}

export function mapTimelineToGoals(entries: SportsdbTimelineEntry[] | null | undefined): MatchGoal[] {
  if (!entries?.length) return []

  return entries
    .filter(isGoalTimelineEntry)
    .map((entry, index) => {
      const minuteLabel = formatGoalMinute(entry.intTime)
      const detail = entry.strTimelineDetail?.trim() || 'Gol'
      const playerName = entry.strPlayer?.trim() || 'Jogador desconhecido'
      const teamName = entry.strTeam?.trim() || 'Time desconhecido'

      return {
        id: entry.idTimeline?.trim() || `${entry.idEvent}-${index}`,
        minute: parseMinuteSortValue(entry.intTime),
        minuteLabel,
        playerName,
        teamName,
        isHomeTeam: entry.strHome?.trim().toLowerCase() === 'yes',
        detail,
        isOwnGoal: isOwnGoal(detail),
      }
    })
    .sort((left, right) => left.minute - right.minute)
}
