import { describe, expect, it } from 'vitest'
import type { BetsTableItem } from '../models/betsTable'
import type { Match } from '../models/match'
import { canParticipantDeleteBetItem } from './participantBetDeletion'

function buildItem(status: Match['status']): BetsTableItem {
  return {
    matchId: 1,
    match: { status } as Match,
    row: {
      entry: {
        receiptId: 'receipt-1',
        matchId: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        generatedAt: '2026-01-01T00:00:00.000Z',
      },
      displayName: 'João',
      resultStatus: 'pending',
      points: null,
    },
  }
}

describe('canParticipantDeleteBetItem', () => {
  it('allows deletion for open matches', () => {
    expect(canParticipantDeleteBetItem(buildItem('scheduled'))).toBe(true)
    expect(canParticipantDeleteBetItem(buildItem('live'))).toBe(true)
  })

  it('blocks deletion for finished matches', () => {
    expect(canParticipantDeleteBetItem(buildItem('finished'))).toBe(false)
  })

  it('allows deletion when match status is unknown', () => {
    expect(canParticipantDeleteBetItem({ ...buildItem('scheduled'), match: null })).toBe(true)
  })
})
