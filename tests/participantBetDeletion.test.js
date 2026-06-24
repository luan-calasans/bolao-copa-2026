import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import {
  canParticipantDeleteByMatchStatus,
  PARTICIPANT_BET_DELETION_BLOCKED_MESSAGE,
  PARTICIPANT_CHAMPION_BET_DELETION_BLOCKED_MESSAGE,
} from '../shared/participantBetDeletion.js'
import {
  getParticipantOwnedBetDeletionBlockReason,
  resetParticipantBetDeletionOverrides,
  setParticipantBetDeletionOverrides,
} from '../server/lib/participantBetDeletion.js'

describe('participantBetDeletion shared', () => {
  it('blocks deletion only for finished matches', () => {
    assert.equal(canParticipantDeleteByMatchStatus('scheduled'), true)
    assert.equal(canParticipantDeleteByMatchStatus('live'), true)
    assert.equal(canParticipantDeleteByMatchStatus('finished'), false)
  })

  it('exposes user-facing blocked messages', () => {
    assert.match(PARTICIPANT_BET_DELETION_BLOCKED_MESSAGE, /encerrado/)
    assert.match(PARTICIPANT_CHAMPION_BET_DELETION_BLOCKED_MESSAGE, /final/)
  })
})

describe('getParticipantOwnedBetDeletionBlockReason', () => {
  afterEach(() => {
    resetParticipantBetDeletionOverrides()
  })

  it('blocks match bets when the game is finished', async () => {
    setParticipantBetDeletionOverrides({
      fetchMatchById: async () => ({ status: 'finished' }),
    })

    const message = await getParticipantOwnedBetDeletionBlockReason({
      matchId: 42,
      matchSnapshot: { status: 'scheduled' },
      isChampion: false,
    })

    assert.equal(message, PARTICIPANT_BET_DELETION_BLOCKED_MESSAGE)
  })

  it('allows match bets while the game is not finished', async () => {
    setParticipantBetDeletionOverrides({
      fetchMatchById: async () => ({ status: 'live' }),
    })

    const message = await getParticipantOwnedBetDeletionBlockReason({
      matchId: 42,
      matchSnapshot: { status: 'scheduled' },
      isChampion: false,
    })

    assert.equal(message, null)
  })

  it('blocks champion bets when the final is finished', async () => {
    setParticipantBetDeletionOverrides({
      fetchWorldCupMatchesForChampion: async () => [
        {
          stage: 'FINAL',
          utcDate: '2026-07-19T20:00:00Z',
          status: 'finished',
        },
      ],
    })

    const message = await getParticipantOwnedBetDeletionBlockReason({
      isChampion: true,
    })

    assert.equal(message, PARTICIPANT_CHAMPION_BET_DELETION_BLOCKED_MESSAGE)
  })
})
