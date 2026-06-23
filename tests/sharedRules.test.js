import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getBetScore, SCORING_RULES } from '../shared/betScoring.js'
import {
  BET_BLOCKED_MESSAGES,
  canAcceptBets,
  getBetAcceptanceBlockReason,
} from '../shared/matchBetAcceptance.js'
import { validateBetScores, validatePersonName, validateBetContent } from '../shared/betValidation.js'
import {
  mergeBetComplement,
  validateBetComplement,
} from '../shared/betComplement.js'
import { isLiveStatus, normalizeMatchStatus } from '../shared/matchStatus.js'

describe('shared matchStatus', () => {
  it('normalizes api statuses', () => {
    assert.equal(normalizeMatchStatus('LIVE'), 'live')
    assert.equal(normalizeMatchStatus('FINISHED'), 'finished')
    assert.equal(normalizeMatchStatus('SCHEDULED'), 'scheduled')
    assert.equal(normalizeMatchStatus('POSTPONED'), 'postponed')
    assert.equal(normalizeMatchStatus('CANCELLED'), 'cancelled')
    assert.equal(normalizeMatchStatus('UNKNOWN'), 'other')
  })

  it('detects live statuses', () => {
    assert.equal(isLiveStatus('IN_PLAY'), true)
    assert.equal(isLiveStatus('PAUSED'), true)
    assert.equal(isLiveStatus('SCHEDULED'), false)
  })
})

describe('shared betScoring', () => {
  const finishedMatch = {
    status: 'finished',
    score: { home: 2, away: 1 },
  }

  it('returns pending for unfinished matches', () => {
    const score = getBetScore({ status: 'scheduled', score: { home: null, away: null } }, 1, 0)

    assert.equal(score.scoreType, 'pending')
    assert.equal(score.points, 0)
  })

  it('scores exact matches with 10 points', () => {
    const score = getBetScore(finishedMatch, 2, 1)

    assert.equal(score.scoreType, 'exact')
    assert.equal(score.points, 10)
    assert.equal(score.actualHomeScore, 2)
    assert.equal(score.actualAwayScore, 1)
  })

  it('scores partial when the winning team or draw matches within 3 goals', () => {
    assert.equal(getBetScore(finishedMatch, 1, 0).scoreType, 'partial')
    assert.equal(getBetScore(finishedMatch, 1, 0).points, 3)
    assert.equal(getBetScore(finishedMatch, 3, 0).scoreType, 'partial')
    assert.equal(getBetScore(finishedMatch, 4, 1).scoreType, 'partial')
  })

  it('does not score partial when the outcome matches but goal difference exceeds 3', () => {
    const match = { status: 'finished', score: { home: 6, away: 0 } }

    assert.equal(getBetScore(match, 1, 0).scoreType, 'none')
    assert.equal(getBetScore(match, 1, 0).points, 0)
    assert.equal(getBetScore(match, 3, 0).scoreType, 'partial')
    assert.equal(getBetScore(match, 5, 0).scoreType, 'partial')
    assert.equal(getBetScore(match, 2, 0).scoreType, 'none')
    assert.equal(getBetScore(match, 1, 1).scoreType, 'none')
  })

  it('scores 3x0 as partial against final 3x1', () => {
    const match = { status: 'finished', score: { home: 3, away: 1 } }

    assert.equal(getBetScore(match, 3, 1).scoreType, 'exact')
    assert.equal(getBetScore(match, 3, 0).scoreType, 'partial')
    assert.equal(getBetScore(match, 3, 0).points, 3)
    assert.equal(getBetScore(match, 2, 1).scoreType, 'partial')
  })

  it('scores draw predictions as partial when the match ends in a draw', () => {
    const match = { status: 'finished', score: { home: 2, away: 2 } }

    assert.equal(getBetScore(match, 2, 2).scoreType, 'exact')
    assert.equal(getBetScore(match, 1, 1).scoreType, 'partial')
    assert.equal(getBetScore(match, 0, 0).scoreType, 'none')
    assert.equal(getBetScore(match, 3, 3).scoreType, 'partial')
  })

  it('scores away win predictions as partial when the away team wins', () => {
    const match = { status: 'finished', score: { home: 1, away: 3 } }

    assert.equal(getBetScore(match, 0, 2).scoreType, 'partial')
    assert.equal(getBetScore(match, 1, 2).scoreType, 'partial')
    assert.equal(getBetScore(match, 1, 3).scoreType, 'exact')
  })

  it('scores wrong outcome as none', () => {
    assert.equal(getBetScore(finishedMatch, 0, 0).scoreType, 'none')
    assert.equal(getBetScore(finishedMatch, 0, 0).points, 0)
    assert.equal(getBetScore(finishedMatch, 1, 1).scoreType, 'none')
    assert.equal(getBetScore(finishedMatch, 0, 1).scoreType, 'none')
  })

  it('awards 2 points for a correct winner pick without score', () => {
    const score = getBetScore(finishedMatch, null, null, 'home')

    assert.equal(score.scoreType, 'pending')
    assert.equal(score.winnerPoints, 2)
    assert.equal(score.points, 2)
  })

  it('does not score null score picks after the match ends', () => {
    const score = getBetScore(finishedMatch, null, null, 'away')

    assert.equal(score.scoreType, 'pending')
    assert.equal(score.points, 0)
  })

  it('awards 2 points for a correct winner pick', () => {
    const score = getBetScore(finishedMatch, 0, 2, 'home')

    assert.equal(score.scoreType, 'none')
    assert.equal(score.winnerPoints, 2)
    assert.equal(score.points, 2)
  })

  it('combines exact score and winner pick points', () => {
    const score = getBetScore(finishedMatch, 2, 1, 'home')

    assert.equal(score.scoreType, 'exact')
    assert.equal(score.winnerPoints, 2)
    assert.equal(score.points, 12)
  })

  it('exposes scoring rules for api and ui', () => {
    assert.equal(SCORING_RULES.length, 4)
    assert.match(SCORING_RULES[0].title, /Placar exato/)
    assert.match(SCORING_RULES[1].title, /Acerto parcial/)
    assert.match(SCORING_RULES[1].items[0].title, /Placar/)
    assert.match(SCORING_RULES[1].items[1].title, /Quem vence/)
    assert.match(SCORING_RULES[3].title, /Campeão da Copa/)
  })
})

describe('shared matchBetAcceptance', () => {
  const kickoff = '2026-06-15T20:00:00.000Z'
  const beforeKickoff = new Date('2026-06-15T19:59:59.000Z').getTime()
  const afterKickoff = new Date('2026-06-15T20:00:01.000Z').getTime()

  it('accepts upcoming scheduled matches', () => {
    assert.equal(
      canAcceptBets(
        { teamsDefined: true, status: 'scheduled', utcDate: kickoff },
        beforeKickoff,
      ),
      true,
    )
  })

  it('rejects scheduled matches after kickoff', () => {
    assert.equal(
      getBetAcceptanceBlockReason(
        { teamsDefined: true, status: 'scheduled', utcDate: kickoff },
        afterKickoff,
      ),
      BET_BLOCKED_MESSAGES.kickoffPassed,
    )
  })

  it('accepts live matches regardless of kickoff time', () => {
    assert.equal(
      canAcceptBets({ teamsDefined: true, status: 'live', utcDate: kickoff }, afterKickoff),
      true,
    )
  })

  it('rejects matches without defined teams', () => {
    assert.equal(
      getBetAcceptanceBlockReason({ teamsDefined: false, status: 'scheduled', utcDate: kickoff }),
      BET_BLOCKED_MESSAGES.noTeams,
    )
  })
})

describe('shared betValidation', () => {
  it('validates person names consistently', () => {
    assert.equal(validatePersonName(''), 'Informe seu nome no bolão.')
    assert.equal(validatePersonName('Jo\u0007ao'), 'Nome inválido.')
    assert.equal(validatePersonName('João3'), 'Não é permitido usar números no nome.')
    assert.equal(validatePersonName('João'), null)
  })

  it('validates live minimum scores and max score', () => {
    assert.match(validateBetScores(2, 1, 1, 1) ?? '', /mandante já marcou 2/)
    assert.equal(validateBetScores(0, 0, 21, 0), 'Informe placares válidos entre 0 e 20.')
    assert.equal(validateBetScores(0, 0, 2, 1), null)
    assert.equal(validateBetScores(0, 0, null, null), null)
  })

  it('requires at least winner or score pick', () => {
    assert.match(validateBetContent(null, null, null) ?? '', /Informe quem vence/)
    assert.equal(validateBetContent('home', null, null), null)
    assert.equal(validateBetContent(null, 2, 1), null)
    assert.equal(validateBetContent('away', 2, 1), null)
  })
})

describe('shared betComplement', () => {
  it('merges missing winner into an existing score-only bet', () => {
    const merged = mergeBetComplement(
      { homeScore: 2, awayScore: 1, winnerPick: null },
      { homeScore: null, awayScore: null, winnerPick: 'home' },
    )

    assert.deepEqual(merged, { homeScore: 2, awayScore: 1, winnerPick: 'home' })
    assert.equal(
      validateBetComplement(
        { homeScore: 2, awayScore: 1, winnerPick: null },
        { homeScore: null, awayScore: null, winnerPick: 'home' },
      ),
      null,
    )
  })

  it('rejects changing an existing score', () => {
    assert.match(
      validateBetComplement(
        { homeScore: 2, awayScore: 1, winnerPick: null },
        { homeScore: 3, awayScore: 1, winnerPick: 'home' },
      ) ?? '',
      /placar deste jogo/,
    )
  })
})
