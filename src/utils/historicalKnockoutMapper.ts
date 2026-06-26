import type { KnockoutBracket, KnockoutMatch, KnockoutRound, KnockoutStage } from '../models/knockout'
import type { Team } from '../models/team'
import type { HistoricalRawMatch } from '../models/historicalWorldCup'
import { canonicalizeTeamName, getHistoricalTeamDisplayName, getTeamCode, syntheticTeamId } from './historicalTeamNames'
import { getHistoricalTeamCrestUrl } from './historicalTeamCrest'
import {
  findFinalRoundDecisiveMatch,
  getExtraTimeScore,
  getPenaltyScore,
  getRegulationScore,
  isCountedHistoricalMatch,
  resolveMatchOutcome,
} from './historicalMatchUtils'
import { orderKnockoutRounds } from './knockoutBracketOrdering'

const STAGE_ORDER: KnockoutStage[] = [
  'LAST_32',
  'LAST_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE',
  'FINAL',
]

const STAGE_LABELS: Record<KnockoutStage, string> = {
  LAST_32: 'Rodada de 32',
  LAST_16: 'Oitavas de final',
  QUARTER_FINALS: 'Quartas de final',
  SEMI_FINALS: 'Semifinais',
  THIRD_PLACE: 'Disputa de 3º lugar',
  FINAL: 'Final',
}

function mapRoundToStage(round: string): KnockoutStage | null {
  const normalized = round.toLowerCase()

  if (normalized.includes('round of 32')) return 'LAST_32'
  if (normalized.includes('round of 16')) return 'LAST_16'
  if (normalized.includes('quarter')) return 'QUARTER_FINALS'
  if (normalized.includes('semi')) return 'SEMI_FINALS'
  if (normalized.includes('third')) return 'THIRD_PLACE'
  if (normalized === 'final') return 'FINAL'
  if (normalized.includes('preliminary round')) return 'QUARTER_FINALS'

  return null
}

function buildHistoricalTeam(name: string, codeFromData?: string | null): Team {
  const canonical = canonicalizeTeamName(name)
  const displayName = getHistoricalTeamDisplayName(name)

  return {
    id: syntheticTeamId(canonical),
    name: displayName,
    shortName: displayName,
    tla: getTeamCode(canonical, codeFromData),
    crest: getHistoricalTeamCrestUrl(name) ?? '',
    isDefined: true,
  }
}

function parseHistoricalClockTime(time: string): string | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null

  return `${match[1].padStart(2, '0')}:${match[2]}`
}

function buildUtcDate(match: HistoricalRawMatch): string | null {
  if (!match.date) return null

  const clock = match.time?.trim() ? parseHistoricalClockTime(match.time) : null
  if (!clock) {
    return `${match.date}T12:00:00.000Z`
  }

  return `${match.date}T${clock}:00.000Z`
}

function mapHistoricalMatch(match: HistoricalRawMatch, index: number, stage: KnockoutStage): KnockoutMatch {
  const regulation = getRegulationScore(match.score)
  const penalties = getPenaltyScore(match.score)
  const extraTime = getExtraTimeScore(match.score)
  const outcome = resolveMatchOutcome(match.score)

  const homeTeam = buildHistoricalTeam(match.team1)
  const awayTeam = buildHistoricalTeam(match.team2)

  return {
    key: `${stage}-${index}-${match.date}-${homeTeam.name}-${awayTeam.name}`,
    stage,
    home: {
      team: homeTeam,
      label: homeTeam.name,
      isProjected: false,
    },
    away: {
      team: awayTeam,
      label: awayTeam.name,
      isProjected: false,
    },
    score: {
      home: regulation?.[0] ?? null,
      away: regulation?.[1] ?? null,
    },
    penalties:
      penalties && regulation && regulation[0] === regulation[1]
        ? { home: penalties[0], away: penalties[1] }
        : null,
    extraTime:
      extraTime && regulation && regulation[0] === regulation[1] && !penalties
        ? { home: extraTime[0], away: extraTime[1] }
        : null,
    status: outcome == null ? 'scheduled' : 'finished',
    utcDate: buildUtcDate(match),
    isProjected: false,
  }
}

export function buildHistoricalFinalRoundBracket(matches: HistoricalRawMatch[]): KnockoutBracket | null {
  const finalRoundMatches = matches.filter((match) => match.round === 'Final Round')
  if (finalRoundMatches.length === 0) return null

  const rounds: KnockoutRound[] = [
    {
      stage: 'SEMI_FINALS',
      label: 'Rodada final',
      matches: finalRoundMatches.map((match, index) =>
        mapHistoricalMatch(match, index, 'SEMI_FINALS'),
      ),
    },
  ]

  const decisiveMatch = findFinalRoundDecisiveMatch(matches)
  if (decisiveMatch) {
    rounds.push({
      stage: 'FINAL',
      label: 'Final',
      matches: [mapHistoricalMatch(decisiveMatch, 0, 'FINAL')],
    })
  }

  return { rounds }
}

export function buildHistoricalKnockoutBracket(matches: HistoricalRawMatch[]): KnockoutBracket {
  const matchesByStage = new Map<KnockoutStage, HistoricalRawMatch[]>()

  for (const match of matches) {
    if (!isCountedHistoricalMatch(match)) continue

    const stage = mapRoundToStage(match.round)
    if (!stage) continue

    const bucket = matchesByStage.get(stage) ?? []
    bucket.push(match)
    matchesByStage.set(stage, bucket)
  }

  const rounds: KnockoutRound[] = STAGE_ORDER.flatMap((stage) => {
    const stageMatches = matchesByStage.get(stage)
    if (!stageMatches?.length) return []

    return [
      {
        stage,
        label: STAGE_LABELS[stage],
        matches: stageMatches.map((match, index) => mapHistoricalMatch(match, index, stage)),
      },
    ]
  })

  return { rounds: orderKnockoutRounds(rounds) }
}

export { supportsDesktopKnockoutLayout } from '../components/knockout/knockoutBracketLayout'

export function hasKnockoutMatches(matches: HistoricalRawMatch[]): boolean {
  return matches.some((match) => mapRoundToStage(match.round) != null)
}
