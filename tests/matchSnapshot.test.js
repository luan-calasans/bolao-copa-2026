import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildMatchSnapshot } from '../server/lib/matchSnapshot.js'

describe('matchSnapshot', () => {
  it('builds normalized match snapshot from api payload', () => {
    const snapshot = buildMatchSnapshot({
      id: 42,
      status: 'SCHEDULED',
      utcDate: '2026-06-15T20:00:00Z',
      minute: null,
      venue: 'Arena',
      matchday: 1,
      stage: 'GROUP_STAGE',
      group: 'GROUP_A',
      homeTeam: {
        id: 1,
        name: 'Brasil',
        shortName: 'Brasil',
        tla: 'BRA',
        crest: 'https://crests.football-data.org/1.png',
      },
      awayTeam: {
        id: 2,
        name: 'Argentina',
        shortName: 'Argentina',
        tla: 'ARG',
        crest: 'https://crests.football-data.org/2.png',
      },
      score: {
        fullTime: { home: null, away: null },
      },
    })

    assert.equal(snapshot.id, 42)
    assert.equal(snapshot.status, 'scheduled')
    assert.equal(snapshot.homeTeam.crest, '/api/crests/1.png')
    assert.equal(snapshot.awayTeam.name, 'Argentina')
    assert.equal(snapshot.isLive, false)
  })
})
