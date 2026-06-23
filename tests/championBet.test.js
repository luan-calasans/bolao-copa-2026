import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  canAcceptChampionBet,
  getChampionBetBlockReason,
  getChampionBetDeadlineMs,
} from '../shared/championBetAcceptance.js'
import { getChampionBetScore } from '../shared/championBetScoring.js'
import { CHAMPION_BET_POINTS } from '../shared/championBetConstants.js'

describe('championBetAcceptance', () => {
  const finalMatch = {
    stage: 'FINAL',
    utcDate: '2026-07-19T19:00:00Z',
    status: 'scheduled',
  }

  it('blocks bets one day before final kickoff', () => {
    const deadlineMs = getChampionBetDeadlineMs(finalMatch)
    assert.ok(deadlineMs)

    assert.equal(canAcceptChampionBet(finalMatch, deadlineMs - 1), true)
    assert.equal(canAcceptChampionBet(finalMatch, deadlineMs), false)
    assert.equal(
      getChampionBetBlockReason(finalMatch, deadlineMs),
      'O prazo para palpitar o campeão encerrou um dia antes da final.',
    )
  })

  it('blocks bets after final is finished', () => {
    assert.equal(
      getChampionBetBlockReason({ ...finalMatch, status: 'finished' }),
      'O palpite de campeão não está mais disponível porque a final já foi encerrada.',
    )
  })
})

describe('championBetScoring', () => {
  const finalMatch = {
    status: 'finished',
    homeTeam: { id: 10 },
    awayTeam: { id: 20 },
    score: {
      winner: 'HOME_TEAM',
      home: 2,
      away: 1,
    },
  }

  it('awards 10 points for correct champion pick', () => {
    assert.deepEqual(getChampionBetScore(10, finalMatch), {
      points: CHAMPION_BET_POINTS,
      scoreType: 'exact',
    })
  })

  it('returns pending before final ends', () => {
    assert.deepEqual(
      getChampionBetScore(10, { ...finalMatch, status: 'scheduled' }),
      {
        points: 0,
        scoreType: 'pending',
      },
    )
  })

  it('returns none for wrong pick', () => {
    assert.deepEqual(getChampionBetScore(20, finalMatch), {
      points: 0,
      scoreType: 'none',
    })
  })
})
