import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getBetScore as getServerBetScore } from '../server/lib/betScoring.js'
import { getBetScore as getSharedBetScore } from '../shared/betScoring.js'

const PARITY_CASES = [
  {
    name: 'pending scheduled match',
    match: { status: 'scheduled', score: { home: null, away: null } },
    homeScore: 1,
    awayScore: 0,
  },
  {
    name: 'exact finished match',
    match: { status: 'finished', score: { home: 2, away: 1 } },
    homeScore: 2,
    awayScore: 1,
  },
  {
    name: 'partial finished match',
    match: { status: 'finished', score: { home: 2, away: 1 } },
    homeScore: 1,
    awayScore: 0,
  },
  {
    name: 'wrong outcome',
    match: { status: 'finished', score: { home: 2, away: 1 } },
    homeScore: 0,
    awayScore: 0,
  },
  {
    name: 'outcome match but goal difference too large',
    match: { status: 'finished', score: { home: 6, away: 0 } },
    homeScore: 1,
    awayScore: 0,
  },
  {
    name: 'partial with same winning team',
    match: { status: 'finished', score: { home: 3, away: 1 } },
    homeScore: 3,
    awayScore: 0,
  },
]

describe('betScoring parity', () => {
  for (const testCase of PARITY_CASES) {
    it(`shared and server scoring stay aligned for ${testCase.name}`, () => {
      const shared = getSharedBetScore(testCase.match, testCase.homeScore, testCase.awayScore)
      const server = getServerBetScore(testCase.match, testCase.homeScore, testCase.awayScore)

      assert.deepEqual(server, shared)
    })
  }
})
