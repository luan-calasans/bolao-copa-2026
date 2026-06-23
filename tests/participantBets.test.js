import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizePersonNameKey } from '../shared/participantKey.js'

function filterBetsByPersonNameKey(bets, personNameKey) {
  return bets.filter((bet) => normalizePersonNameKey(bet.personName) === personNameKey)
}

describe('filterBetsByPersonNameKey', () => {
  it('filters bets by normalized participant key', () => {
    const bets = [
      {
        receiptId: 'r1',
        matchId: 1,
        homeScore: 1,
        awayScore: 0,
        personName: 'João',
        createdAt: '2026-01-01T00:00:00.000Z',
        generatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        receiptId: 'r2',
        matchId: 2,
        homeScore: 0,
        awayScore: 0,
        personName: 'Maria',
        createdAt: '2026-01-01T00:00:00.000Z',
        generatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    const filtered = filterBetsByPersonNameKey(bets, 'joao')

    assert.equal(filtered.length, 1)
    assert.equal(filtered[0]?.receiptId, 'r1')
  })
})
