import { getMatchWinner, getMatchLoser } from '../components/knockout/knockoutBracketLayout'
import type {
  KnockoutBracket,
  KnockoutMatch,
  KnockoutParticipant,
  KnockoutRound,
  KnockoutStage,
} from '../models/knockout'
import type { MatchStatus } from '../models/match'
import { KNOCKOUT_ROUND_LABELS, KNOCKOUT_STAGE_ORDER } from './knockoutBracketTemplate'
import { orderKnockoutRounds } from './knockoutBracketOrdering'

export type SimulatorPickSide = 'home' | 'away'
export type SimulatorPicks = Record<string, SimulatorPickSide>

export type SimulatorScore = { home: number | null; away: number | null }
export type SimulatorScores = Record<string, SimulatorScore>

export interface KnockoutSimulatorProps {
  onPickWinner: (matchKey: string, side: SimulatorPickSide) => void
  onScoreChange: (matchKey: string, home: number | null, away: number | null) => void
  isMatchPickable: (match: KnockoutMatch) => boolean
  getWinner: (match: KnockoutMatch) => KnockoutParticipant | null
  picks: SimulatorPicks
  scores: SimulatorScores
  onResetSimulation?: () => void
  hasPicks?: boolean
}

const ALL_STAGES: KnockoutStage[] = [...KNOCKOUT_STAGE_ORDER]

function createParticipant(
  team: KnockoutParticipant['team'],
  label: string,
  isProjected: boolean,
): KnockoutParticipant {
  return { team, label, isProjected }
}

function isRealFinishedMatch(match: KnockoutMatch): boolean {
  if (match.status !== 'finished') return false
  return match.score.home != null && match.score.away != null
}

function hasUserScore(scores: SimulatorScores, matchKey: string): boolean {
  const score = scores[matchKey]
  return score != null && score.home != null && score.away != null
}

export function isMatchPickable(match: KnockoutMatch, picks: SimulatorPicks = {}): boolean {
  if (!match.home.team || !match.away.team) return false

  if (picks[match.key] != null) return true

  if (isRealFinishedMatch(match) && !match.isProjected) return false
  return true
}

export function resolveSimulatedWinner(
  match: KnockoutMatch,
  picks: SimulatorPicks,
  scores: SimulatorScores = {},
): KnockoutParticipant | null {
  const userScore = scores[match.key]
  if (userScore && userScore.home != null && userScore.away != null) {
    return getMatchWinner({
      ...match,
      status: 'finished',
      score: { home: userScore.home, away: userScore.away },
    })
  }

  const pick = picks[match.key]
  if (pick && match[pick].team) {
    return match[pick]
  }

  return getMatchWinner(match)
}

function applySimulatorDisplayState(
  match: KnockoutMatch,
  picks: SimulatorPicks,
  scores: SimulatorScores,
): KnockoutMatch {
  if (isRealFinishedMatch(match) && !picks[match.key] && !hasUserScore(scores, match.key)) {
    return match
  }

  if (hasUserScore(scores, match.key)) {
    const userScore = scores[match.key]!
    return {
      ...match,
      status: 'finished' as MatchStatus,
      score: { home: userScore.home, away: userScore.away },
      isProjected: false,
    }
  }

  if (picks[match.key]) {
    return {
      ...match,
      status: 'scheduled' as MatchStatus,
      score: { home: null, away: null },
      isProjected: match.isProjected,
    }
  }

  return match
}

function resolveWinner(
  match: KnockoutMatch,
  picks: SimulatorPicks,
  scores: SimulatorScores,
): KnockoutParticipant | null {
  return resolveSimulatedWinner(match, picks, scores)
}

function buildParticipantFromSource(
  sourceMatch: KnockoutMatch | undefined,
  picks: SimulatorPicks,
  scores: SimulatorScores,
  fallbackLabel: string,
): KnockoutParticipant {
  if (!sourceMatch) {
    return createParticipant(null, fallbackLabel, true)
  }

  const winner = resolveWinner(sourceMatch, picks, scores)
  if (winner?.team) {
    return createParticipant(winner.team, winner.team.shortName || winner.team.name, false)
  }

  return createParticipant(null, fallbackLabel, true)
}

function buildLoserParticipantFromSource(
  sourceMatch: KnockoutMatch | undefined,
  picks: SimulatorPicks,
  scores: SimulatorScores,
  fallbackLabel: string,
): KnockoutParticipant {
  if (!sourceMatch) {
    return createParticipant(null, fallbackLabel, true)
  }

  const displayMatch = applySimulatorDisplayState(sourceMatch, picks, scores)
  const loser = getMatchLoser(displayMatch)
  if (loser?.team) {
    return createParticipant(loser.team, loser.team.shortName || loser.team.name, false)
  }

  const pick = picks[sourceMatch.key]
  if (pick && sourceMatch[pick].team) {
    const loserParticipant = pick === 'home' ? sourceMatch.away : sourceMatch.home
    if (loserParticipant.team) {
      return createParticipant(
        loserParticipant.team,
        loserParticipant.team.shortName || loserParticipant.team.name,
        false,
      )
    }
  }

  return createParticipant(null, fallbackLabel, true)
}

function rebuildLaterRound(
  stage: KnockoutStage,
  previousMatches: KnockoutMatch[],
  existingRound: KnockoutRound | undefined,
  picks: SimulatorPicks,
  scores: SimulatorScores,
): KnockoutRound | null {
  if (!existingRound || existingRound.matches.length === 0) return null

  let sourceMatches = previousMatches

  if (stage === 'FINAL' || stage === 'THIRD_PLACE') {
    sourceMatches = previousMatches.slice(-2)
  }

  const matches = existingRound.matches.map((match, index) => {
    if (stage === 'FINAL') {
      const homeSource = sourceMatches[0]
      const awaySource = sourceMatches[1]
      const updated: KnockoutMatch = {
        ...match,
        home: buildParticipantFromSource(homeSource, picks, scores, match.home.label),
        away: buildParticipantFromSource(awaySource, picks, scores, match.away.label),
      }
      return applySimulatorDisplayState(updated, picks, scores)
    }

    if (stage === 'THIRD_PLACE') {
      const homeSource = sourceMatches[0]
      const awaySource = sourceMatches[1]
      const updated: KnockoutMatch = {
        ...match,
        home: buildLoserParticipantFromSource(homeSource, picks, scores, match.home.label),
        away: buildLoserParticipantFromSource(awaySource, picks, scores, match.away.label),
      }
      return applySimulatorDisplayState(updated, picks, scores)
    }

    const homeSource = sourceMatches[index * 2]
    const awaySource = sourceMatches[index * 2 + 1]
    const updated: KnockoutMatch = {
      ...match,
      home: buildParticipantFromSource(homeSource, picks, scores, match.home.label),
      away: buildParticipantFromSource(awaySource, picks, scores, match.away.label),
    }
    return applySimulatorDisplayState(updated, picks, scores)
  })

  return {
    stage,
    label: KNOCKOUT_ROUND_LABELS[stage] ?? stage,
    matches,
  }
}

export function applySimulatorPicks(
  bracket: KnockoutBracket,
  picks: SimulatorPicks,
  scores: SimulatorScores = {},
): KnockoutBracket {
  const roundByStage = new Map(bracket.rounds.map((round) => [round.stage, round]))
  const rebuilt: KnockoutRound[] = []

  let previousMatches: KnockoutMatch[] = []

  for (const stage of ALL_STAGES) {
    const existing = roundByStage.get(stage)
    if (!existing) continue

    if (stage === 'LAST_32') {
      const matches = existing.matches.map((match) => applySimulatorDisplayState(match, picks, scores))
      rebuilt.push({
        stage,
        label: existing.label,
        matches,
      })
      previousMatches = matches
      continue
    }

    if (previousMatches.length === 0) {
      const matches = existing.matches.map((match) => applySimulatorDisplayState(match, picks, scores))
      rebuilt.push({
        stage,
        label: existing.label,
        matches,
      })
      if (stage !== 'THIRD_PLACE') {
        previousMatches = matches
      }
      continue
    }

    const round = rebuildLaterRound(stage, previousMatches, existing, picks, scores)
    if (!round) continue

    rebuilt.push(round)
    if (stage !== 'THIRD_PLACE') {
      previousMatches = round.matches
    }
  }

  return { rounds: orderKnockoutRounds(rebuilt) }
}

function getRoundByStage(bracket: KnockoutBracket, stage: KnockoutStage): KnockoutRound | undefined {
  return bracket.rounds.find((round) => round.stage === stage)
}

function findMatchPosition(
  bracket: KnockoutBracket,
  matchKey: string,
): { stage: KnockoutStage; index: number } | null {
  for (const round of bracket.rounds) {
    const index = round.matches.findIndex((match) => match.key === matchKey)
    if (index >= 0) {
      return { stage: round.stage, index }
    }
  }
  return null
}

function collectDescendantMatchKeys(
  bracket: KnockoutBracket,
  stage: KnockoutStage,
  index: number,
  descendants: string[],
): void {
  if (stage === 'FINAL' || stage === 'THIRD_PLACE') return

  if (stage === 'LAST_32' || stage === 'LAST_16') {
    const nextStage: KnockoutStage = stage === 'LAST_32' ? 'LAST_16' : 'QUARTER_FINALS'
    const nextRound = getRoundByStage(bracket, nextStage)
    const parentIndex = Math.floor(index / 2)
    const parentMatch = nextRound?.matches[parentIndex]

    if (!parentMatch) return

    descendants.push(parentMatch.key)
    collectDescendantMatchKeys(bracket, nextStage, parentIndex, descendants)
    return
  }

  if (stage === 'QUARTER_FINALS') {
    const nextRound = getRoundByStage(bracket, 'SEMI_FINALS')
    const semiIndex = index % 2 === 0 ? 0 : 1
    const semiMatch = nextRound?.matches[semiIndex]

    if (!semiMatch) return

    descendants.push(semiMatch.key)
    collectDescendantMatchKeys(bracket, 'SEMI_FINALS', semiIndex, descendants)
    return
  }

  if (stage === 'SEMI_FINALS') {
    const finalMatch = getRoundByStage(bracket, 'FINAL')?.matches[0]
    const thirdPlaceMatch = getRoundByStage(bracket, 'THIRD_PLACE')?.matches[0]

    if (finalMatch) descendants.push(finalMatch.key)
    if (thirdPlaceMatch) descendants.push(thirdPlaceMatch.key)
  }
}

export function getDescendantMatchKeys(bracket: KnockoutBracket, changedMatchKey: string): string[] {
  const position = findMatchPosition(bracket, changedMatchKey)
  if (!position) return []

  const descendants: string[] = []
  collectDescendantMatchKeys(bracket, position.stage, position.index, descendants)
  return descendants
}

export function pruneDownstreamPicks(
  bracket: KnockoutBracket,
  picks: SimulatorPicks,
  changedMatchKey: string,
): SimulatorPicks {
  const descendantKeys = getDescendantMatchKeys(bracket, changedMatchKey)
  if (descendantKeys.length === 0) return picks

  const next = { ...picks }
  for (const key of descendantKeys) {
    delete next[key]
  }
  return next
}

export function applySimulatorPick(
  bracket: KnockoutBracket,
  picks: SimulatorPicks,
  matchKey: string,
  side: SimulatorPickSide,
): SimulatorPicks {
  if (picks[matchKey] === side) return picks

  const withPick = { ...picks, [matchKey]: side }
  return pruneDownstreamPicks(bracket, withPick, matchKey)
}

export function pruneDownstreamScores(
  bracket: KnockoutBracket,
  scores: SimulatorScores,
  changedMatchKey: string,
): SimulatorScores {
  const descendantKeys = getDescendantMatchKeys(bracket, changedMatchKey)
  if (descendantKeys.length === 0) return scores

  const next = { ...scores }
  for (const key of descendantKeys) {
    delete next[key]
  }
  return next
}

export function getSimulatorPickedSide(
  match: KnockoutMatch,
  picks: SimulatorPicks,
): SimulatorPickSide | null {
  if (isRealFinishedMatch(match) && !match.isProjected && !picks[match.key]) return null
  return picks[match.key] ?? null
}

export function getSimulatedChampion(
  bracket: KnockoutBracket,
  picks: SimulatorPicks = {},
  scores: SimulatorScores = {},
): KnockoutParticipant | null {
  const finalRound = bracket.rounds.find((round) => round.stage === 'FINAL')
  const finalMatch = finalRound?.matches[0]
  if (!finalMatch) return null
  return resolveSimulatedWinner(finalMatch, picks, scores)
}
