import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { assertBetScoresAllowed, assertMatchAcceptsBets } from '../server/lib/matchBetRules.js'
import { ValidationError } from '../server/lib/validateInput.js'

const TEAMS = {
  homeTeam: { name: 'Brasil' },
  awayTeam: { name: 'Argentina' },
}

function buildApiMatch(overrides = {}) {
  return {
    status: 'SCHEDULED',
    utcDate: '2030-06-15T20:00:00.000Z',
    score: { fullTime: { home: null, away: null } },
    ...TEAMS,
    ...overrides,
  }
}

describe('assertMatchAcceptsBets', () => {
  const realNow = Date.now

  afterEach(() => {
    Date.now = realNow
  })

  it('accepts upcoming scheduled matches', () => {
    Date.now = () => new Date('2026-06-15T12:00:00.000Z').getTime()
    assert.doesNotThrow(() => assertMatchAcceptsBets(buildApiMatch()))
  })

  it('rejects scheduled matches after kickoff', () => {
    const kickoff = '2026-06-15T20:00:00.000Z'
    Date.now = () => new Date('2026-06-15T20:00:01.000Z').getTime()

    assert.throws(
      () => assertMatchAcceptsBets(buildApiMatch({ utcDate: kickoff })),
      (error) => {
        assert.equal(error instanceof ValidationError, true)
        assert.match(error.message, /já iniciou/)
        return true
      },
    )
  })

  it('rejects finished matches', () => {
    assert.throws(() => assertMatchAcceptsBets(buildApiMatch({ status: 'FINISHED' })), /encerrado/)
  })

  it('rejects matches without defined teams', () => {
    assert.throws(
      () =>
        assertMatchAcceptsBets(
          buildApiMatch({
            homeTeam: { name: '' },
            awayTeam: { name: 'Argentina' },
          }),
        ),
      /times definidos/,
    )
  })

  it('accepts live matches', () => {
    assert.doesNotThrow(() =>
      assertMatchAcceptsBets(
        buildApiMatch({
          status: 'IN_PLAY',
          score: { fullTime: { home: 1, away: 0 } },
        }),
      ),
    )
  })
})

describe('assertBetScoresAllowed', () => {
  it('requires live minimum scores', () => {
    assert.throws(
      () =>
        assertBetScoresAllowed(
          buildApiMatch({
            status: 'IN_PLAY',
            score: { fullTime: { home: 2, away: 1 } },
          }),
          1,
          1,
        ),
      (error) => {
        assert.equal(error instanceof ValidationError, true)
        assert.match(error.message, /mandante já marcou 2/)
        return true
      },
    )
  })

  it('allows live scores at or above current goals', () => {
    assert.doesNotThrow(() =>
      assertBetScoresAllowed(
        buildApiMatch({
          status: 'LIVE',
          score: { fullTime: { home: 1, away: 0 } },
        }),
        2,
        1,
      ),
    )
  })

  it('rejects scores above the configured maximum', () => {
    assert.throws(() => assertBetScoresAllowed(buildApiMatch(), 21, 0), /entre 0 e 20/)
  })
})
