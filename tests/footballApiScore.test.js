import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  resolvePenaltyScoreFromApi,
  resolveRegulationScoreFromApi,
} from '../shared/footballApiScore.js'

describe('shared footballApiScore', () => {
  it('prefers regularTime over inflated fullTime when penalties are present', () => {
    const score = resolveRegulationScoreFromApi({
      fullTime: { home: 3, away: 4 },
      regularTime: { home: 1, away: 1 },
      penalties: { home: 2, away: 3 },
    })

    assert.deepEqual(score, { home: 1, away: 1 })
  })

  it('falls back to fullTime when regularTime is absent', () => {
    const score = resolveRegulationScoreFromApi({
      fullTime: { home: 2, away: 0 },
    })

    assert.deepEqual(score, { home: 2, away: 0 })
  })

  it('returns penalty shootout score only after a regulation draw', () => {
    assert.deepEqual(
      resolvePenaltyScoreFromApi({
        fullTime: { home: 3, away: 4 },
        regularTime: { home: 1, away: 1 },
        penalties: { home: 2, away: 3 },
      }),
      { home: 2, away: 3 },
    )

    assert.equal(
      resolvePenaltyScoreFromApi({
        fullTime: { home: 2, away: 0 },
        penalties: { home: 2, away: 0 },
      }),
      null,
    )
  })
})
