import type { MatchTimelineEvent, MatchTimelineKind, SportsdbTimelineEntry } from '../models/sportsdb.types'
import {
  formatMatchGoalDetail,
  translateMatchEventDetail,
} from './matchEventDetailPt'
import { formatGoalMinute, parseMinuteSortValue } from './matchMinute'

function resolveTimelineKind(entry: SportsdbTimelineEntry): MatchTimelineKind {
  const timeline = entry.strTimeline?.trim().toLowerCase() ?? ''
  const detail = entry.strTimelineDetail?.trim().toLowerCase() ?? ''

  if (timeline === 'goal' || timeline.includes('goal') || detail.includes('goal')) {
    if (detail.includes('disallowed')) return 'var'
    return 'goal'
  }

  if (timeline === 'var' || detail.includes('var')) return 'var'
  if (timeline === 'card') return 'card'
  if (timeline === 'subst' || timeline === 'substitution') return 'substitution'

  return 'other'
}

function isOwnGoal(detail: string): boolean {
  return detail.toLowerCase().includes('own goal')
}

export function mapTimelineToEvents(
  entries: SportsdbTimelineEntry[] | null | undefined,
): MatchTimelineEvent[] {
  if (!entries?.length) return []

  return entries
    .map((entry, index) => {
      const kind = resolveTimelineKind(entry)
      const rawDetail = entry.strTimelineDetail?.trim() || entry.strTimeline?.trim() || 'Evento'
      const playerName = entry.strPlayer?.trim() || 'Jogador desconhecido'
      const assistName = entry.strAssist?.trim() || null

      return {
        id: entry.idTimeline?.trim() || `${entry.idEvent}-${index}`,
        kind,
        minute: parseMinuteSortValue(entry.intTime),
        minuteLabel: formatGoalMinute(entry.intTime),
        playerName,
        assistName: assistName && assistName !== '0' ? assistName : null,
        teamName: entry.strTeam?.trim() || 'Time desconhecido',
        isHomeTeam: entry.strHome?.trim().toLowerCase() === 'yes',
        detail: rawDetail,
        isOwnGoal: isOwnGoal(rawDetail),
      }
    })
    .sort((left, right) => left.minute - right.minute)
}

export function formatTimelineDetail(event: MatchTimelineEvent): string {
  if (event.kind === 'goal') {
    return formatMatchGoalDetail(event.detail, event.isOwnGoal)
  }

  return translateMatchEventDetail(event.detail)
}

export { translateMatchEventDetail, formatMatchGoalDetail }
