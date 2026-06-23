import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { computeBetScore, isBetScoreSyncCandidate, needsBetScoreSync } from '../server/lib/rankingSync.js'

describe('rankingSync', () => {
  it('marks pending sync when bet score row is missing', () => {
    const computed = computeBetScore(null, { match_id: 10, home_score: 1, away_score: 0 })

    assert.equal(computed.scoreType, 'pending')
    assert.equal(needsBetScoreSync(null, computed), true)
  })

  it('skips sync when pending bet already stored as pending', () => {
    const computed = computeBetScore(null, { match_id: 10, home_score: 1, away_score: 0 })
    const existing = {
      score_type: 'pending',
      points: 0,
      winner_points: 0,
      home_team_points: 0,
      away_team_points: 0,
      actual_home_score: null,
      actual_away_score: null,
    }

    assert.equal(needsBetScoreSync(existing, computed), false)
  })

  it('syncs when finished match result becomes available', () => {
    const match = { status: 'finished', score: { home: 2, away: 1 } }
    const computed = computeBetScore(match, {
      match_id: 10,
      home_score: 2,
      away_score: 1,
      winner_pick: 'home',
    })
    const existing = {
      score_type: 'pending',
      points: 0,
      winner_points: 0,
      home_team_points: 0,
      away_team_points: 0,
      actual_home_score: null,
      actual_away_score: null,
    }

    assert.equal(computed.scoreType, 'exact')
    assert.equal(needsBetScoreSync(existing, computed), true)
  })

  it('skips sync when stored score already matches computed result', () => {
    const match = { status: 'finished', score: { home: 2, away: 1 } }
    const computed = computeBetScore(match, {
      match_id: 10,
      home_score: 2,
      away_score: 1,
      winner_pick: 'home',
    })
    const existing = {
      score_type: 'exact',
      points: 12,
      winner_points: 2,
      home_team_points: 0,
      away_team_points: 0,
      actual_home_score: 2,
      actual_away_score: 1,
    }

    assert.equal(needsBetScoreSync(existing, computed), false)
  })

  it('syncs when football API corrects a finished match result', () => {
    const match = { status: 'finished', score: { home: 3, away: 1 } }
    const computed = computeBetScore(match, {
      match_id: 10,
      home_score: 2,
      away_score: 1,
      winner_pick: 'home',
    })
    const existing = {
      score_type: 'exact',
      points: 12,
      winner_points: 2,
      home_team_points: 0,
      away_team_points: 0,
      actual_home_score: 2,
      actual_away_score: 1,
    }

    assert.equal(computed.scoreType, 'partial')
    assert.equal(needsBetScoreSync(existing, computed), true)
  })

  it('includes finalized bets as sync candidates', () => {
    assert.equal(isBetScoreSyncCandidate({ score_type: 'exact' }), true)
    assert.equal(isBetScoreSyncCandidate({ score_type: 'partial' }), true)
    assert.equal(isBetScoreSyncCandidate({ score_type: 'none' }), true)
    assert.equal(isBetScoreSyncCandidate({ score_type: 'pending' }), true)
    assert.equal(isBetScoreSyncCandidate({ score_type: null }), true)
  })
})
